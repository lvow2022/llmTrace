package main

import (
	"time"
)

// TraceRequest 埋点请求数据结构
type TraceRequest struct {
	SessionID    string      `json:"session_id" binding:"required"`
	TurnNumber   int         `json:"turn_number" binding:"required"`
	Request      interface{} `json:"request" binding:"required"`
	Response     interface{} `json:"response"`
	Status       string      `json:"status" binding:"required"` // success/error/pending
	ErrorMessage string      `json:"error_message"`
	Metadata     interface{} `json:"metadata"`
}

// Session 对话会话（生产环境）
type Session struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

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

// CreateReplaySessionRequest 创建重放会话请求
type CreateReplaySessionRequest struct {
	OriginalSessionID string `json:"original_session_id" binding:"required"`
	StartTurnNumber   int    `json:"start_turn_number" binding:"required"`
	Name              string `json:"name"`
}

// ReplayRequest 重放请求（用于单次重放）
type ReplayRequest struct {
	SessionID  string      `json:"session_id" binding:"required"`
	TurnNumber int         `json:"turn_number" binding:"required"`
	Request    interface{} `json:"request" binding:"required"`
	Provider   string      `json:"provider"`
	Model      string      `json:"model"`
}

// ReplayDebugRequest 调试重放请求（用于多轮调试）
type ReplayDebugRequest struct {
	ReplaySessionID string      `json:"replay_session_id" binding:"required"`
	TurnNumber      int         `json:"turn_number" binding:"required"`
	Request         interface{} `json:"request" binding:"required"`
	Provider        string      `json:"provider"`
	Model           string      `json:"model"`
	Config          interface{} `json:"config"` // 调试配置
}

// ModelInfo 模型信息
type ModelInfo struct {
	Name    string `json:"name"`
	Model   string `json:"model"`
	Enabled bool   `json:"enabled"`
}

// ProviderInfo Provider信息
type ProviderInfo struct {
	Name    string      `json:"name"`
	Type    string      `json:"type"`
	Enabled bool        `json:"enabled"`
	Models  []ModelInfo `json:"models,omitempty"`
}

// API响应结构
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// 分页响应结构
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Size       int         `json:"size"`
	TotalPages int         `json:"total_pages"`
}
