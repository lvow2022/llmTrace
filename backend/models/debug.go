package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Playground Playground 环境
type Playground struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Name        string    `json:"name" gorm:"type:varchar(255);not null"`                   // playground 名称
	Description string    `json:"description" gorm:"type:text"`                             // playground 描述
	Status      string    `json:"status" gorm:"type:varchar(50);not null;default:'active'"` // active/inactive
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// DebugSession 调试会话
type DebugSession struct {
	ID                string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	PlaygroundID      string    `json:"playground_id" gorm:"type:varchar(255);not null;index"`       // playground ID
	OriginalSessionID string    `json:"original_session_id" gorm:"type:varchar(255);not null;index"` // 来源会话ID
	OriginalRecordID  string    `json:"original_record_id" gorm:"type:varchar(255);not null;index"`  // 来源记录ID
	Name              string    `json:"name" gorm:"type:varchar(255);not null"`                      // 调试会话名称
	Status            string    `json:"status" gorm:"type:varchar(50);not null;default:'active'"`    // active/completed
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// DebugRecord 调试记录
type DebugRecord struct {
	ID             string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	DebugSessionID string    `json:"debug_session_id" gorm:"type:varchar(255);not null;index"` // 调试会话ID
	TurnNumber     int       `json:"turn_number" gorm:"not null"`                              // 在调试会话中的轮次
	Request        string    `json:"request" gorm:"type:text;not null"`                        // 请求内容
	Response       string    `json:"response" gorm:"type:text"`                                // 响应内容
	Status         string    `json:"status" gorm:"type:varchar(50);not null"`                  // success/error/pending
	ErrorMsg       string    `json:"error_msg" gorm:"type:text"`                               // 错误信息
	Provider       string    `json:"provider" gorm:"type:varchar(100)"`                        // 使用的提供商
	Model          string    `json:"model" gorm:"type:varchar(100)"`                           // 使用的模型
	Config         string    `json:"config" gorm:"type:text"`                                  // 调试配置（温度、token等）
	Duration       int64     `json:"duration" gorm:"type:bigint"`                              // 执行时长（毫秒）
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// CreatePlayground 创建 Playground
func CreatePlayground(name, description string) (*Playground, error) {
	playground := &Playground{
		ID:          uuid.New().String(),
		Name:        name,
		Description: description,
		Status:      "active",
	}

	if err := db.Create(playground).Error; err != nil {
		return nil, err
	}

	return playground, nil
}

// GetPlaygrounds 获取 Playground 列表
func GetPlaygrounds(page, size int) ([]Playground, int64, error) {
	var total int64
	if err := db.Model(&Playground{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var playgrounds []Playground
	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Order("created_at DESC").Find(&playgrounds).Error; err != nil {
		return nil, 0, err
	}

	return playgrounds, total, nil
}

// GetPlayground 获取单个 Playground
func GetPlayground(playgroundID string) (*Playground, error) {
	var playground Playground
	if err := db.Where("id = ?", playgroundID).First(&playground).Error; err != nil {
		return nil, err
	}
	return &playground, nil
}

// DeletePlayground 删除 Playground
func DeletePlayground(playgroundID string) error {
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
func CreateDebugSession(playgroundID, originalSessionID, originalRecordID, name string) (*DebugSession, error) {
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
		ID:                uuid.New().String(),
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
func GetDebugSessions(playgroundID string, page, size int) ([]DebugSession, int64, error) {
	var total int64
	if err := db.Model(&DebugSession{}).Where("playground_id = ?", playgroundID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var debugSessions []DebugSession
	offset := (page - 1) * size
	if err := db.Where("playground_id = ?", playgroundID).Offset(offset).Limit(size).Order("created_at DESC").Find(&debugSessions).Error; err != nil {
		return nil, 0, err
	}

	return debugSessions, total, nil
}

// GetDebugSession 获取单个调试会话
func GetDebugSession(sessionID string) (*DebugSession, error) {
	var debugSession DebugSession
	if err := db.Where("id = ?", sessionID).First(&debugSession).Error; err != nil {
		return nil, err
	}
	return &debugSession, nil
}

// GetDebugSessionRecords 获取调试会话记录
func GetDebugSessionRecords(sessionID string, page, size int) ([]DebugRecord, int64, error) {
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
func CreateDebugRecord(debugSessionID string, turnNumber int, request, response, status, errorMsg, provider, model, config string) (*DebugRecord, error) {
	// 检查调试会话是否存在
	var debugSession DebugSession
	if err := db.Where("id = ?", debugSessionID).First(&debugSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}

	// 检查轮次是否已存在
	var existingRecord DebugRecord
	if err := db.Where("debug_session_id = ? AND turn_number = ?", debugSessionID, turnNumber).First(&existingRecord).Error; err == nil {
		return nil, fmt.Errorf("turn number %d already exists in this debug session", turnNumber)
	}

	// 创建调试记录
	debugRecord := &DebugRecord{
		ID:             uuid.New().String(),
		DebugSessionID: debugSessionID,
		TurnNumber:     turnNumber,
		Request:        request,
		Response:       response,
		Status:         status,
		ErrorMsg:       errorMsg,
		Provider:       provider,
		Model:          model,
		Config:         config,
	}

	if err := db.Create(debugRecord).Error; err != nil {
		return nil, err
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
func DeleteDebugSession(sessionID string) error {
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
