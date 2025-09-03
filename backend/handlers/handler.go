package handlers

import (
	"github.com/gin-gonic/gin"
	"llmTrace/config"
)

type Handler struct {
	conf *config.Config
}

func NewHandler() *Handler {
	return &Handler{
		conf: config.GetConfig(),
	}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	// API路由组
	api := r.Group("/api")
	{
		// 埋点接口
		api.POST("/trace", h.HandleTrace)

		// session 管理
		api.GET("/sessions", h.HandleGetSessions)                   // 获取会话列表
		api.GET("/sessions/:id/records", h.HandleGetSessionRecords) //获取指定会话的记录

		// record 管理
		api.GET("/records/:id", h.HandleGetRecord) //获取单条记录详情

		// Playground 管理
		api.POST("/playground", h.HandleCreatePlayground)       // 创建 playground
		api.GET("/playground", h.HandleGetPlaygrounds)          // 获取 playground 列表
		api.GET("/playground/:id", h.HandleGetPlayground)       // 获取 playground 详情
		api.DELETE("/playground/:id", h.HandleDeletePlayground) // 删除 playground

		// Debug Session 管理（在 playground 中）
		api.GET("/playground/:id/sessions", h.HandleGetDebugSessions)                  // 获取调试会话列表
		api.GET("/playground/:id/sessions/:session_id", h.HandleGetDebugSession)       // 获取调试会话详情（包含所有记录）
		api.DELETE("/playground/:id/sessions/:session_id", h.HandleDeleteDebugSession) // 删除调试会话

		// 直接从 trace_record 创建 debug_session（新增）
		api.POST("/records/:record_id/create-debug-session", h.HandleCreateDebugSessionFromRecord) // 从记录创建调试会话

		// 执行调试
		api.POST("/playground/:id/sessions/:session_id/debug", h.HandlePlaygroundDebug) // 执行调试

		// Provider管理
		api.GET("/providers", h.HandleGetProviders)
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
