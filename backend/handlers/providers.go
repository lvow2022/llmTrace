package handlers

import (
	"github.com/gin-gonic/gin"
)

// ProviderInfo Provider 信息
type ProviderInfo struct {
	Provider string   `json:"name"`
	Models   []string `json:"models"`
}

// HandleGetProviders 获取可用的providers
func (h *Handler) HandleGetProviders(c *gin.Context) {

	var providers []ProviderInfo

	// 遍历所有提供商
	for _, p := range h.conf.Providers {
		if p.Enabled {
			providers = append(providers, ProviderInfo{
				Provider: p.Provider,
				Models:   p.Models,
			})
		}
	}

	sendSuccessResponse(c, providers)
}
