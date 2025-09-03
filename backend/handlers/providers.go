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
func (h *Handler) HandleGetProviders(c *gin.Context) {

	var providers []ProviderInfo

	// 遍历所有提供商
	for _, provider := range h.conf.Providers {
		if provider.Enabled {
			modelList := make([]ModelInfo, 0)
			for _, model := range provider.Models {
				modelList = append(modelList, ModelInfo{
					Name:    model,
					Model:   model,
					Enabled: true,
				})
			}

			providers = append(providers, ProviderInfo{
				Name:    provider.Name,
				Type:    provider.Name,
				Enabled: true,
				Models:  modelList,
			})
		}
	}

	sendSuccessResponse(c, providers)
}
