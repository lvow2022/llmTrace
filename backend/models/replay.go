package models

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReplayRecord 重放调试记录
type ReplayRecord struct {
	ID              string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	ReplaySessionID string    `json:"replay_session_id" gorm:"type:varchar(255);not null;index"`
	TurnNumber      int       `json:"turn_number" gorm:"not null"`
	Request         string    `json:"request" gorm:"type:text;not null"`
	Response        string    `json:"response" gorm:"type:text"`
	Status          string    `json:"status" gorm:"type:varchar(50);not null"`
	ErrorMsg        string    `json:"error_msg" gorm:"type:text"`
	Provider        string    `json:"provider" gorm:"type:varchar(100)"`
	Model           string    `json:"model" gorm:"type:varchar(100)"`
	Config          string    `json:"config" gorm:"type:text"` // 调试配置（温度、token等）
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime;index"`
}

// CreateReplaySession 创建重放会话
func CreateReplaySession(originalSessionID string, startTurnNumber int, name string) (*ReplaySession, error) {
	// 检查原始会话是否存在
	var originalSession Session
	if err := db.Where("id = ?", originalSessionID).First(&originalSession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("original session not found")
		}
		return nil, fmt.Errorf("failed to check original session: %v", err)
	}

	// 生成会话名称
	sessionName := name
	if sessionName == "" {
		sessionName = fmt.Sprintf("调试-%s-轮次%d", originalSession.Name, startTurnNumber)
	}

	// 创建重放会话
	replaySession := &ReplaySession{
		ID:                uuid.New().String(),
		Name:              sessionName,
		OriginalSessionID: originalSessionID,
		StartTurnNumber:   startTurnNumber,
		Status:            "active",
	}

	if err := db.Create(replaySession).Error; err != nil {
		return nil, fmt.Errorf("failed to create replay session: %v", err)
	}

	return replaySession, nil
}

// GetReplaySessions 获取重放会话列表
func GetReplaySessions(page, size int) ([]ReplaySession, int64, error) {
	var total int64
	if err := db.Model(&ReplaySession{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count replay sessions: %v", err)
	}

	var replaySessions []ReplaySession
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&replaySessions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query replay sessions: %v", err)
	}

	return replaySessions, total, nil
}

// GetReplaySession 获取单个重放会话
func GetReplaySession(sessionID string) (*ReplaySession, error) {
	var replaySession ReplaySession
	if err := db.Where("id = ?", sessionID).First(&replaySession).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get replay session: %v", err)
	}
	return &replaySession, nil
}

// GetReplaySessionRecords 获取重放会话记录
func GetReplaySessionRecords(sessionID string, page, size int) ([]ReplayRecord, int64, error) {
	var total int64
	if err := db.Model(&ReplayRecord{}).Where("replay_session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count replay records: %v", err)
	}

	var replayRecords []ReplayRecord
	offset := (page - 1) * size
	if err := db.Where("replay_session_id = ?", sessionID).
		Order("turn_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&replayRecords).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query replay records: %v", err)
	}

	return replayRecords, total, nil
}

// SaveReplayRecord 保存重放记录
func SaveReplayRecord(replaySessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, provider string, model string, config interface{}) error {
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

// UpdateReplaySessionStatus 更新重放会话状态
func UpdateReplaySessionStatus(sessionID string, status string) error {
	result := db.Model(&ReplaySession{}).Where("id = ?", sessionID).Update("status", status)
	if result.Error != nil {
		return fmt.Errorf("failed to update replay session status: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("replay session not found")
	}
	return nil
}

// DeleteReplaySession 删除重放会话
func DeleteReplaySession(sessionID string) error {
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
