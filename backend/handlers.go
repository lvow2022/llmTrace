package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

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
	fmt.Printf("开始处理重放请求，记录ID: %s\n", recordID)

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
		fmt.Printf("解析重放请求失败: %v\n", err)
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid replay request: " + err.Error(),
		})
		return
	}
	fmt.Printf("重放请求解析成功: provider=%s, model=%s, session_id=%s, turn_number=%d\n",
		replayReq.Provider, replayReq.Model, replayReq.SessionID, replayReq.TurnNumber)

	// 获取原始记录
	originalRecord, err := getRecord(recordID)
	if err != nil {
		fmt.Printf("获取原始记录失败: %v\n", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to get original record: " + err.Error(),
		})
		return
	}

	if originalRecord == nil {
		fmt.Printf("原始记录未找到: %s\n", recordID)
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Record not found",
		})
		return
	}
	fmt.Printf("原始记录获取成功: session_id=%s, turn_number=%d\n", originalRecord.SessionID, originalRecord.TurnNumber)

	// 执行重放
	fmt.Printf("开始执行重放...\n")
	result, err := executeReplay(replayReq.SessionID, replayReq.TurnNumber, replayReq.Request, replayReq.Provider, replayReq.Model)
	if err != nil {
		fmt.Printf("执行重放失败: %v\n", err)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to execute replay: " + err.Error(),
		})
		return
	}

	fmt.Printf("重放执行成功，返回结果\n")
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
	providerConfigs := map[string]ProviderConfig{
		"openai":    cfg.Providers.OpenAI,
		"anthropic": cfg.Providers.Anthropic,
		"azure":     cfg.Providers.Azure,
		"deepseek":  cfg.Providers.DeepSeek,
		"custom":    cfg.Providers.Custom,
	}

	for _, providerConfig := range providerConfigs {
		models := getModelsFromConfig(providerConfig)

		providers = append(providers, ProviderInfo{
			Name:    providerConfig.Name,
			Type:    providerConfig.Type,
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
	for _, model := range provider.Models {
		models = append(models, ModelInfo{
			Name:    model.Name,
			Model:   model.Model,
			Enabled: model.Enabled,
		})
	}
	return models
}

// executeReplay 执行重放
func executeReplay(sessionID string, turnNumber int, newRequest interface{}, provider string, model string) (*Record, error) {
	fmt.Printf("executeReplay开始: sessionID=%s, turnNumber=%d, provider=%s, model=%s\n", sessionID, turnNumber, provider, model)

	// 获取配置
	cfg := GetConfig()

	// 根据provider选择配置
	var apiKey string
	var baseURL string
	switch provider {
	case "openai":
		apiKey = cfg.Providers.OpenAI.APIKey
		baseURL = cfg.Providers.OpenAI.BaseURL
	case "anthropic":
		apiKey = cfg.Providers.Anthropic.APIKey
		baseURL = cfg.Providers.Anthropic.BaseURL
	case "azure":
		apiKey = cfg.Providers.Azure.APIKey
		baseURL = cfg.Providers.Azure.BaseURL
	case "deepseek":
		apiKey = cfg.Providers.DeepSeek.APIKey
		baseURL = cfg.Providers.DeepSeek.BaseURL
	case "custom":
		apiKey = cfg.Providers.Custom.APIKey
		baseURL = cfg.Providers.Custom.BaseURL
	default:
		// 默认使用OpenAI
		apiKey = cfg.Providers.OpenAI.APIKey
		baseURL = cfg.Providers.OpenAI.BaseURL
	}

	//fmt.Printf("Provider配置: apiKey=%s, baseURL=%s\n",
	//	fmt.Sprintf("%s...%s", apiKey[:10], apiKey[len(apiKey)-4:]), baseURL)

	if apiKey == "" {
		return nil, fmt.Errorf("API key not configured for provider: %s", provider)
	}

	// 创建客户端配置
	config := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		config.BaseURL = baseURL
	}
	fmt.Printf("客户端配置完成: baseURL=%s\n", config.BaseURL)

	// 创建客户端
	client := openai.NewClientWithConfig(config)
	fmt.Printf("客户端创建完成\n")

	// 解析新的请求数据
	requestJSON, err := json.Marshal(newRequest)
	if err != nil {
		fmt.Printf("序列化请求数据失败: %v\n", err)
		return nil, err
	}
	fmt.Printf("请求数据序列化成功，长度: %d\n", len(requestJSON))

	// 尝试解析为ChatCompletion请求
	var chatReq openai.ChatCompletionRequest
	if err := json.Unmarshal(requestJSON, &chatReq); err == nil {
		// 设置正确的模型名称
		if model != "" {
			chatReq.Model = model
		}
		fmt.Printf("ChatCompletion请求准备完成: model=%s, messages_count=%d\n", chatReq.Model, len(chatReq.Messages))

		// 创建带超时的上下文（30秒超时，减少超时时间）
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		fmt.Printf("开始调用API，超时时间: 30秒\n")

		// 调用OpenAI API
		resp, err := client.CreateChatCompletion(ctx, chatReq)
		if err != nil {
			fmt.Printf("API调用失败: %v\n", err)
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

		fmt.Printf("API调用成功，响应ID: %s\n", resp.ID)

		// 保存成功记录
		trace := &TraceRequest{
			SessionID:  sessionID,
			TurnNumber: turnNumber,
			Request:    newRequest,
			Response:   resp,
			Status:     "success",
		}

		if err := saveTraceData(trace); err != nil {
			fmt.Printf("保存记录失败: %v\n", err)
			return nil, err
		}
		fmt.Printf("记录保存成功\n")

		// 序列化响应
		responseJSON, err := json.Marshal(resp)
		if err != nil {
			fmt.Printf("序列化响应失败: %v\n", err)
			return nil, err
		}
		fmt.Printf("响应序列化成功，长度: %d\n", len(responseJSON))

		// 返回新记录
		fmt.Printf("executeReplay完成，返回结果\n")
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
