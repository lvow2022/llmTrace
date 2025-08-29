#!/bin/bash

# 创建数据目录
mkdir -p ./data

# 设置环境变量（可选）
export OPENAI_API_KEY="your-openai-api-key-here"
export LLMTRACE_SERVER_PORT="8080"
export LLMTRACE_SERVER_HOST="0.0.0.0"

# 数据库配置示例
# SQLite (默认)
export LLMTRACE_DATABASE_DRIVER="sqlite"
export LLMTRACE_DATABASE_DSN="./data/llmtrace.db"

# MySQL 示例
# export LLMTRACE_DATABASE_DRIVER="mysql"
# export LLMTRACE_DATABASE_DSN="user:password@tcp(localhost:3306)/llmtrace?charset=utf8mb4&parseTime=True&loc=Local"

# PostgreSQL 示例
# export LLMTRACE_DATABASE_DRIVER="postgres"
# export LLMTRACE_DATABASE_DSN="host=localhost user=postgres password=password dbname=llmtrace port=5432 sslmode=disable TimeZone=Asia/Shanghai"

# 下载依赖
go mod tidy

# 启动服务
echo "Starting LLM Trace Server..."
echo "Server will be available at: http://localhost:8080"
echo "API endpoints:"
echo "  POST /api/trace - 埋点数据上报"
echo "  GET  /api/sessions - 获取会话列表"
echo "  GET  /api/sessions/:id/records - 获取会话记录"
echo "  POST /api/records/:id/replay - 重放请求"
echo "  DELETE /api/records/:id - 删除记录"
echo ""

go run .
