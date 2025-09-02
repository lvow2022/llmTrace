package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// APIResponse 统一的API响应格式
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// parsePaginationParams 解析分页参数
func parsePaginationParams(c *gin.Context, defaultPage, defaultSize int) (page, size int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", strconv.Itoa(defaultPage)))
	size, _ = strconv.Atoi(c.DefaultQuery("size", strconv.Itoa(defaultSize)))

	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = defaultSize
	}

	return page, size
}

// sendSuccessResponse 发送成功响应
func sendSuccessResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// sendSuccessMessage 发送成功消息响应
func sendSuccessMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: message,
	})
}

// sendErrorResponse 发送错误响应
func sendErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Message: message,
	})
}

// sendBadRequest 发送400错误响应
func sendBadRequest(c *gin.Context, message string) {
	sendErrorResponse(c, http.StatusBadRequest, message)
}

// sendInternalServerError 发送500错误响应
func sendInternalServerError(c *gin.Context, message string) {
	sendErrorResponse(c, http.StatusInternalServerError, message)
}

// sendNotFound 发送404错误响应
func sendNotFound(c *gin.Context, message string) {
	sendErrorResponse(c, http.StatusNotFound, message)
}
