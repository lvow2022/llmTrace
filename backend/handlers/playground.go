package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"llmTrace/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
	"go.uber.org/zap"
)

// GlobalConfig 全局配置变量
var GlobalConfig interface{}

// SetGlobalConfig 设置全局配置
func SetGlobalConfig(config interface{}) {
	GlobalConfig = config
}

// CreatePlaygroundRequest 创建 Playground 请求
type CreatePlaygroundRequest struct {
	Name        string `json:"name" binding:"required"` // playground 名称
	Description string `json:"description"`             // playground 描述
}

// CreateDebugSessionRequest 创建调试会话请求
type CreateDebugSessionRequest struct {
	PlaygroundID      string `json:"playground_id" binding:"required"`       // playground ID
	OriginalSessionID string `json:"original_session_id" binding:"required"` // 来源会话ID
	OriginalRecordID  string `json:"original_record_id" binding:"required"`  // 来源记录ID
	Name              string `json:"name"`                                   // 可选，自动生成
}

// CreateDebugRecordRequest 创建调试记录请求
type CreateDebugRecordRequest struct {
	Request  interface{} `json:"request" binding:"required"`  // 新的请求内容
	Provider string      `json:"provider" binding:"required"` // 使用的提供商
	Model    string      `json:"model" binding:"required"`    // 使用的模型
	Config   interface{} `json:"config"`                      // 调试配置（温度、token等）
}

// CreateDebugSessionFromRecordRequest 从记录创建调试会话请求
type CreateDebugSessionFromRecordRequest struct {
	PlaygroundID string `json:"playground_id" binding:"required"` // playground ID
	Name         string `json:"name"`                             // 可选，自动生成
}

// DebugSessionWithRecords 调试会话详情（包含所有记录）
type DebugSessionWithRecords struct {
	*models.DebugSession
	Records []models.DebugRecord `json:"records"`
}

// PlaygroundDebugRequest Playground 调试请求
type PlaygroundDebugRequest struct {
	TurnNumber int           `json:"turn_number" binding:"required"`
	Context    []ChatMessage `json:"context" binding:"required"`    // 对话上下文（历史消息）
	UserInput  string        `json:"user_input" binding:"required"` // 用户本次输入
	Provider   string        `json:"provider" binding:"required"`
	Model      string        `json:"model" binding:"required"`
	Config     *ModelConfig  `json:"config"` // 模型配置参数
}

// ChatMessage 聊天消息结构
type ChatMessage struct {
	Role    string `json:"role" binding:"required"`    // user, assistant, system
	Content string `json:"content" binding:"required"` // 消息内容
}

// ModelConfig 模型配置参数
type ModelConfig struct {
	Temperature *float32 `json:"temperature"` // 温度参数 (0.0-2.0)
	MaxTokens   *int     `json:"max_tokens"`  // 最大token数
	TopP        *float32 `json:"top_p"`       // Top-p参数 (0.0-1.0)
	Stream      *bool    `json:"stream"`      // 是否流式响应
}

// HandleCreatePlayground 创建 Playground
func HandleCreatePlayground(c *gin.Context) {
	var req CreatePlaygroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 创建 Playground
	playground, err := createPlayground(&req)
	if err != nil {
		sendInternalServerError(c, "Failed to create playground: "+err.Error())
		return
	}

	sendSuccessResponse(c, playground)
}

// HandleCreateDebugSession 创建调试会话
func HandleCreateDebugSession(c *gin.Context) {
	var req CreateDebugSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 创建调试会话并自动添加第一个记录
	debugSession, err := createDebugSession(&req)
	if err != nil {
		sendInternalServerError(c, "Failed to create debug session: "+err.Error())
		return
	}

	sendSuccessResponse(c, debugSession)
}

