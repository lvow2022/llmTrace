package models

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// PlaygroundRecord Playground 测试记录
type PlaygroundRecord struct {
	ID                  string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	PlaygroundSessionID string    `json:"playground_session_id" gorm:"type:varchar(255);not null;index"`
	TurnNumber          int       `json:"turn_number" gorm:"not null"`                       // 在 playground 中的轮次
	OriginalRecordID    string    `json:"original_record_id" gorm:"type:varchar(255);index"` // 原始记录ID
	Request             string    `json:"request" gorm:"type:text;not null"`                 // 请求内容
	Response            string    `json:"response" gorm:"type:text"`                         // 响应内容
	Status              string    `json:"status" gorm:"type:varchar(50);not null"`           // success/error
	ErrorMsg            string    `json:"error_msg" gorm:"type:text"`                        // 错误信息
	Provider            string    `json:"provider" gorm:"type:varchar(100)"`                 // 使用的提供商
	Model               string    `json:"model" gorm:"type:varchar(100)"`                    // 使用的模型
	Config              string    `json:"config" gorm:"type:text"`                           // 调试配置（温度、token等）
	CreatedAt           time.Time `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt           time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// ReplaySession 重放调试会话
type ReplaySession struct {
	ID                string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Name              string    `json:"name" gorm:"type:varchar(255);not null"`
	OriginalSessionID string    `json:"original_session_id" gorm:"type:varchar(255);not null;index"`
	StartTurnNumber   int       `json:"start_turn_number" gorm:"not null"`
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:'active'"` // active/completed
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// PlaygroundSession Playground 会话
type PlaygroundSession struct {
	ID                 string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Name               string    `json:"name" gorm:"type:varchar(255);not null"`
	OriginalSessionID  string    `json:"original_session_id" gorm:"type:varchar(255);not null;index"`
	OriginalTurnNumber int       `json:"original_turn_number" gorm:"not null"`
	Status             string    `json:"status" gorm:"type:varchar(50);not null;default:'active'"` // active/completed
	CreatedAt          time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt          time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// CreatePlaygroundSession 创建 Playground 会话
func CreatePlaygroundSession(originalSessionID string, originalTurnNumber int, name string) (*PlaygroundSession, error) {
	// 检查原始会话是否存在
	var originalSession Session
	if err := db.Where("id = ?", originalSessionID).First(&originalSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original session not found")
		}
		return nil, fmt.Errorf("failed to check original session: %v", err)
	}

	// 检查原始轮次是否存在
	var originalRecord Record
	if err := db.Where("session_id = ? AND turn_number = ?", originalSessionID, originalTurnNumber).First(&originalRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original turn not found")
		}
		return nil, fmt.Errorf("failed to check original turn: %v", err)
	}

	// 生成会话名称
	sessionName := name
	if sessionName == "" {
		sessionName = fmt.Sprintf("Playground-%s-轮次%d", time.Now().Format("01-02 15:04"), originalTurnNumber)
	}

	// 创建 Playground 会话
	playgroundSession := &PlaygroundSession{
		ID:                 uuid.New().String(),
		Name:               sessionName,
		OriginalSessionID:  originalSessionID,
		OriginalTurnNumber: originalTurnNumber,
		Status:             "active",
	}

	if err := db.Create(playgroundSession).Error; err != nil {
		return nil, fmt.Errorf("failed to create playground session: %v", err)
	}

	return playgroundSession, nil
}

// GetPlaygroundSessions 获取 Playground 会话列表
func GetPlaygroundSessions(page, size int) ([]PlaygroundSession, int64, error) {
	var total int64
	if err := db.Model(&PlaygroundSession{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count playground sessions: %v", err)
	}

	var playgroundSessions []PlaygroundSession
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&playgroundSessions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query playground sessions: %v", err)
	}

	return playgroundSessions, total, nil
}

// GetPlaygroundSession 获取单个 Playground 会话
func GetPlaygroundSession(sessionID string) (*PlaygroundSession, error) {
	var playgroundSession PlaygroundSession
	if err := db.Where("id = ?", sessionID).First(&playgroundSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get playground session: %v", err)
	}
	return &playgroundSession, nil
}

// GetPlaygroundSessionRecords 获取 Playground 会话记录
func GetPlaygroundSessionRecords(sessionID string, page, size int) ([]PlaygroundRecord, int64, error) {
	var total int64
	if err := db.Model(&PlaygroundRecord{}).Where("playground_session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count playground records: %v", err)
	}

	var playgroundRecords []PlaygroundRecord
	offset := (page - 1) * size
	if err := db.Where("playground_session_id = ?", sessionID).
		Order("turn_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&playgroundRecords).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query playground records: %v", err)
	}

	return playgroundRecords, total, nil
}

// SavePlaygroundRecord 保存 Playground 记录
func SavePlaygroundRecord(playgroundSessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}) error {
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

// GetNextTurnNumber 获取下一个轮次编号
func GetNextTurnNumber(playgroundSessionID string) (int, error) {
	var maxTurnNumber int
	if err := db.Model(&PlaygroundRecord{}).
		Where("playground_session_id = ?", playgroundSessionID).
		Select("COALESCE(MAX(turn_number), 0)").
		Scan(&maxTurnNumber).Error; err != nil {
		return 0, fmt.Errorf("failed to get max turn number: %v", err)
	}
	return maxTurnNumber + 1, nil
}

// DeletePlaygroundSession 删除 Playground 会话
func DeletePlaygroundSession(sessionID string) error {
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

// CreatePlaygroundRecord 在指定 playground 中创建记录
func CreatePlaygroundRecord(playgroundSessionID string, originalRecordID string, turnNumber int) (*PlaygroundRecord, error) {
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
	if err := db.Where("id = ?", originalRecordID).First(&originalRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original record not found")
		}
		return nil, fmt.Errorf("failed to get original record: %v", err)
	}

	// 检查轮次是否已存在
	var existingRecord PlaygroundRecord
	if err := db.Where("playground_session_id = ? AND turn_number = ?", playgroundSessionID, turnNumber).First(&existingRecord).Error; err == nil {
		return nil, fmt.Errorf("turn number %d already exists in this playground session", turnNumber)
	}

	// 创建 playground 记录
	playgroundRecord := &PlaygroundRecord{
		ID:                  uuid.New().String(),
		PlaygroundSessionID: playgroundSessionID,
		TurnNumber:          turnNumber,
		OriginalRecordID:    originalRecordID,
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

// ExecutePlaygroundDebug 执行 playground 调试
func ExecutePlaygroundDebug(playgroundSessionID string, turnNumber int, newRequest interface{}, provider string, model string, config interface{}, providerConfigs map[string]ProviderConfig) (*PlaygroundRecord, error) {
	// 根据provider选择配置
	var apiKey string
	var baseURL string

	// 不区分大小写查找provider
	var providerConfig ProviderConfig
	var found bool
	for key, config := range providerConfigs {
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
		if err := UpdatePlaygroundRecord(playgroundSessionID, turnNumber, newRequest, resp, status, errorMsg, provider, model, config); err != nil {
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

// UpdatePlaygroundRecord 更新 playground 记录
func UpdatePlaygroundRecord(playgroundSessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}) error {
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

// ProviderConfig 单个Provider配置
type ProviderConfig struct {
	Name    string   `mapstructure:"name"`
	APIKey  string   `mapstructure:"api_key"`
	BaseURL string   `mapstructure:"base_url"`
	Enabled bool     `mapstructure:"enabled"`
	Models  []string `mapstructure:"models"`
}
