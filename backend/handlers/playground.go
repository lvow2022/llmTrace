package handlers

import (
	"llmTrace/models"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// CreatePlaygroundRequest 创建 Playground 会话请求
type CreatePlaygroundRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// CreatePlaygroundRecordRequest 创建 Playground 记录请求
type CreatePlaygroundRecordRequest struct {
	TurnNumber int         `json:"turn_number"`
	Request    interface{} `json:"request"`
	Response   interface{} `json:"response,omitempty"`
	Status     string      `json:"status"`
}

// PlaygroundDebugRequest Playground 调试请求
type PlaygroundDebugRequest struct {
	TurnNumber int         `json:"turn_number"`
	Request    interface{} `json:"request"`
	Provider   string      `json:"provider"`
	Model      string      `json:"model"`
	Config     interface{} `json:"config,omitempty"`
}

// HandleCreatePlaygroundSession 创建 Playground 会话
func HandleCreatePlaygroundSession(c *gin.Context) {
	var req CreatePlaygroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 创建 Playground 会话
	playgroundSession, err := createPlaygroundSession(&req)
	if err != nil {
		sendInternalServerError(c, "Failed to create playground session: "+err.Error())
		return
	}

	sendSuccessResponse(c, playgroundSession)
}

// HandleGetPlaygroundSessions 获取 Playground 会话列表
func HandleGetPlaygroundSessions(c *gin.Context) {
	page, size := parsePaginationParams(c, 1, 20)

	// 获取 Playground 会话列表
	result, err := getPlaygroundSessions(page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get playground sessions: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleGetPlaygroundSession 获取单个 Playground 会话
func HandleGetPlaygroundSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Playground Session ID is required")
		return
	}

	// 获取 Playground 会话
	playgroundSession, err := getPlaygroundSession(sessionID)
	if err != nil {
		sendInternalServerError(c, "Failed to get playground session: "+err.Error())
		return
	}

	if playgroundSession == nil {
		sendNotFound(c, "Playground session not found")
		return
	}

	sendSuccessResponse(c, playgroundSession)
}

// HandleGetPlaygroundSessionRecords 获取 Playground 会话记录
func HandleGetPlaygroundSessionRecords(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Playground Session ID is required")
		return
	}

	page, size := parsePaginationParams(c, 1, 50)

	// 获取 Playground 会话记录
	result, err := getPlaygroundSessionRecords(sessionID, page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get playground session records: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleDeletePlaygroundSession 删除 Playground 会话
func HandleDeletePlaygroundSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Playground Session ID is required")
		return
	}

	// 删除 Playground 会话
	if err := deletePlaygroundSession(sessionID); err != nil {
		sendInternalServerError(c, "Failed to delete playground session: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Playground session deleted successfully")
}

// HandleCreatePlaygroundRecord 在指定 playground 中创建记录
func HandleCreatePlaygroundRecord(c *gin.Context) {
	playgroundSessionID := c.Param("id")
	if playgroundSessionID == "" {
		sendBadRequest(c, "Playground Session ID is required")
		return
	}

	var req CreatePlaygroundRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 创建 playground 记录
	playgroundRecord, err := createPlaygroundRecord(playgroundSessionID, &req)
	if err != nil {
		sendInternalServerError(c, "Failed to create playground record: "+err.Error())
		return
	}

	sendSuccessResponse(c, playgroundRecord)
}

// HandlePlaygroundDebug 处理 Playground 调试请求
func HandlePlaygroundDebug(c *gin.Context) {
	playgroundSessionID := c.Param("id")
	if playgroundSessionID == "" {
		sendBadRequest(c, "Playground Session ID is required")
		return
	}

	var req PlaygroundDebugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 检查 Playground 会话是否存在
	playgroundSession, err := getPlaygroundSession(playgroundSessionID)
	if err != nil {
		sendInternalServerError(c, "Failed to get playground session: "+err.Error())
		return
	}

	if playgroundSession == nil {
		sendNotFound(c, "Playground session not found")
		return
	}

	// 执行 Playground 调试
	startTime := time.Now()
	result, err := executePlaygroundDebug(playgroundSessionID, req.TurnNumber, req.Request, req.Provider, req.Model, req.Config)
	duration := time.Since(startTime)

	if err != nil {
		zapLogger.Error("playground debug failed",
			zap.String("playground_session_id", playgroundSessionID),
			zap.Int("turn_number", req.TurnNumber),
			zap.String("provider", req.Provider),
			zap.String("model", req.Model),
			zap.Duration("duration", duration),
			zap.String("error", err.Error()))
		sendInternalServerError(c, "Failed to execute playground debug: "+err.Error())
		return
	}

	zapLogger.Info("playground debug finished",
		zap.String("playground_session_id", playgroundSessionID),
		zap.Int("turn_number", req.TurnNumber),
		zap.String("provider", req.Provider),
		zap.String("model", req.Model),
		zap.Duration("duration", duration))

	sendSuccessResponse(c, result)
}

// 以下函数调用 models 包中的相应函数
func createPlaygroundSession(req *CreatePlaygroundRequest) (interface{}, error) {
	// TODO: 需要从请求中获取原始会话ID和轮次
	// 暂时返回nil，需要重构请求结构
	return nil, nil
}

func getPlaygroundSessions(page, size int) (interface{}, error) {
	playgroundSessions, total, err := models.GetPlaygroundSessions(page, size)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       playgroundSessions,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

func getPlaygroundSession(sessionID string) (interface{}, error) {
	return models.GetPlaygroundSession(sessionID)
}

func getPlaygroundSessionRecords(sessionID string, page, size int) (interface{}, error) {
	playgroundRecords, total, err := models.GetPlaygroundSessionRecords(sessionID, page, size)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       playgroundRecords,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

func deletePlaygroundSession(sessionID string) error {
	return models.DeletePlaygroundSession(sessionID)
}

func createPlaygroundRecord(playgroundSessionID string, req *CreatePlaygroundRecordRequest) (interface{}, error) {
	// TODO: 需要从请求中获取原始记录ID
	// 暂时返回nil，需要重构请求结构
	return nil, nil
}

func executePlaygroundDebug(playgroundSessionID string, turnNumber int, newRequest interface{}, provider string, model string, config interface{}) (interface{}, error) {
	// TODO: 需要获取 provider 配置
	// 暂时返回nil，需要重构
	return nil, nil
}
