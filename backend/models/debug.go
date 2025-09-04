package models

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// Playground Playground 环境
type Playground struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"type:varchar(255);not null"`                   // playground 名称
	Description string    `json:"description" gorm:"type:text"`                             // playground 描述
	Status      string    `json:"status" gorm:"type:varchar(50);not null;default:'active'"` // active/inactive
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// DebugSession 调试会话
type DebugSession struct {
	ID                uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	PlaygroundID      uint      `json:"playground_id" gorm:"not null;index"`
	OriginalSessionID uint      `json:"original_session_id" gorm:"not null;index"`
	OriginalRecordID  uint      `json:"original_record_id" gorm:"not null;index"`
	Name              string    `json:"name" gorm:"type:varchar(255);not null"`
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:'active'"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// DebugRecord 调试记录
type DebugRecord struct {
	ID             uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	DebugSessionID uint      `json:"debug_session_id" gorm:"not null;index"`
	TurnNumber     int       `json:"turn_number" gorm:"not null"`
	Request        string    `json:"request" gorm:"type:text;not null"`
	Response       string    `json:"response" gorm:"type:text"`
	Status         string    `json:"status" gorm:"type:varchar(50);not null"`
	ErrorMsg       string    `json:"error_msg" gorm:"type:text"`
	Provider       string    `json:"provider" gorm:"type:varchar(100)"`
	Model          string    `json:"model" gorm:"type:varchar(100)"`
	Config         string    `json:"config" gorm:"type:text"`
	Duration       int64     `json:"duration" gorm:"type:bigint"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// CreatePlayground 创建 Playground
func CreatePlayground(name, description string) (*Playground, error) {
	playground := &Playground{
		Name:        name,
		Description: description,
		Status:      "active",
	}

	if err := db.Create(playground).Error; err != nil {
		return nil, fmt.Errorf("failed to create playground: %v", err)
	}

	return playground, nil
}

// GetPlaygrounds 获取 Playground 列表
func GetPlaygrounds(page, size int) ([]Playground, int64, error) {
	var total int64
	if err := db.Model(&Playground{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count playgrounds: %v", err)
	}

	var playgrounds []Playground
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&playgrounds).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query playgrounds: %v", err)
	}

	return playgrounds, total, nil
}

// GetPlayground 获取单个 Playground
func GetPlayground(playgroundID uint) (*Playground, error) {
	var playground Playground
	if err := db.Where("id = ?", playgroundID).First(&playground).Error; err != nil {
		return nil, err
	}
	return &playground, nil
}

// GetDebugSessionsByPlayground 获取指定 playground 的所有调试会话
func GetDebugSessionsByPlayground(playgroundID uint) ([]DebugSession, error) {
	var sessions []DebugSession
	if err := db.Where("playground_id = ?", playgroundID).
		Order("created_at DESC").
		Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get debug sessions for playground %d: %v", playgroundID, err)
	}
	return sessions, nil
}

