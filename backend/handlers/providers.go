package handlers

import (
	"github.com/gin-gonic/gin"
)

// ProviderInfo Provider 信息
type ProviderInfo struct {
	Provider string      `json:"name"`
	Models   []ModelInfo `json:"models"`
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
	for _, p := range h.conf.Providers {
		if p.Enabled {
			modelList := make([]ModelInfo, 0)
			for _, model := range p.Models {
				modelList = append(modelList, ModelInfo{
					Name:    model,
					Model:   model,
					Enabled: true,
				})
			}

			providers = append(providers, ProviderInfo{
				Provider: p.Provider,
				Models:   modelList,
			})
		}
	}

	sendSuccessResponse(c, providers)
}
