package handlers

import (
	"llmTrace/models"

	"github.com/gin-gonic/gin"
)

// HandleGetSessions 获取会话列表
func HandleGetSessions(c *gin.Context) {
	page, size := parsePaginationParams(c, 1, 20)

	// 获取会话列表
	result, err := getSessions(page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get sessions: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleGetSessionRecords 获取会话记录
func HandleGetSessionRecords(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		sendBadRequest(c, "Session ID is required")
		return
	}

	page, size := parsePaginationParams(c, 1, 50)

	// 获取会话记录
	result, err := getSessionRecordsByID(sessionID, page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get session records: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// getSessions 获取会话列表
func getSessions(page, size int) (interface{}, error) {
	sessions, total, err := models.GetSessions(page, size)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       sessions,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getSessionRecordsByID 获取会话记录
func getSessionRecordsByID(sessionID string, page, size int) (interface{}, error) {
	records, total, err := models.GetSessionRecordsByID(sessionID, page, size)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       records,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}
