package handlers

import (
	"github.com/gin-gonic/gin"
	"llmTrace/models"
)

// TraceRequest 埋点请求结构
type TraceRequest struct {
	TraceID      string      `json:"trace_id" binding:"required"`
	TurnNumber   int         `json:"turn_number" binding:"required"`
	Request      interface{} `json:"request" binding:"required"`
	Response     interface{} `json:"response"`
	Status       string      `json:"status" binding:"required"` // success/error/pending
	ErrorMessage string      `json:"error_message"`
	Metadata     interface{} `json:"metadata"`
}

// HandleTrace 处理埋点数据
func (h *Handler) HandleTrace(c *gin.Context) {
	var trace TraceRequest
	if err := c.ShouldBindJSON(&trace); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 保存埋点数据
	if err := saveTraceRecord(&trace); err != nil {
		sendInternalServerError(c, "Failed to save trace data: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Trace data saved successfully")
}

// saveTraceRecord 保存埋点数据
func saveTraceRecord(trace *TraceRequest) error {
	return models.SaveTraceRecord(trace.TraceID, trace.TurnNumber, trace.Request, trace.Response, trace.Status, trace.ErrorMessage, trace.Metadata)
}
