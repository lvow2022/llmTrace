package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
	"go.uber.org/zap"
)

var zapLogger *zap.Logger

func init() {
	var err error
	// 使用开发配置，输出到控制台
	zapLogger, err = zap.NewDevelopment()
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
}

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
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to execute replay: " + err.Error(),
		})
		return
	}

	zapLogger.Info("reply finished",
		zap.String("session_id", replayReq.SessionID),
		zap.Int("turn_number", replayReq.TurnNumber),
		zap.String("provider", replayReq.Provider),
		zap.String("model", replayReq.Model),
		zap.Duration("duration", duration))

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

	var providers []ProviderInfo

	// 动态遍历所有providers
	for _, providerConfig := range cfg.Providers {
		models := getModelsFromConfig(providerConfig)

		providers = append(providers, ProviderInfo{
			Name:    providerConfig.Name,
			Type:    providerConfig.Name, // 使用 name 作为 type
			Enabled: providerConfig.Enabled,
			Models:  models,
		})
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    providers,
	})
}

// getModelsFromConfig 从配置中获取模型列表
func getModelsFromConfig(provider ProviderConfig) []ModelInfo {
	var models []ModelInfo
	for _, modelName := range provider.Models {
		models = append(models, ModelInfo{
			Name:    modelName,
			Model:   modelName,
			Enabled: true,
		})
	}
	return models
}

// executeReplay 执行重放
func executeReplay(sessionID string, turnNumber int, newRequest interface{}, provider string, model string) (*Record, error) {

	// 获取配置
	cfg := GetConfig()

	// 根据provider选择配置
	var apiKey string
	var baseURL string

	// 不区分大小写查找provider
	var providerConfig ProviderConfig
	var found bool
	for key, config := range cfg.Providers {
		if strings.EqualFold(key, provider) || strings.EqualFold(config.Name, provider) {
			providerConfig = config
			found = true
			break
		}
	}

	if found {
		apiKey = providerConfig.APIKey
		baseURL = providerConfig.BaseURL
	}

	if apiKey == "" {
		return nil, fmt.Errorf("API key not configured for provider: %s", provider)
	}

	// 创建客户端配置
	config := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		config.BaseURL = baseURL
	}

	// 创建客户端
	client := openai.NewClientWithConfig(config)

	// 解析新的请求数据
	requestJSON, err := json.Marshal(newRequest)
	if err != nil {
		return nil, err
	}

	// 尝试解析为ChatCompletion请求
	var chatReq openai.ChatCompletionRequest
	if err := json.Unmarshal(requestJSON, &chatReq); err == nil {
		// 设置正确的模型名称
		if model != "" {
			chatReq.Model = model
		}
		ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
		defer cancel()

		// 调用OpenAI API
		resp, err := client.CreateChatCompletion(ctx, chatReq)
		// 保存记录（成功或失败）
		trace := &TraceRequest{
			SessionID:  sessionID,
			TurnNumber: turnNumber,
			Request:    newRequest,
			Response:   resp,
			Status:     "success",
		}

		if err != nil {
			trace.Status = "error"
			trace.Response = nil
			trace.ErrorMessage = err.Error()
		}

		if err := saveTraceData(trace); err != nil {
			return nil, err
		}

		if err != nil {
			return nil, err
		}

		responseJSON, err := json.Marshal(resp)
		if err != nil {
			return nil, err
		}

		return &Record{
			SessionID:  sessionID,
			TurnNumber: turnNumber,
			Request:    string(requestJSON),
			Response:   string(responseJSON),
			Status:     "success",
		}, nil
	}

	return nil, fmt.Errorf("unsupported request type")
}

// handleCreateReplaySession 创建重放会话
func handleCreateReplaySession(c *gin.Context) {
	var req CreateReplaySessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format: " + err.Error(),
		})
		return
	}

	// 创建重放会话
	replaySession, err := createReplaySession(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to create replay session: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    replaySession,
	})
}

// handleGetReplaySessions 获取重放会话列表
func handleGetReplaySessions(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	// 获取重放会话列表
	result, err := getReplaySessions(page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get replay sessions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    result,
	})
}

// handleGetReplaySession 获取单个重放会话
func handleGetReplaySession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Replay Session ID is required",
		})
		return
	}

	// 获取重放会话
	replaySession, err := getReplaySession(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get replay session: " + err.Error(),
		})
		return
	}

	if replaySession == nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Replay session not found",
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    replaySession,
	})
}

// handleGetReplaySessionRecords 获取重放会话记录
func handleGetReplaySessionRecords(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Replay Session ID is required",
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

	// 获取重放会话记录
	result, err := getReplaySessionRecords(sessionID, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get replay session records: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    result,
	})
}

