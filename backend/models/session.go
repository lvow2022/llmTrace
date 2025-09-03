package models

import (
	"fmt"
	"time"
)

// Session 对话会话（生产环境）
type Session struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	TraceID   string    `json:"trace_id" gorm:"type:varchar(255);uniqueIndex;not null"`
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
func EnsureSession(traceID string) error {
	var count int64
	if err := db.Model(&Session{}).Where("trace_id = ?", traceID).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check session: %v", err)
	}

	if count == 0 {
		// 会话不存在，创建新会话
		session := &Session{
			TraceID: traceID,
			Name:    fmt.Sprintf("对话-%s", time.Now().Format("2006-01-02 15:04:05")),
		}
		if err := db.Create(session).Error; err != nil {
			return fmt.Errorf("failed to create session: %v", err)
		}
	}
	return nil
}

// GetSessionByTraceID 根据traceID获取session
func GetSessionByTraceID(traceID string) (*Session, error) {
	var session Session
	if err := db.Where("trace_id = ?", traceID).First(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to get session: %v", err)
	}
	return &session, nil
}
