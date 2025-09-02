package models

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Record 调用记录（生产环境）
type Record struct {
	ID         string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	SessionID  string    `json:"session_id" gorm:"type:varchar(255);not null;index"`
	TurnNumber int       `json:"turn_number" gorm:"not null"`
	Request    string    `json:"request" gorm:"type:text;not null"`
	Response   string    `json:"response" gorm:"type:text"`
	Status     string    `json:"status" gorm:"type:varchar(50);not null"`
	ErrorMsg   string    `json:"error_msg" gorm:"type:text"`
	Metadata   string    `json:"metadata" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime;index"`
}

// SaveTraceRecord 保存埋点数据
func SaveTraceRecord(sessionID string, turnNumber int, request interface{}, response interface{}, status string, errorMessage string, metadata interface{}) error {
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
	if err := EnsureSession(sessionID); err != nil {
		tx.Rollback()
		return err
	}

	// 序列化数据
	requestJSON, err := json.Marshal(request)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	var responseJSON []byte
	if response != nil {
		responseJSON, err = json.Marshal(response)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	var metadataJSON []byte
	if metadata != nil {
		metadataJSON, err = json.Marshal(metadata)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to marshal metadata: %v", err)
		}
	}

	// 创建记录
	record := &Record{
		ID:         uuid.New().String(),
		SessionID:  sessionID,
		TurnNumber: turnNumber,
		Request:    string(requestJSON),
		Response:   string(responseJSON),
		Status:     status,
		ErrorMsg:   errorMessage,
		Metadata:   string(metadataJSON),
	}

	if err := tx.Create(record).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create record: %v", err)
	}

	// 提交事务
	return tx.Commit().Error
}

// GetSessionRecords 获取会话记录
func GetSessionRecords(sessionID string, page, size int) ([]Record, int64, error) {
	var total int64
	if err := db.Model(&Record{}).Where("session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count records: %v", err)
	}

	var records []Record
	offset := (page - 1) * size
	if err := db.Where("session_id = ?", sessionID).
		Order("turn_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&records).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query records: %v", err)
	}

	return records, total, nil
}

// GetRecord 获取单条记录
func GetRecord(recordID string) (*Record, error) {
	var record Record
	if err := db.Where("id = ?", recordID).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get record: %v", err)
	}
	return &record, nil
}

// DeleteRecord 删除记录
func DeleteRecord(recordID string) error {
	result := db.Where("id = ?", recordID).Delete(&Record{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete record: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("record not found")
	}
	return nil
}
