package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// initDatabase 初始化数据库
func initDatabase() error {
	cfg := GetConfig()

	// 确保数据目录存在（仅对SQLite）
	if cfg.Database.Driver == "sqlite" {
		if err := os.MkdirAll("./data", 0755); err != nil {
			return fmt.Errorf("failed to create data directory: %v", err)
		}
	}

	// 根据驱动类型连接数据库
	var err error
	switch cfg.Database.Driver {
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "mysql":
		db, err = gorm.Open(mysql.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "postgres":
		db, err = gorm.Open(postgres.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	default:
		return fmt.Errorf("unsupported database driver: %s", cfg.Database.Driver)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// 自动迁移表结构
	if err := db.AutoMigrate(&Session{}, &Record{}, &ReplaySession{}, &ReplayRecord{}, &PlaygroundSession{}, &PlaygroundRecord{}); err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	log.Printf("Database initialized successfully with driver: %s", cfg.Database.Driver)
	return nil
}

// saveTraceData 保存埋点数据
func saveTraceData(trace *TraceRequest) error {
	// 开始事务
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 检查或创建会话
	if err := ensureSession(tx, trace.SessionID); err != nil {
		tx.Rollback()
		return err
	}

	// 序列化数据
	requestJSON, err := json.Marshal(trace.Request)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	var responseJSON []byte
	if trace.Response != nil {
		responseJSON, err = json.Marshal(trace.Response)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	var metadataJSON []byte
	if trace.Metadata != nil {
		metadataJSON, err = json.Marshal(trace.Metadata)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to marshal metadata: %v", err)
		}
	}

	// 创建记录
	record := &Record{
		ID:         uuid.New().String(),
		SessionID:  trace.SessionID,
		TurnNumber: trace.TurnNumber,
		Request:    string(requestJSON),
		Response:   string(responseJSON),
		Status:     trace.Status,
		ErrorMsg:   trace.ErrorMessage,
		Metadata:   string(metadataJSON),
	}

	if err := tx.Create(record).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create record: %v", err)
	}

	// 提交事务
	return tx.Commit().Error
}

// ensureSession 确保会话存在
func ensureSession(tx *gorm.DB, sessionID string) error {
	var count int64
	if err := tx.Model(&Session{}).Where("id = ?", sessionID).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check session: %v", err)
	}

	if count == 0 {
		// 会话不存在，创建新会话
		session := &Session{
			ID:   sessionID,
			Name: fmt.Sprintf("对话-%s", time.Now().Format("2006-01-02 15:04:05")),
		}
		if err := tx.Create(session).Error; err != nil {
			return fmt.Errorf("failed to create session: %v", err)
		}
	}
	return nil
}

// getSessions 获取会话列表
func getSessions(page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&Session{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count sessions: %v", err)
	}

	var sessions []Session
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to query sessions: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       sessions,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getSessionRecords 获取会话记录
func getSessionRecords(sessionID string, page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&Record{}).Where("session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count records: %v", err)
	}

	var records []Record
	offset := (page - 1) * size
	if err := db.Where("session_id = ?", sessionID).
		Order("turn_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to query records: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       records,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getRecord 获取单条记录
func getRecord(recordID string) (*Record, error) {
	var record Record
	if err := db.Where("id = ?", recordID).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get record: %v", err)
	}
	return &record, nil
}

// deleteRecord 删除记录
func deleteRecord(recordID string) error {
	result := db.Where("id = ?", recordID).Delete(&Record{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete record: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("record not found")
	}
	return nil
}

// createReplaySession 创建重放会话
func createReplaySession(req *CreateReplaySessionRequest) (*ReplaySession, error) {
	// 检查原始会话是否存在
	var originalSession Session
	if err := db.Where("id = ?", req.OriginalSessionID).First(&originalSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original session not found")
		}
		return nil, fmt.Errorf("failed to check original session: %v", err)
	}

	// 生成会话名称
	sessionName := req.Name
	if sessionName == "" {
		sessionName = fmt.Sprintf("调试-%s-轮次%d", originalSession.Name, req.StartTurnNumber)
	}

	// 创建重放会话
	replaySession := &ReplaySession{
		ID:                uuid.New().String(),
		Name:              sessionName,
		OriginalSessionID: req.OriginalSessionID,
		StartTurnNumber:   req.StartTurnNumber,
		Status:            "active",
	}

	if err := db.Create(replaySession).Error; err != nil {
		return nil, fmt.Errorf("failed to create replay session: %v", err)
	}

	return replaySession, nil
}

// getReplaySessions 获取重放会话列表
func getReplaySessions(page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&ReplaySession{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count replay sessions: %v", err)
	}

	var replaySessions []ReplaySession
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&replaySessions).Error; err != nil {
		return nil, fmt.Errorf("failed to query replay sessions: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       replaySessions,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getReplaySession 获取单个重放会话
func getReplaySession(sessionID string) (*ReplaySession, error) {
	var replaySession ReplaySession
	if err := db.Where("id = ?", sessionID).First(&replaySession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get replay session: %v", err)
	}
	return &replaySession, nil
}

// getReplaySessionRecords 获取重放会话记录
func getReplaySessionRecords(sessionID string, page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&ReplayRecord{}).Where("replay_session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count replay records: %v", err)
	}

	var replayRecords []ReplayRecord
	offset := (page - 1) * size
	if err := db.Where("replay_session_id = ?", sessionID).
		Order("turn_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&replayRecords).Error; err != nil {
		return nil, fmt.Errorf("failed to query replay records: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       replayRecords,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// saveReplayRecord 保存重放记录
func saveReplayRecord(replaySessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}) error {
	// 序列化数据
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	var responseJSON []byte
	if response != nil {
		responseJSON, err = json.Marshal(response)
		if err != nil {
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	var configJSON []byte
	if config != nil {
		configJSON, err = json.Marshal(config)
		if err != nil {
			return fmt.Errorf("failed to marshal config: %v", err)
		}
	}

	// 创建重放记录
	replayRecord := &ReplayRecord{
		ID:              uuid.New().String(),
		ReplaySessionID: replaySessionID,
		TurnNumber:      turnNumber,
		Request:         string(requestJSON),
		Response:        string(responseJSON),
		Status:          status,
		ErrorMsg:        errorMsg,
		Provider:        provider,
		Model:           model,
		Config:          string(configJSON),
	}

	if err := db.Create(replayRecord).Error; err != nil {
		return fmt.Errorf("failed to create replay record: %v", err)
	}

	return nil
}

// updateReplaySessionStatus 更新重放会话状态
func updateReplaySessionStatus(sessionID string, status string) error {
	result := db.Model(&ReplaySession{}).Where("id = ?", sessionID).Update("status", status)
	if result.Error != nil {
		return fmt.Errorf("failed to update replay session status: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("replay session not found")
	}
	return nil
}

// deleteReplaySession 删除重放会话
func deleteReplaySession(sessionID string) error {
	// 开始事务
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除相关的重放记录
	if err := tx.Where("replay_session_id = ?", sessionID).Delete(&ReplayRecord{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete replay records: %v", err)
	}

	// 删除重放会话
	if err := tx.Where("id = ?", sessionID).Delete(&ReplaySession{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete replay session: %v", err)
	}

	return tx.Commit().Error
}

// createPlaygroundSession 创建 Playground 会话
func createPlaygroundSession(req *CreatePlaygroundRequest) (*PlaygroundSession, error) {
	// 检查原始会话是否存在
	var originalSession Session
	if err := db.Where("id = ?", req.OriginalSessionID).First(&originalSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original session not found")
		}
		return nil, fmt.Errorf("failed to check original session: %v", err)
	}

	// 检查原始轮次是否存在
	var originalRecord Record
	if err := db.Where("session_id = ? AND turn_number = ?", req.OriginalSessionID, req.OriginalTurnNumber).First(&originalRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original turn not found")
		}
		return nil, fmt.Errorf("failed to check original turn: %v", err)
	}

	// 生成会话名称
	sessionName := req.Name
	if sessionName == "" {
		sessionName = fmt.Sprintf("Playground-%s-轮次%d", time.Now().Format("01-02 15:04"), req.OriginalTurnNumber)
	}

	// 创建 Playground 会话
	playgroundSession := &PlaygroundSession{
		ID:                 uuid.New().String(),
		Name:               sessionName,
		OriginalSessionID:  req.OriginalSessionID,
		OriginalTurnNumber: req.OriginalTurnNumber,
		Status:             "active",
	}

	if err := db.Create(playgroundSession).Error; err != nil {
		return nil, fmt.Errorf("failed to create playground session: %v", err)
	}

	return playgroundSession, nil
}

// getPlaygroundSessions 获取 Playground 会话列表
func getPlaygroundSessions(page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&PlaygroundSession{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count playground sessions: %v", err)
	}

	var playgroundSessions []PlaygroundSession
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&playgroundSessions).Error; err != nil {
		return nil, fmt.Errorf("failed to query playground sessions: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       playgroundSessions,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getPlaygroundSession 获取单个 Playground 会话
func getPlaygroundSession(sessionID string) (*PlaygroundSession, error) {
	var playgroundSession PlaygroundSession
	if err := db.Where("id = ?", sessionID).First(&playgroundSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get playground session: %v", err)
	}
	return &playgroundSession, nil
}

// getPlaygroundSessionRecords 获取 Playground 会话记录
func getPlaygroundSessionRecords(sessionID string, page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&PlaygroundRecord{}).Where("playground_session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count playground records: %v", err)
	}

	var playgroundRecords []PlaygroundRecord
	offset := (page - 1) * size
	if err := db.Where("playground_session_id = ?", sessionID).
		Order("test_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&playgroundRecords).Error; err != nil {
		return nil, fmt.Errorf("failed to query playground records: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       playgroundRecords,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// savePlaygroundRecord 保存 Playground 记录
func savePlaygroundRecord(playgroundSessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}) error {
	// 序列化数据
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	var responseJSON []byte
	if response != nil {
		responseJSON, err = json.Marshal(response)
		if err != nil {
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	var configJSON []byte
	if config != nil {
		configJSON, err = json.Marshal(config)
		if err != nil {
			return fmt.Errorf("failed to marshal config: %v", err)
		}
	}

	// 创建 Playground 记录
	playgroundRecord := &PlaygroundRecord{
		ID:                  uuid.New().String(),
		PlaygroundSessionID: playgroundSessionID,
		TurnNumber:          turnNumber,
		Request:             string(requestJSON),
		Response:            string(responseJSON),
		Status:              status,
		ErrorMsg:            errorMsg,
		Provider:            provider,
		Model:               model,
		Config:              string(configJSON),
	}

	if err := db.Create(playgroundRecord).Error; err != nil {
		return fmt.Errorf("failed to create playground record: %v", err)
	}

	return nil
}

// getNextTurnNumber 获取下一个轮次编号
func getNextTurnNumber(playgroundSessionID string) (int, error) {
	var maxTurnNumber int
	if err := db.Model(&PlaygroundRecord{}).
		Where("playground_session_id = ?", playgroundSessionID).
		Select("COALESCE(MAX(turn_number), 0)").
		Scan(&maxTurnNumber).Error; err != nil {
		return 0, fmt.Errorf("failed to get max turn number: %v", err)
	}
	return maxTurnNumber + 1, nil
}

// deletePlaygroundSession 删除 Playground 会话
func deletePlaygroundSession(sessionID string) error {
	// 开始事务
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除相关的 Playground 记录
	if err := tx.Where("playground_session_id = ?", sessionID).Delete(&PlaygroundRecord{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete playground records: %v", err)
	}

	// 删除 Playground 会话
	if err := tx.Where("id = ?", sessionID).Delete(&PlaygroundSession{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete playground session: %v", err)
	}

	return tx.Commit().Error
}

// createPlaygroundRecord 在指定 playground 中创建记录
func createPlaygroundRecord(playgroundSessionID string, req *CreatePlaygroundRecordRequest) (*PlaygroundRecord, error) {
	// 检查 playground 会话是否存在
	var playgroundSession PlaygroundSession
	if err := db.Where("id = ?", playgroundSessionID).First(&playgroundSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("playground session not found")
		}
		return nil, fmt.Errorf("failed to check playground session: %v", err)
	}

	// 获取原始记录
	var originalRecord Record
	if err := db.Where("id = ?", req.OriginalRecordID).First(&originalRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original record not found")
		}
		return nil, fmt.Errorf("failed to get original record: %v", err)
	}

	// 检查轮次是否已存在
	var existingRecord PlaygroundRecord
	if err := db.Where("playground_session_id = ? AND turn_number = ?", playgroundSessionID, req.TurnNumber).First(&existingRecord).Error; err == nil {
		return nil, fmt.Errorf("turn number %d already exists in this playground session", req.TurnNumber)
	}

	// 创建 playground 记录
	playgroundRecord := &PlaygroundRecord{
		ID:                  uuid.New().String(),
		PlaygroundSessionID: playgroundSessionID,
		TurnNumber:          req.TurnNumber,
		OriginalRecordID:    req.OriginalRecordID,
		Request:             originalRecord.Request,
		Response:            originalRecord.Response,
		Status:              originalRecord.Status,
		ErrorMsg:            originalRecord.ErrorMsg,
		Provider:            "",
		Model:               "",
		Config:              "",
	}

	if err := db.Create(playgroundRecord).Error; err != nil {
		return nil, fmt.Errorf("failed to create playground record: %v", err)
	}

	return playgroundRecord, nil
}

// executePlaygroundDebug 执行 playground 调试
func executePlaygroundDebug(playgroundSessionID string, turnNumber int, newRequest interface{}, provider string, model string, config interface{}) (*PlaygroundRecord, error) {
	// 获取配置
	cfg := GetConfig()

	// 根据provider选择配置
	var apiKey string
	var baseURL string

	// 不区分大小写查找provider
	var providerConfig ProviderConfig
	var found bool
	for key, config := range cfg.Providers {
		if strings.EqualFold(key, provider) || strings.EqualFold(config.Name, provider) {
			providerConfig = config
			found = true
			break
		}
	}

	if found {
		apiKey = providerConfig.APIKey
		baseURL = providerConfig.BaseURL
	}

	if apiKey == "" {
		return nil, fmt.Errorf("API key not configured for provider: %s", provider)
	}

	// 创建客户端配置
	clientConfig := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		clientConfig.BaseURL = baseURL
	}

	// 创建客户端
	client := openai.NewClientWithConfig(clientConfig)

	// 解析新的请求数据
	requestJSON, err := json.Marshal(newRequest)
	if err != nil {
		return nil, err
	}

	// 尝试解析为ChatCompletion请求
	var chatReq openai.ChatCompletionRequest
	if err := json.Unmarshal(requestJSON, &chatReq); err == nil {
		// 设置正确的模型名称
		if model != "" {
			chatReq.Model = model
		}

		// 应用调试配置
		if config != nil {
			configMap, ok := config.(map[string]interface{})
			if ok {
				if temp, exists := configMap["temperature"]; exists {
					if tempFloat, ok := temp.(float64); ok {
						chatReq.Temperature = float32(tempFloat)
					}
				}
				if maxTokens, exists := configMap["max_tokens"]; exists {
					if maxTokensInt, ok := maxTokens.(int); ok {
						chatReq.MaxTokens = maxTokensInt
					}
				}
				if topP, exists := configMap["top_p"]; exists {
					if topPFloat, ok := topP.(float64); ok {
						chatReq.TopP = float32(topPFloat)
					}
				}
				if freqPenalty, exists := configMap["frequency_penalty"]; exists {
					if freqPenaltyFloat, ok := freqPenalty.(float64); ok {
						chatReq.FrequencyPenalty = float32(freqPenaltyFloat)
					}
				}
				if presPenalty, exists := configMap["presence_penalty"]; exists {
					if presPenaltyFloat, ok := presPenalty.(float64); ok {
						chatReq.PresencePenalty = float32(presPenaltyFloat)
					}
				}
			}
		}

		ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
		defer cancel()

		// 调用OpenAI API
		resp, err := client.CreateChatCompletion(ctx, chatReq)

		// 保存调试结果
		status := "success"
		errorMsg := ""
		if err != nil {
			status = "error"
			errorMsg = err.Error()
		}

		// 更新 playground 记录
		if err := updatePlaygroundRecord(playgroundSessionID, turnNumber, newRequest, resp, status, errorMsg, provider, model, config); err != nil {
			return nil, err
		}

		if err != nil {
			return nil, err
		}

		responseJSON, err := json.Marshal(resp)
		if err != nil {
			return nil, err
		}

		return &PlaygroundRecord{
			ID:                  uuid.New().String(),
			PlaygroundSessionID: playgroundSessionID,
			TurnNumber:          turnNumber,
			Request:             string(requestJSON),
			Response:            string(responseJSON),
			Status:              status,
			Provider:            provider,
			Model:               model,
			Config: func() string {
				if config != nil {
					if b, err := json.Marshal(config); err == nil {
						return string(b)
					}
				}
				return ""
			}(),
		}, nil
	}

	return nil, fmt.Errorf("unsupported request type")
}

// updatePlaygroundRecord 更新 playground 记录
func updatePlaygroundRecord(playgroundSessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}) error {
	// 序列化数据
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	var responseJSON []byte
	if response != nil {
		responseJSON, err = json.Marshal(response)
		if err != nil {
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	var configJSON []byte
	if config != nil {
		configJSON, err = json.Marshal(config)
		if err != nil {
			return fmt.Errorf("failed to marshal config: %v", err)
		}
	}

	// 更新记录
	result := db.Model(&PlaygroundRecord{}).
		Where("playground_session_id = ? AND turn_number = ?", playgroundSessionID, turnNumber).
		Updates(map[string]interface{}{
			"request":   string(requestJSON),
			"response":  string(responseJSON),
			"status":    status,
			"error_msg": errorMsg,
			"provider":  provider,
			"model":     model,
			"config":    string(configJSON),
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update playground record: %v", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("playground record not found")
	}

	return nil
}
