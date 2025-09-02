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

		// 会话管理
		api.GET("/sessions", handlers.HandleGetSessions)                   // 获取会话列表
		api.GET("/sessions/:id/records", handlers.HandleGetSessionRecords) //获取指定会话的记录

		// 记录管理
		api.GET("/records/:id", handlers.HandleGetRecord)            //获取单条记录详情
		api.POST("/records/:id/replay", handlers.HandleReplayRecord) //重放单条记录
		api.DELETE("/records/:id", handlers.HandleDeleteRecord)      //删除记录

		// Playground 管理
		api.POST("/playground", handlers.HandleCreatePlaygroundSession)       // 创建 playground 会话
		api.GET("/playground", handlers.HandleGetPlaygroundSessions)          // 获取 playground 会话列表
		api.GET("/playground/:id", handlers.HandleGetPlaygroundSession)       // 获取 playground 会话详情
		api.DELETE("/playground/:id", handlers.HandleDeletePlaygroundSession) // 删除 playground 会话

		// Playground 记录管理
		api.POST("/playground/:id/records", handlers.HandleCreatePlaygroundRecord)     // 在指定 playground 中创建记录
		api.GET("/playground/:id/records", handlers.HandleGetPlaygroundSessionRecords) // 获取 playground 会话的所有记录

		// Playground 调试
		api.POST("/playground-sessions/:id/debug", handlers.HandlePlaygroundDebug) //在指定的 playground 中执行调试

		// Provider管理
		api.GET("/providers", handlers.HandleGetProviders)
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