func DeletePlayground(playgroundID uint) error {
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

	// 删除相关的调试会话
	if err := tx.Where("playground_id = ?", playgroundID).Delete(&DebugSession{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除 Playground
	if err := tx.Where("id = ?", playgroundID).Delete(&Playground{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// CreateDebugSession 创建调试会话
func CreateDebugSession(playgroundID, originalSessionID, originalRecordID uint, name string) (*DebugSession, error) {
	// 检查 playground 是否存在
	var playground Playground
	if err := db.Where("id = ?", playgroundID).First(&playground).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}

	// 检查原始会话是否存在
	var originalSession Session
	if err := db.Where("id = ?", originalSessionID).First(&originalSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}

	// 检查原始记录是否存在
	var originalRecord Record
	if err := db.Where("id = ?", originalRecordID).First(&originalRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}

	// 生成会话名称
	sessionName := name
	if sessionName == "" {
		sessionName = fmt.Sprintf("调试-%s-轮次%d", time.Now().Format("01-02 15:04"), originalRecord.TurnNumber)
	}

	// 创建调试会话
	debugSession := &DebugSession{
		PlaygroundID:      playgroundID,
		OriginalSessionID: originalSessionID,
		OriginalRecordID:  originalRecordID,
		Name:              sessionName,
		Status:            "active",
	}

	if err := db.Create(debugSession).Error; err != nil {
		return nil, err
	}

	return debugSession, nil
}

// GetDebugSessions 获取调试会话列表
func GetDebugSessions(playgroundID uint, page, size int) ([]DebugSession, int64, error) {
	var total int64
	query := db.Model(&DebugSession{})
	if playgroundID > 0 {
		query = query.Where("playground_id = ?", playgroundID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count debug sessions: %v", err)
	}

	var debugSessions []DebugSession
	offset := (page - 1) * size
	if err := query.Order("created_at DESC").Offset(offset).Limit(size).Find(&debugSessions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query debug sessions: %v", err)
	}

	return debugSessions, total, nil
}

// GetDebugSession 获取单个调试会话
func GetDebugSession(sessionID uint) (*DebugSession, error) {
	var debugSession DebugSession
	if err := db.Where("id = ?", sessionID).First(&debugSession).Error; err != nil {
		return nil, err
	}
	return &debugSession, nil
}

// GetDebugSessionRecords 获取调试会话记录
func GetDebugSessionRecords(sessionID uint, page, size int) ([]DebugRecord, int64, error) {
	var total int64
	if err := db.Model(&DebugRecord{}).Where("debug_session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var debugRecords []DebugRecord
	offset := (page - 1) * size
	if err := db.Where("debug_session_id = ?", sessionID).Offset(offset).Limit(size).Order("turn_number ASC").Find(&debugRecords).Error; err != nil {
		return nil, 0, err
	}

	return debugRecords, total, nil
}

// CreateDebugRecord 创建调试记录
func CreateDebugRecord(debugSessionID uint, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}, duration int64) (*DebugRecord, error) {
	// 序列化请求数据
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// 序列化响应数据
	var responseJSON []byte
	if response != nil {
		responseJSON, err = json.Marshal(response)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	// 序列化配置数据
	var configJSON []byte
	if config != nil {
		configJSON, err = json.Marshal(config)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal config: %v", err)
		}
	}

	// 创建调试记录
	debugRecord := &DebugRecord{
		DebugSessionID: debugSessionID,
		TurnNumber:     turnNumber,
		Request:        string(requestJSON),
		Response:       string(responseJSON),
		Status:         status,
		ErrorMsg:       errorMsg,
		Provider:       provider,
		Model:          model,
		Config:         string(configJSON),
		Duration:       duration,
	}

	if err := db.Create(debugRecord).Error; err != nil {
		return nil, fmt.Errorf("failed to create debug record: %v", err)
	}

	return debugRecord, nil
}

// GetNextDebugTurnNumber 获取下一个调试轮次编号
func GetNextDebugTurnNumber(debugSessionID string) (int, error) {
	var maxTurnNumber int
	if err := db.Model(&DebugRecord{}).
		Where("debug_session_id = ?", debugSessionID).
		Select("COALESCE(MAX(turn_number), 0)").
		Scan(&maxTurnNumber).Error; err != nil {
		return 0, err
	}
	return maxTurnNumber + 1, nil
}

// UpdateDebugRecord 更新调试记录
func UpdateDebugRecord(debugSessionID string, turnNumber int, request, response, status, errorMsg, provider, model, config string, duration int64) error {
	result := db.Model(&DebugRecord{}).
		Where("debug_session_id = ? AND turn_number = ?", debugSessionID, turnNumber).
		Updates(map[string]interface{}{
			"request":   request,
			"response":  response,
			"status":    status,
			"error_msg": errorMsg,
			"provider":  provider,
			"model":     model,
			"config":    config,
			"duration":  duration,
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("debug record not found")
	}

	return nil
}

// DeleteDebugSession 删除调试会话
func DeleteDebugSession(sessionID uint) error {
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

	// 删除相关的调试记录
	if err := tx.Where("debug_session_id = ?", sessionID).Delete(&DebugRecord{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除调试会话
	if err := tx.Where("id = ?", sessionID).Delete(&DebugSession{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
