package models

import (
	"fmt"
	"time"
)

// Session 对话会话（生产环境）
type Session struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// GetSessions 获取会话列表
func GetSessions(page, size int) ([]Session, int64, error) {
	var total int64
	if err := db.Model(&Session{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count sessions: %v", err)
	}

	var sessions []Session
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&sessions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to query sessions: %v", err)
	}

	return sessions, total, nil
}

// EnsureSession 确保会话存在
func EnsureSession(sessionID string) error {
	var count int64
	if err := db.Model(&Session{}).Where("id = ?", sessionID).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check session: %v", err)
	}

	if count == 0 {
		// 会话不存在，创建新会话
		session := &Session{
			ID:   sessionID,
			Name: fmt.Sprintf("对话-%s", time.Now().Format("2006-01-02 15:04:05")),
		}
		if err := db.Create(session).Error; err != nil {
			return fmt.Errorf("failed to create session: %v", err)
		}
	}
	return nil
}
