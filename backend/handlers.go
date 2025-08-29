package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
)

// handleTrace 处理埋点数据
func handleTrace(c *gin.Context) {
	var trace TraceRequest
	if err := c.ShouldBindJSON(&trace); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format: " + err.Error(),
		})
		return
	}

	// 保存埋点数据
	if err := saveTraceData(&trace); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to save trace data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "Trace data saved successfully",
	})
}

// handleGetSessions 获取会话列表
func handleGetSessions(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	// 获取会话列表
	result, err := getSessions(page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get sessions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    result,
	})
}

// handleGetSessionRecords 获取会话记录
func handleGetSessionRecords(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Session ID is required",
		})
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "50"))

	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 50
	}

	// 获取会话记录
	result, err := getSessionRecords(sessionID, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get session records: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    result,
	})
}

// handleReplayRecord 重放记录
func handleReplayRecord(c *gin.Context) {
	recordID := c.Param("id")
	if recordID == "" {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Record ID is required",
		})
		return
	}

	// 解析重放请求
	var replayReq ReplayRequest
	if err := c.ShouldBindJSON(&replayReq); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid replay request: " + err.Error(),
		})
		return
	}

	// 获取原始记录
	originalRecord, err := getRecord(recordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get original record: " + err.Error(),
		})
		return
	}

	if originalRecord == nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Record not found",
		})
		return
	}

	// 执行重放
	result, err := executeReplay(replayReq.SessionID, replayReq.TurnNumber, replayReq.Request, replayReq.Provider)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to execute replay: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    result,
	})
}

// handleDeleteRecord 删除记录
func handleDeleteRecord(c *gin.Context) {
	recordID := c.Param("id")
	if recordID == "" {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Record ID is required",
		})
		return
	}

	// 删除记录
	if err := deleteRecord(recordID); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to delete record: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "Record deleted successfully",
	})
}

// handleGetProviders 获取可用的providers
func handleGetProviders(c *gin.Context) {
	cfg := GetConfig()

	providers := []ProviderInfo{
		{
			Name:    cfg.Providers.OpenAI.Name,
			Type:    cfg.Providers.OpenAI.Type,
			Enabled: cfg.Providers.OpenAI.Enabled,
		},
		{
			Name:    cfg.Providers.Anthropic.Name,
			Type:    cfg.Providers.Anthropic.Type,
			Enabled: cfg.Providers.Anthropic.Enabled,
		},
		{
			Name:    cfg.Providers.Azure.Name,
			Type:    cfg.Providers.Azure.Type,
			Enabled: cfg.Providers.Azure.Enabled,
		},
		{
			Name:    cfg.Providers.Custom.Name,
			Type:    cfg.Providers.Custom.Type,
			Enabled: cfg.Providers.Custom.Enabled,
		},
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    providers,
	})
}

// executeReplay 执行重放
func executeReplay(sessionID string, turnNumber int, newRequest interface{}, provider string) (*Record, error) {
	// 获取配置
	cfg := GetConfig()

	// 创建OpenAI客户端
	client := openai.NewClient(cfg.OpenAI.APIKey)

	// 解析新的请求数据
	requestJSON, err := json.Marshal(newRequest)
	if err != nil {
		return nil, err
	}

	// 尝试解析为ChatCompletion请求
	var chatReq openai.ChatCompletionRequest
	if err := json.Unmarshal(requestJSON, &chatReq); err == nil {
		// 调用OpenAI API
		resp, err := client.CreateChatCompletion(context.Background(), chatReq)
		if err != nil {
			// 保存错误记录
			trace := &TraceRequest{
				SessionID:    sessionID,
				TurnNumber:   turnNumber,
				Request:      newRequest,
				Response:     nil,
				Status:       "error",
				ErrorMessage: err.Error(),
			}
			saveTraceData(trace)
			return nil, err
		}

		// 保存成功记录
		trace := &TraceRequest{
			SessionID:  sessionID,
			TurnNumber: turnNumber,
			Request:    newRequest,
			Response:   resp,
			Status:     "success",
		}

		if err := saveTraceData(trace); err != nil {
			return nil, err
		}

		// 序列化响应
		responseJSON, err := json.Marshal(resp)
		if err != nil {
			return nil, err
		}

		// 返回新记录
		return &Record{
			SessionID:  sessionID,
			TurnNumber: turnNumber,
			Request:    string(requestJSON),
			Response:   string(responseJSON),
			Status:     "success",
		}, nil
	}

	// 如果不是ChatCompletion请求，返回错误
	return nil, fmt.Errorf("unsupported request type")
}
