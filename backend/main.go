package main

import (
	"fmt"
	"log"

	"llmTrace/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := GetConfig()

	// 初始化数据库
	if err := initDatabase(); err != nil {
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

		// 会话管理（生产环境）
		api.GET("/sessions", handlers.HandleGetSessions)
		api.GET("/sessions/:id/records", handlers.HandleGetSessionRecords)

		// 记录管理（生产环境）
		api.GET("/records/:id", handlers.HandleGetRecord)
		api.POST("/records/:id/replay", handlers.HandleReplayRecord)
		api.DELETE("/records/:id", handlers.HandleDeleteRecord)

		// Playground 管理（新的调试环境）
		api.POST("/playground-sessions", handlers.HandleCreatePlaygroundSession)
		api.GET("/playground-sessions", handlers.HandleGetPlaygroundSessions)
		api.GET("/playground-sessions/:id", handlers.HandleGetPlaygroundSession)
		api.DELETE("/playground-sessions/:id", handlers.HandleDeletePlaygroundSession)

		// Playground 记录管理
		api.POST("/playground-sessions/:id/records", handlers.HandleCreatePlaygroundRecord)
		api.GET("/playground-sessions/:id/records", handlers.HandleGetPlaygroundSessionRecords)

		// Playground 调试
		api.POST("/playground-sessions/:id/debug", handlers.HandlePlaygroundDebug)

		// Provider管理
		api.GET("/providers", handlers.HandleGetProviders)
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
