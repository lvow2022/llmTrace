package main

import (
	"fmt"
	"log"

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
		api.POST("/trace", handleTrace)

		// 会话管理
		api.GET("/sessions", handleGetSessions)
		api.GET("/sessions/:id/records", handleGetSessionRecords)

		// 记录管理
		api.POST("/records/:id/replay", handleReplayRecord)
		api.DELETE("/records/:id", handleDeleteRecord)

		// Provider管理
		api.GET("/providers", handleGetProviders)
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