// handleReplayDebug 处理调试重放请求
func handleReplayDebug(c *gin.Context) {
	var req ReplayDebugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format: " + err.Error(),
		})
		return
	}

	// 检查重放会话是否存在
	replaySession, err := getReplaySession(req.ReplaySessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get replay session: " + err.Error(),
		})
		return
	}

	if replaySession == nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Replay session not found",
		})
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
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to execute replay debug: " + err.Error(),
		})
		return
	}

	zapLogger.Info("replay debug finished",
		zap.String("replay_session_id", req.ReplaySessionID),
		zap.Int("turn_number", req.TurnNumber),
		zap.String("provider", req.Provider),
		zap.String("model", req.Model),
		zap.Duration("duration", duration))

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    result,
	})
}

// handleDeleteReplaySession 删除重放会话
func handleDeleteReplaySession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Replay Session ID is required",
		})
		return
	}

	// 删除重放会话
	if err := deleteReplaySession(sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to delete replay session: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "Replay session deleted successfully",
	})
}

// executeReplayDebug 执行调试重放
func executeReplayDebug(replaySessionID string, turnNumber int, newRequest interface{}, provider string, model string, config interface{}) (*ReplayRecord, error) {
	// 获取配置
	cfg := GetConfig()

	// 根据provider选择配置
	var apiKey string
	var baseURL string

	// 不区分大小写查找provider
	var providerConfig ProviderConfig
	var found bool
	for key, config := range cfg.Providers {
		if strings.EqualFold(key, provider) || strings.EqualFold(config.Name, provider) {
			providerConfig = config
			found = true
			break
		}
	}

	if found {
		apiKey = providerConfig.APIKey
		baseURL = providerConfig.BaseURL
	}

	if apiKey == "" {
		return nil, fmt.Errorf("API key not configured for provider: %s", provider)
	}

	// 创建客户端配置
	clientConfig := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		clientConfig.BaseURL = baseURL
	}

	// 创建客户端
	client := openai.NewClientWithConfig(clientConfig)

	// 解析新的请求数据
	requestJSON, err := json.Marshal(newRequest)
	if err != nil {
		return nil, err
	}

	// 尝试解析为ChatCompletion请求
	var chatReq openai.ChatCompletionRequest
	if err := json.Unmarshal(requestJSON, &chatReq); err == nil {
		// 设置正确的模型名称
		if model != "" {
			chatReq.Model = model
		}

		// 应用调试配置
		if config != nil {
			configMap, ok := config.(map[string]interface{})
			if ok {
				if temp, exists := configMap["temperature"]; exists {
					if tempFloat, ok := temp.(float64); ok {
						chatReq.Temperature = float32(tempFloat)
					}
				}
				if maxTokens, exists := configMap["max_tokens"]; exists {
					if maxTokensInt, ok := maxTokens.(int); ok {
						chatReq.MaxTokens = maxTokensInt
					}
				}
				if topP, exists := configMap["top_p"]; exists {
					if topPFloat, ok := topP.(float64); ok {
						chatReq.TopP = float32(topPFloat)
					}
				}
				if freqPenalty, exists := configMap["frequency_penalty"]; exists {
					if freqPenaltyFloat, ok := freqPenalty.(float64); ok {
						chatReq.FrequencyPenalty = float32(freqPenaltyFloat)
					}
				}
				if presPenalty, exists := configMap["presence_penalty"]; exists {
					if presPenaltyFloat, ok := presPenalty.(float64); ok {
						chatReq.PresencePenalty = float32(presPenaltyFloat)
					}
				}
			}
		}

		ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
		defer cancel()

		// 调用OpenAI API
		resp, err := client.CreateChatCompletion(ctx, chatReq)

		// 保存重放记录
		status := "success"
		errorMsg := ""
		if err != nil {
			status = "error"
			errorMsg = err.Error()
		}

		if err := saveReplayRecord(replaySessionID, turnNumber, newRequest, resp, status, errorMsg, provider, model, config); err != nil {
			return nil, err
		}

		if err != nil {
			return nil, err
		}

		responseJSON, err := json.Marshal(resp)
		if err != nil {
			return nil, err
		}

		return &ReplayRecord{
			ReplaySessionID: replaySessionID,
			TurnNumber:      turnNumber,
			Request:         string(requestJSON),
			Response:        string(responseJSON),
			Status:          "success",
			Provider:        provider,
			Model:           model,
			Config: func() string {
				if config != nil {
					if b, err := json.Marshal(config); err == nil {
						return string(b)
					}
				}
				return ""
			}(),
		}, nil
	}

	return nil, fmt.Errorf("unsupported request type")
}
