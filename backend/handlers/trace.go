package handlers

import (
	"github.com/gin-gonic/gin"
)

// TraceRequest 埋点请求结构
type TraceRequest struct {
	SessionID    string      `json:"session_id" binding:"required"`
	TurnNumber   int         `json:"turn_number" binding:"required"`
	Request      interface{} `json:"request" binding:"required"`
	Response     interface{} `json:"response"`
	Status       string      `json:"status" binding:"required"` // success/error/pending
	ErrorMessage string      `json:"error_message"`
	Metadata     interface{} `json:"metadata"`
}

// HandleTrace 处理埋点数据
func HandleTrace(c *gin.Context) {
	var trace TraceRequest
	if err := c.ShouldBindJSON(&trace); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 保存埋点数据
	if err := saveTraceData(&trace); err != nil {
		sendInternalServerError(c, "Failed to save trace data: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Trace data saved successfully")
}

// saveTraceData 保存埋点数据（需要从models.go中导入）
func saveTraceData(trace *TraceRequest) error {
	// 这里需要调用models.go中的saveTraceData函数
	// 暂时返回nil，后续需要重构
	return nil
}
