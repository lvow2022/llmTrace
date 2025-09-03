package handlers

import (
	"llmTrace/models"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// HandleGetRecord 获取单条记录详情
func (h *Handler) HandleGetRecord(c *gin.Context) {
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

// HandleDeleteRecord 删除记录
func (h *Handler) HandleDeleteRecord(c *gin.Context) {
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

// zapLogger 日志记录器（需要从main.go中导入）
var zapLogger *zap.Logger