// HandleGetPlaygrounds 获取 Playground 列表
func HandleGetPlaygrounds(c *gin.Context) {
	page, size := parsePaginationParams(c, 1, 20)

	// 获取 Playground 列表
	result, err := getPlaygrounds(page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get playgrounds: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleGetPlayground 获取单个 Playground
func HandleGetPlayground(c *gin.Context) {
	playgroundID := c.Param("id")
	if playgroundID == "" {
		sendBadRequest(c, "Playground ID is required")
		return
	}

	// 获取 Playground
	playground, err := getPlayground(playgroundID)
	if err != nil {
		sendInternalServerError(c, "Failed to get playground: "+err.Error())
		return
	}

	if playground == nil {
		sendNotFound(c, "Playground not found")
		return
	}

	sendSuccessResponse(c, playground)
}

// HandleCreateDebugSessionFromRecord 从记录创建调试会话
func HandleCreateDebugSessionFromRecord(c *gin.Context) {
	recordID := c.Param("record_id")
	if recordID == "" {
		sendBadRequest(c, "Record ID is required")
		return
	}

	var req CreateDebugSessionFromRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 从记录创建调试会话
	debugSession, err := createDebugSessionFromRecord(recordID, &req)
	if err != nil {
		sendInternalServerError(c, "Failed to create debug session from record: "+err.Error())
		return
	}

	sendSuccessResponse(c, debugSession)
}

// HandleGetDebugSessions 获取调试会话列表
func HandleGetDebugSessions(c *gin.Context) {
	playgroundID := c.Param("id")
	if playgroundID == "" {
		sendBadRequest(c, "Playground ID is required")
		return
	}

	page, size := parsePaginationParams(c, 1, 20)

	// 获取调试会话列表
	result, err := getDebugSessions(playgroundID, page, size)
	if err != nil {
		sendInternalServerError(c, "Failed to get debug sessions: "+err.Error())
		return
	}

	sendSuccessResponse(c, result)
}

// HandleGetDebugSession 获取单个调试会话（包含所有记录）
func HandleGetDebugSession(c *gin.Context) {
	sessionID := c.Param("session_id")
	if sessionID == "" {
		sendBadRequest(c, "Debug Session ID is required")
		return
	}

	// 获取调试会话详情（包含所有记录）
	debugSessionWithRecords, err := getDebugSessionWithRecords(sessionID)
	if err != nil {
		sendInternalServerError(c, "Failed to get debug session: "+err.Error())
		return
	}

	if debugSessionWithRecords == nil {
		sendNotFound(c, "Debug session not found")
		return
	}

	sendSuccessResponse(c, debugSessionWithRecords)
}

// HandleDeletePlayground 删除 Playground
func HandleDeletePlayground(c *gin.Context) {
	playgroundID := c.Param("id")
	if playgroundID == "" {
		sendBadRequest(c, "Playground ID is required")
		return
	}

	// 删除 Playground
	if err := deletePlaygroundByID(playgroundID); err != nil {
		sendInternalServerError(c, "Failed to delete playground: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Playground deleted successfully")
}

// HandleDeleteDebugSession 删除调试会话
func HandleDeleteDebugSession(c *gin.Context) {
	debugSessionID := c.Param("session_id")
	if debugSessionID == "" {
		sendBadRequest(c, "Debug Session ID is required")
		return
	}

	// 删除调试会话
	if err := deleteDebugSession(debugSessionID); err != nil {
		sendInternalServerError(c, "Failed to delete debug session: "+err.Error())
		return
	}

	sendSuccessMessage(c, "Debug session deleted successfully")
}

// HandleCreateDebugRecord 在指定调试会话中创建记录
func HandleCreateDebugRecord(c *gin.Context) {
	debugSessionID := c.Param("session_id")
	if debugSessionID == "" {
		sendBadRequest(c, "Debug Session ID is required")
		return
	}

	var req CreateDebugRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 创建新的调试记录（用于继续调试）
	debugRecord, err := createDebugRecord(debugSessionID, &req)
	if err != nil {
		sendInternalServerError(c, "Failed to create debug record: "+err.Error())
		return
	}

	sendSuccessResponse(c, debugRecord)
}

// HandlePlaygroundDebug 处理 Playground 调试请求
func HandlePlaygroundDebug(c *gin.Context) {
	debugSessionID := c.Param("debug_session_id")
	if debugSessionID == "" {
		sendBadRequest(c, "Debug Session ID is required")
		return
	}

	var req PlaygroundDebugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request format: "+err.Error())
		return
	}

	// 检查调试会话是否存在
	debugSession, err := getDebugSession(debugSessionID)
	if err != nil {
		sendInternalServerError(c, "Failed to get debug session: "+err.Error())
		return
	}

	if debugSession == nil {
		sendNotFound(c, "Debug session not found")
		return
	}

	// 执行调试
	startTime := time.Now()
	result, err := executeDebug(debugSessionID, req.TurnNumber, req.Context, req.UserInput, req.Provider, req.Model, req.Config)
	duration := time.Since(startTime)

	if err != nil {
		zapLogger.Error("debug failed",
			zap.String("debug_session_id", debugSessionID),
			zap.Int("turn_number", req.TurnNumber),
			zap.String("provider", req.Provider),
			zap.String("model", req.Model),
			zap.Duration("duration", duration),
			zap.String("error", err.Error()))
		sendInternalServerError(c, "Failed to execute debug: "+err.Error())
		return
	}

	zapLogger.Info("debug finished",
		zap.String("debug_session_id", debugSessionID),
		zap.Int("turn_number", req.TurnNumber),
		zap.String("provider", req.Provider),
		zap.String("model", req.Model),
		zap.Duration("duration", duration))

	sendSuccessResponse(c, result)
}

// 以下函数调用 models 包中的相应函数
func createPlayground(req *CreatePlaygroundRequest) (interface{}, error) {
	// 调用 models 包中的函数来创建 playground
	return models.CreatePlayground(req.Name, req.Description)
}

func createDebugSession(req *CreateDebugSessionRequest) (interface{}, error) {
	// 1. 创建 debug_session
	debugSession, err := models.CreateDebugSession(req.PlaygroundID, req.OriginalSessionID, req.OriginalRecordID, req.Name)
	if err != nil {
		return nil, err
	}

	// 2. 自动创建第一个 debug_record（基于原始记录）
	originalRecord, err := models.GetRecordByID(req.OriginalRecordID)
	if err != nil {
		return nil, err
	}

	// 创建第一个调试记录，复制原始记录的内容
	_, err = models.CreateDebugRecord(
		debugSession.ID,
		1, // 第一个轮次
		originalRecord.Request,
		originalRecord.Response,
		"success",
		"",
		"", // provider 暂时为空
		"", // model 暂时为空
		"", // config 暂时为空
	)
	if err != nil {
		return nil, err
	}

	return debugSession, nil
}

func getPlaygrounds(page, size int) (interface{}, error) {
	playgrounds, total, err := models.GetPlaygrounds(page, size)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       playgrounds,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

func getPlayground(playgroundID string) (interface{}, error) {
	// TODO: 实现获取单个 playground 的逻辑
	return nil, nil
}

func getDebugSessions(playgroundID string, page, size int) (interface{}, error) {
	// TODO: 实现获取调试会话列表的逻辑
	return nil, nil
}

func getDebugSession(sessionID string) (interface{}, error) {
	// TODO: 实现获取单个调试会话的逻辑
	return nil, nil
}

func getDebugSessionWithRecords(sessionID string) (interface{}, error) {
	// 获取调试会话详情（包含所有记录）
	debugSession, err := models.GetDebugSession(sessionID)
	if err != nil {
		return nil, err
	}
	if debugSession == nil {
		return nil, nil
	}

	// 获取调试会话的所有记录（不分页，获取全部）
	records, _, err := models.GetDebugSessionRecords(sessionID, 1, 1000) // 使用较大的size获取所有记录
	if err != nil {
		return nil, err
	}

	// 将调试会话和记录合并
	debugSessionWithRecords := &DebugSessionWithRecords{
		DebugSession: debugSession,
		Records:      records,
	}

	return debugSessionWithRecords, nil
}

func deletePlaygroundByID(playgroundID string) error {
	// TODO: 实现删除 playground 的逻辑
	return nil
}

func createDebugRecord(debugSessionID string, req *CreateDebugRecordRequest) (interface{}, error) {
	// TODO: 实现创建调试记录的逻辑
	// 1. 获取下一个轮次编号
	// 2. 创建新的调试记录
	return nil, nil
}

func executeDebug(debugSessionID string, turnNumber int, context []ChatMessage, userInput string, provider string, model string, config *ModelConfig) (interface{}, error) {
	// 直接使用全局配置
	cfg := GlobalConfig
	if cfg == nil {
		return nil, fmt.Errorf("configuration not loaded")
	}

	// 获取提供商配置
	providerConfig, exists := cfg.(map[string]interface{})["Providers"].(map[string]interface{})[provider]
	if !exists {
		return nil, fmt.Errorf("provider %s not configured", provider)
	}

	// 使用强类型访问配置
	providerCfg := providerConfig.(map[string]interface{})
	enabled := providerCfg["Enabled"].(bool)
	apiKey := providerCfg["APIKey"].(string)
	baseURL := providerCfg["BaseURL"].(string)

	if !enabled {
		return nil, fmt.Errorf("provider %s is disabled", provider)
	}

	if apiKey == "" {
		return nil, fmt.Errorf("API key not configured for provider: %s", provider)
	}

	// 记录开始时间
	startTime := time.Now()

	// 根据提供商构造请求
	var response interface{}
	var err error

	// 构建完整的请求结构
	requestData := map[string]interface{}{
		"context":     context,
		"user_input":  userInput,
		"turn_number": turnNumber,
	}

	response, err = executeRequest(requestData, model, config, apiKey, baseURL)

	if err != nil {
		// 记录错误
		errorMsg := err.Error()

		// 将请求和配置转换为字符串
		requestStr := ""
		if requestBytes, marshalErr := json.Marshal(requestData); marshalErr == nil {
			requestStr = string(requestBytes)
		}

		configStr := ""
		if config != nil {
			if configBytes, marshalErr := json.Marshal(config); marshalErr == nil {
				configStr = string(configBytes)
			}
		}

		_, createErr := models.CreateDebugRecord(
			debugSessionID,
			turnNumber,
			requestStr,
			"", // 响应为空
			"error",
			errorMsg,
			provider,
			model,
			configStr,
		)
		if createErr != nil {
			zap.L().Error("Failed to create debug record", zap.Error(createErr))
		}
		return nil, err
	}

	// 计算执行时长（用于日志记录）
	_ = time.Since(startTime).Milliseconds()

	// 将响应转换为字符串
	responseStr := ""
	if response != nil {
		if responseBytes, marshalErr := json.Marshal(response); marshalErr == nil {
			responseStr = string(responseBytes)
		}
	}

	// 将请求和配置转换为字符串
	requestStr := ""
	if requestBytes, marshalErr := json.Marshal(requestData); marshalErr == nil {
		requestStr = string(requestBytes)
	}

	configStr := ""
	if config != nil {
		if configBytes, marshalErr := json.Marshal(config); marshalErr == nil {
			configStr = string(configBytes)
		}
	}

	// 创建调试记录
	_, createErr := models.CreateDebugRecord(
		debugSessionID,
		turnNumber,
		requestStr,
		responseStr,
		"success",
		"",
		provider,
		model,
		configStr,
	)
	if createErr != nil {
		zap.L().Error("Failed to create debug record", zap.Error(createErr))
	}

	return response, nil
}

// executeRequest 执行统一的请求（支持所有 OpenAI 兼容的提供商）
func executeRequest(request interface{}, model string, config *ModelConfig, apiKey string, baseURL string) (interface{}, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key not configured")
	}

	// 创建客户端配置
	clientConfig := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		clientConfig.BaseURL = baseURL
	}
	client := openai.NewClientWithConfig(clientConfig)

	// 解析请求内容
	requestBytes, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// 构造请求
	chatReq := openai.ChatCompletionRequest{
		Model:    model,
		Messages: []openai.ChatCompletionMessage{},
		Stream:   false, // 非流式
	}

	// 解析请求结构，构建消息列表
	var requestData map[string]interface{}
	if err := json.Unmarshal(requestBytes, &requestData); err == nil {
		// 添加上下文消息
		if context, exists := requestData["context"]; exists {
			if contextArray, ok := context.([]interface{}); ok {
				for _, msg := range contextArray {
					if msgMap, ok := msg.(map[string]interface{}); ok {
						role := msgMap["role"].(string)
						content := msgMap["content"].(string)

						var openaiRole string
						switch role {
						case "user":
							openaiRole = openai.ChatMessageRoleUser
						case "assistant":
							openaiRole = openai.ChatMessageRoleAssistant
						case "system":
							openaiRole = openai.ChatMessageRoleSystem
						default:
							openaiRole = openai.ChatMessageRoleUser
						}

						chatReq.Messages = append(chatReq.Messages, openai.ChatCompletionMessage{
							Role:    openaiRole,
							Content: content,
						})
					}
				}
			}
		}

		// 添加用户当前输入
		if userInput, exists := requestData["user_input"]; exists {
			if input, ok := userInput.(string); ok {
				chatReq.Messages = append(chatReq.Messages, openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleUser,
					Content: input,
				})
			}
		}
	}

	// 如果没有消息，使用原始请求作为用户输入
	if len(chatReq.Messages) == 0 {
		chatReq.Messages = append(chatReq.Messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: string(requestBytes),
		})
	}

	// 应用配置参数
	if config != nil {
		if config.Temperature != nil {
			chatReq.Temperature = *config.Temperature
		}
		if config.MaxTokens != nil {
			chatReq.MaxTokens = *config.MaxTokens
		}
		if config.TopP != nil {
			chatReq.TopP = *config.TopP
		}
		if config.Stream != nil {
			chatReq.Stream = *config.Stream
		}
	}

	// 发送请求
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	resp, err := client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %v", err)
	}

	// 返回响应
	return map[string]interface{}{
		"id":      resp.ID,
		"model":   resp.Model,
		"choices": resp.Choices,
		"usage":   resp.Usage,
	}, nil
}

func createDebugSessionFromRecord(recordID string, req *CreateDebugSessionFromRecordRequest) (interface{}, error) {
	// 1. 获取原始记录
	originalRecord, err := models.GetRecordByID(recordID)
	if err != nil {
		return nil, err
	}
	if originalRecord == nil {
		return nil, fmt.Errorf("record not found")
	}

	// 2. 创建 debug_session
	debugSession, err := models.CreateDebugSession(
		req.PlaygroundID,
		originalRecord.SessionID,
		recordID,
		req.Name,
	)
	if err != nil {
		return nil, err
	}

	// 3. 自动创建第一个 debug_record（复制原始记录）
	_, err = models.CreateDebugRecord(
		debugSession.ID,
		1, // 第一个轮次
		originalRecord.Request,
		originalRecord.Response,
		originalRecord.Status,
		originalRecord.ErrorMsg,
		"", // provider 暂时为空
		"", // model 暂时为空
		"", // config 暂时为空
	)
	if err != nil {
		return nil, err
	}

	return debugSession, nil
}

func deleteDebugSession(debugSessionID string) error {
	// 调用 models 包中的函数来删除调试会话
	return models.DeleteDebugSession(debugSessionID)
}
