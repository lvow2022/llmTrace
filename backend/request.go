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

// Session 对话会话
type Session struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// Record 调用记录
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

// ReplayRequest 重放请求
type ReplayRequest struct {
	SessionID  string      `json:"session_id" binding:"required"`
	TurnNumber int         `json:"turn_number" binding:"required"`
	Request    interface{} `json:"request" binding:"required"`
	Provider   string      `json:"provider"` // 新增：指定provider
}

// ProviderInfo Provider信息
type ProviderInfo struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Enabled bool   `json:"enabled"`
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
