package main

import (
	"fmt"
	"llmTrace/models"
	"log"

	"llmTrace/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := GetConfig()

	// 初始化数据库
	if err := models.InitDatabase(cfg.Database.Driver, cfg.Database.DSN); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// 设置Gin模式
	gin.SetMode(gin.DebugMode)

	// 创建Gin路由
	r := gin.Default()

	// 配置CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// 设置路由
	setupRoutes(r)

	// 启动服务器
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Starting server on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(r *gin.Engine) {
	// API路由组
	api := r.Group("/api")
	{
		// 埋点接口
		api.POST("/trace", handlers.HandleTrace)

		// session 管理
		api.GET("/sessions", handlers.HandleGetSessions)                   // 获取会话列表
		api.GET("/sessions/:id/records", handlers.HandleGetSessionRecords) //获取指定会话的记录

		// record 管理
		api.GET("/records/:id", handlers.HandleGetRecord) //获取单条记录详情

		// Playground 管理
		api.POST("/playground", handlers.HandleCreatePlayground)       // 创建 playground
		api.GET("/playground", handlers.HandleGetPlaygrounds)          // 获取 playground 列表
		api.GET("/playground/:id", handlers.HandleGetPlayground)       // 获取 playground 详情
		api.DELETE("/playground/:id", handlers.HandleDeletePlayground) // 删除 playground

		// Debug Session 管理（在 playground 中）
		api.GET("/playground/:id/sessions", handlers.HandleGetDebugSessions)                  // 获取调试会话列表
		api.GET("/playground/:id/sessions/:session_id", handlers.HandleGetDebugSession)       // 获取调试会话详情（包含所有记录）
		api.DELETE("/playground/:id/sessions/:session_id", handlers.HandleDeleteDebugSession) // 删除调试会话

		// 直接从 trace_record 创建 debug_session（新增）
		api.POST("/records/:record_id/create-debug-session", handlers.HandleCreateDebugSessionFromRecord) // 从记录创建调试会话

		// 执行调试
		api.POST("/playground/:id/sessions/:session_id/debug", handlers.HandlePlaygroundDebug) // 执行调试

		// Provider管理
		api.GET("/providers", handlers.HandleGetProviders)
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
