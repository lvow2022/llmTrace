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
	if GlobalConfig == nil {
		sendInternalServerError(c, "Configuration not loaded")
		return
	}

	var providers []ProviderInfo

	// 从全局配置获取提供商信息
	if config, ok := GlobalConfig.(map[string]interface{}); ok {
		if providersConfig, exists := config["Providers"]; exists {
			if providersMap, ok := providersConfig.(map[string]interface{}); ok {
				// 遍历所有提供商
				for providerName, providerConfig := range providersMap {
					if provider, ok := providerConfig.(map[string]interface{}); ok {
						enabled := provider["Enabled"].(bool)
						if enabled {
							name := provider["Name"].(string)
							models := provider["Models"].([]interface{})

							// 转换模型列表
							modelList := make([]ModelInfo, 0)
							for _, model := range models {
								if modelStr, ok := model.(string); ok {
									modelList = append(modelList, ModelInfo{
										Name:    modelStr,
										Model:   modelStr,
										Enabled: true,
									})
								}
							}

							providers = append(providers, ProviderInfo{
								Name:    name,
								Type:    providerName,
								Enabled: true,
								Models:  modelList,
							})
						}
					}
				}
			}
		}
	}

	sendSuccessResponse(c, providers)
}
