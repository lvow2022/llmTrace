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
	OriginalRecordID  string `json:"original_record_id" binding:"required"` // 新增：原始记录ID
	StartTurnNumber   int    `json:"start_turn_number" binding:"required"`
	Name              string `json:"name"`
}

// CreatePlaygroundRequest 创建 Playground 请求
type CreatePlaygroundRequest struct {
	OriginalSessionID  string `json:"original_session_id" binding:"required"`  // 来源会话ID
	OriginalTurnNumber int    `json:"original_turn_number" binding:"required"` // 来源轮次
	Name               string `json:"name"`                                    // 可选，自动生成
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

// CreatePlaygroundRecordRequest 创建 Playground 记录请求
type CreatePlaygroundRecordRequest struct {
	OriginalRecordID string `json:"original_record_id" binding:"required"`
	TurnNumber       int    `json:"turn_number" binding:"required"` // 在 playground 中的轮次
}

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

// PlaygroundDebugRequest Playground 调试请求
type PlaygroundDebugRequest struct {
	TurnNumber int         `json:"turn_number" binding:"required"`
	Request    interface{} `json:"request" binding:"required"`
	Provider   string      `json:"provider" binding:"required"`
	Model      string      `json:"model" binding:"required"`
	Config     interface{} `json:"config"` // 调试配置（温度、token等）
}

// ReplayRequest 重放请求
type ReplayRequest struct {
	SessionID  string      `json:"session_id" binding:"required"`
	TurnNumber int         `json:"turn_number" binding:"required"`
	Request    interface{} `json:"request" binding:"required"`
	Provider   string      `json:"provider" binding:"required"`
	Model      string      `json:"model" binding:"required"`
}

// ReplayDebugRequest 重放调试请求
type ReplayDebugRequest struct {
	ReplaySessionID string      `json:"replay_session_id" binding:"required"`
	TurnNumber      int         `json:"turn_number" binding:"required"`
	Request         interface{} `json:"request" binding:"required"`
	Provider        string      `json:"provider" binding:"required"`
	Model           string      `json:"model" binding:"required"`
	Config          interface{} `json:"config"` // 调试配置（温度、token等）
}

// ModelInfo 模型信息
type ModelInfo struct {
	Name    string `json:"name"`
	Model   string `json:"model"`
	Enabled bool   `json:"enabled"`
}

// ProviderInfo Provider 信息
type ProviderInfo struct {
	Name    string      `json:"name"`
	Type    string      `json:"type"`
	Enabled bool        `json:"enabled"`
	Models  []ModelInfo `json:"models"`
}

// APIResponse 统一的API响应格式
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// PaginatedResponse 分页响应格式
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Size       int         `json:"size"`
	TotalPages int         `json:"total_pages"`
}
