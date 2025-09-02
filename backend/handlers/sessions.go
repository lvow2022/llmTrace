package handlers

import (
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
	result, err := getSessionRecords(sessionID, page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get session records: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// getSessions 获取会话列表（需要从models.go中导入）
func getSessions(page, size int) (interface{}, error) {
	// 这里需要调用models.go中的getSessions函数
	// 暂时返回nil，后续需要重构
	return nil, nil
}

// getSessionRecords 获取会话记录（需要从models.go中导入）
func getSessionRecords(sessionID string, page, size int) (interface{}, error) {
	// 这里需要调用models.go中的getSessionRecords函数
	// 暂时返回nil，后续需要重构
	return nil, nil
}
