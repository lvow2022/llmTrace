package handlers

import (
	"github.com/gin-gonic/gin"
)

// ProviderInfo Provider 信息
type ProviderInfo struct {
	Name    string      `json:"name"`
	Type    string      `json:"type"`
	Enabled bool        `json:"enabled"`
	Models  []ModelInfo `json:"models"`
}

// ModelInfo 模型信息
type ModelInfo struct {
	Name    string `json:"name"`
	Model   string `json:"model"`
	Enabled bool   `json:"enabled"`
}

// HandleGetProviders 获取可用的providers
func HandleGetProviders(c *gin.Context) {
	// 这里需要调用config.go中的GetConfig函数
	// 暂时返回空列表，后续需要重构
	sendSuccessResponse(c, []ProviderInfo{})
}
