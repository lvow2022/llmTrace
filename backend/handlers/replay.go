package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// CreateReplaySessionRequest 创建重放会话请求
type CreateReplaySessionRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// ReplayDebugRequest 重放调试请求
type ReplayDebugRequest struct {
	ReplaySessionID string      `json:"replay_session_id"`
	TurnNumber      int         `json:"turn_number"`
	Request         interface{} `json:"request"`
	Provider        string      `json:"provider"`
	Model           string      `json:"model"`
	Config          interface{} `json:"config,omitempty"`
}

// HandleCreateReplaySession 创建重放会话
func HandleCreateReplaySession(c *gin.Context) {
	var req CreateReplaySessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 创建重放会话
	replaySession, err := createReplaySession(&req)
	if err != nil {
		sendInternalServerError(c, "Failed to create replay session: "+err.Error())
		return
	}

	sendSuccessResponse(c, replaySession)
}

// HandleGetReplaySessions 获取重放会话列表
func HandleGetReplaySessions(c *gin.Context) {
	page, size := parsePaginationParams(c, 1, 20)

	// 获取重放会话列表
	result, err := getReplaySessions(page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get replay sessions: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleGetReplaySession 获取单个重放会话
func HandleGetReplaySession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Replay Session ID is required")
		return
	}

	// 获取重放会话
	replaySession, err := getReplaySession(sessionID)
	if err != nil {
		sendInternalServerError(c, "Failed to get replay session: "+err.Error())
		return
	}

	if replaySession == nil {
		sendNotFound(c, "Replay session not found")
		return
	}

	sendSuccessResponse(c, replaySession)
}

// HandleGetReplaySessionRecords 获取重放会话记录
func HandleGetReplaySessionRecords(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Replay Session ID is required")
		return
	}

	page, size := parsePaginationParams(c, 1, 50)

	// 获取重放会话记录
	result, err := getReplaySessionRecords(sessionID, page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get replay session records: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleReplayDebug 处理调试重放请求
func HandleReplayDebug(c *gin.Context) {
	var req ReplayDebugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 检查重放会话是否存在
	replaySession, err := getReplaySession(req.ReplaySessionID)
	if err != nil {
		sendInternalServerError(c, "Failed to get replay session: "+err.Error())
		return
	}

	if replaySession == nil {
		sendNotFound(c, "Replay session not found")
		return
	}

	// 执行调试重放
	startTime := time.Now()
	result, err := executeReplayDebug(req.ReplaySessionID, req.TurnNumber, req.Request, req.Provider, req.Model, req.Config)
	duration := time.Since(startTime)

	if err != nil {
		zapLogger.Error("replay debug failed",
			zap.String("replay_session_id", req.ReplaySessionID),
			zap.Int("turn_number", req.TurnNumber),
			zap.String("provider", req.Provider),
			zap.String("model", req.Model),
			zap.Duration("duration", duration),
			zap.String("error", err.Error()))
		sendInternalServerError(c, "Failed to execute replay debug: "+err.Error())
		return
	}

	zapLogger.Info("replay debug finished",
		zap.String("replay_session_id", req.ReplaySessionID),
		zap.Int("turn_number", req.TurnNumber),
		zap.String("provider", req.Provider),
		zap.String("model", req.Model),
		zap.Duration("duration", duration))

	sendSuccessResponse(c, result)
}

// HandleDeleteReplaySession 删除重放会话
func HandleDeleteReplaySession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Replay Session ID is required")
		return
	}

	// 删除重放会话
	if err := deleteReplaySession(sessionID); err != nil {
		sendInternalServerError(c, "Failed to delete replay session: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Replay session deleted successfully")
}

// 以下函数需要从models.go中导入
func createReplaySession(req *CreateReplaySessionRequest) (interface{}, error) {
	return nil, nil
}

func getReplaySessions(page, size int) (interface{}, error) {
	return nil, nil
}

func getReplaySession(sessionID string) (interface{}, error) {
	return nil, nil
}

func getReplaySessionRecords(sessionID string, page, size int) (interface{}, error) {
	return nil, nil
}

func deleteReplaySession(sessionID string) error {
	return nil
}

func executeReplayDebug(replaySessionID string, turnNumber int, newRequest interface{}, provider string, model string, config interface{}) (interface{}, error) {
	return nil, nil
}
