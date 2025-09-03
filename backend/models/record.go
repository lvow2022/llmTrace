package models

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// Record 调用记录（生产环境）
type Record struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	SessionID  uint      `json:"session_id" gorm:"not null;index"`
	TurnNumber int       `json:"turn_number" gorm:"not null"`
	Request    string    `json:"request" gorm:"type:text;not null"`
	Response   string    `json:"response" gorm:"type:text"`
	Status     string    `json:"status" gorm:"type:varchar(50);not null"`
	ErrorMsg   string    `json:"error_msg" gorm:"type:text"`
	Metadata   string    `json:"metadata" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime;index"`
}

// SaveTraceRecord 保存埋点数据
func SaveTraceRecord(sessionID uint, turnNumber int, request interface{}, response interface{}, status string, errorMsg string, metadata interface{}) error {
	// 序列化请求数据
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	// 序列化响应数据
	var responseJSON []byte
	if response != nil {
		responseJSON, err = json.Marshal(response)
		if err != nil {
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	// 序列化元数据
	var metadataJSON []byte
	if metadata != nil {
		metadataJSON, err = json.Marshal(metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %v", err)
		}
	}

	// 创建记录
	record := &Record{
		SessionID:  sessionID,
		TurnNumber: turnNumber,
		Request:    string(requestJSON),
		Response:   string(responseJSON),
		Status:     status,
		ErrorMsg:   errorMsg,
		Metadata:   string(metadataJSON),
	}

	if err := db.Create(record).Error; err != nil {
		return fmt.Errorf("failed to create record: %v", err)
	}

	return nil
}

// GetSessionRecordsByID 获取会话记录
func GetSessionRecordsByID(sessionID uint, page, size int) ([]Record, int64, error) {
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

// GetRecordByID 获取单条记录
func GetRecordByID(recordID uint) (*Record, error) {
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
func DeleteRecord(recordID uint) error {
	result := db.Where("id = ?", recordID).Delete(&Record{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete record: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("record not found")
	}
	return nil
}
