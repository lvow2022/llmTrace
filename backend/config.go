package main

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config 配置结构
type Config struct {
	Server    ServerConfig    `mapstructure:"server"`
	Database  DatabaseConfig  `mapstructure:"database"`
	OpenAI    OpenAIConfig    `mapstructure:"openai"`
	Providers ProvidersConfig `mapstructure:"providers"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Host string `mapstructure:"host"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Driver string `mapstructure:"driver"`
	DSN    string `mapstructure:"dsn"`
}

// OpenAIConfig OpenAI配置
type OpenAIConfig struct {
	APIKey string `mapstructure:"api_key"`
}

// ModelConfig 模型配置
type ModelConfig struct {
	Name    string `mapstructure:"name"`
	Model   string `mapstructure:"model"`
	Enabled bool   `mapstructure:"enabled"`
}

// ProviderConfig 单个Provider配置
type ProviderConfig struct {
	Name    string                 `mapstructure:"name"`
	Type    string                 `mapstructure:"type"` // openai, anthropic, deepseek, etc.
	APIKey  string                 `mapstructure:"api_key"`
	BaseURL string                 `mapstructure:"base_url"`
	Enabled bool                   `mapstructure:"enabled"`
	Models  map[string]ModelConfig `mapstructure:"models"`
}

// ProvidersConfig 多Provider配置
type ProvidersConfig struct {
	OpenAI    ProviderConfig `mapstructure:"openai"`
	Anthropic ProviderConfig `mapstructure:"anthropic"`
	Azure     ProviderConfig `mapstructure:"azure"`
	DeepSeek  ProviderConfig `mapstructure:"deepseek"`
	Custom    ProviderConfig `mapstructure:"custom"`
}

var config *Config

// loadConfig 加载配置
func loadConfig() (*Config, error) {
	// 设置配置文件路径
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")

	// 设置环境变量前缀
	viper.SetEnvPrefix("LLMTRACE")
	viper.AutomaticEnv()

	// 设置默认值
	viper.SetDefault("server.port", 10081)
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("database.driver", "sqlite")
	viper.SetDefault("database.dsn", "./data/llmtrace.db")
	viper.SetDefault("openai.api_key", "")

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %v", err)
		}
		// 配置文件不存在时使用默认值
		fmt.Println("Config file not found, using defaults")
	}

	// 解析配置
	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %v", err)
	}

	return &cfg, nil
}

// GetConfig 获取配置实例
func GetConfig() *Config {
	if config == nil {
		var err error
		config, err = loadConfig()
		if err != nil {
			panic(fmt.Sprintf("Failed to load config: %v", err))
		}
	}
	return config
}
