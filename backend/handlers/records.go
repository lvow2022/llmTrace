package handlers

import (
	"llmTrace/models"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ReplayRequest 重放请求结构
type ReplayRequest struct {
	SessionID  string      `json:"session_id"`
	TurnNumber int         `json:"turn_number"`
	Request    interface{} `json:"request"`
	Provider   string      `json:"provider"`
	Model      string      `json:"model"`
}

// HandleGetRecord 获取单条记录详情
func HandleGetRecord(c *gin.Context) {
	recordID := c.Param("id")
	if recordID == "" {
		sendBadRequest(c, "Record ID is required")
		return
	}

	// 获取记录
	record, err := getRecordByID(recordID)
	if err != nil {
		sendInternalServerError(c, "Failed to get record: "+err.Error())
		return
	}

	if record == nil {
		sendNotFound(c, "Record not found")
		return
	}

	sendSuccessResponse(c, record)
}

// HandleReplayRecord 重放记录
func HandleReplayRecord(c *gin.Context) {
	recordID := c.Param("id")

	if recordID == "" {
		sendBadRequest(c, "Record ID is required")
		return
	}

	// 解析重放请求
	var replayReq ReplayRequest
	if err := c.ShouldBindJSON(&replayReq); err != nil {
		sendBadRequest(c, "Invalid replay request: "+err.Error())
		return
	}

	// 获取原始记录
	originalRecord, err := getRecordByID(recordID)
	if err != nil {
		sendInternalServerError(c, "Failed to get original record: "+err.Error())
		return
	}

	if originalRecord == nil {
		sendNotFound(c, "Record not found")
		return
	}

	startTime := time.Now()
	result, err := executeReplay(replayReq.SessionID, replayReq.TurnNumber, replayReq.Request, replayReq.Provider, replayReq.Model)
	duration := time.Since(startTime)

	if err != nil {
		zapLogger.Error("reply finished",
			zap.String("session_id", replayReq.SessionID),
			zap.Int("turn_number", replayReq.TurnNumber),
			zap.String("provider", replayReq.Provider),
			zap.String("model", replayReq.Model),
			zap.Duration("duration", duration),
			zap.String("error", err.Error()))
		sendInternalServerError(c, "Failed to execute replay: "+err.Error())
		return
	}

	zapLogger.Info("reply finished",
		zap.String("session_id", replayReq.SessionID),
		zap.Int("turn_number", replayReq.TurnNumber),
		zap.String("provider", replayReq.Provider),
		zap.String("model", replayReq.Model),
		zap.Duration("duration", duration))

	sendSuccessResponse(c, result)
}

// HandleDeleteRecord 删除记录
func HandleDeleteRecord(c *gin.Context) {
	recordID := c.Param("id")
	if recordID == "" {
		sendBadRequest(c, "Record ID is required")
		return
	}

	// 删除记录
	if err := deleteRecordByID(recordID); err != nil {
		sendInternalServerError(c, "Failed to delete record: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Record deleted successfully")
}

// getRecordByID 获取记录
func getRecordByID(recordID string) (interface{}, error) {
	return models.GetRecordByID(recordID)
}

// deleteRecordByID 删除记录
func deleteRecordByID(recordID string) error {
	return models.DeleteRecord(recordID)
}

// executeReplay 执行重放
func executeReplay(sessionID string, turnNumber int, newRequest interface{}, provider string, model string) (interface{}, error) {
	// 这里需要实现重放逻辑，暂时返回nil
	// TODO: 实现重放功能
	return nil, nil
}

// zapLogger 日志记录器（需要从main.go中导入）
var zapLogger *zap.Logger
