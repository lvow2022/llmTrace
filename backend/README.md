# LLM Trace 后端服务

## 项目简介

LLM Trace 是一个用于追踪、调试和测试 LLM 调用的后端服务。该服务支持多种 LLM 提供商，提供完整的调用记录管理和调试环境。

## 技术栈

- **框架**: Gin (Go Web 框架)
- **数据库**: 支持 SQLite、MySQL、PostgreSQL，使用 GORM 作为 ORM
- **配置管理**: Viper
- **日志**: Zap (结构化日志)
- **LLM 客户端**: OpenAI Go 客户端

## 项目结构

```
backend/
├── handlers/          # 路由处理函数模块
│   ├── base.go       # 基础工具函数和响应结构
│   ├── trace.go      # 埋点数据处理
│   ├── sessions.go   # 会话管理
│   ├── records.go    # 记录管理
│   ├── playground.go # Playground 功能
│   ├── replay.go     # 重放功能
│   ├── providers.go  # Provider 管理
│   ├── index.go      # 包入口文件
│   └── README.md     # handlers 模块说明
├── types.go           # 统一的数据结构定义
├── models.go          # 数据库操作和业务逻辑
├── config.go          # 配置管理
├── main.go            # 主程序入口
├── config.yaml        # 配置文件
├── go.mod             # Go 模块文件
├── start.sh           # 启动脚本
└── README.md          # 本文件
```

## 后端接口架构

### 1. 核心埋点接口
- `POST /api/trace` - 接收 LLM 调用埋点数据

### 2. 生产环境管理
- `GET /api/sessions` - 获取会话列表
- `GET /api/sessions/:id/records` - 获取指定会话的记录
- `GET /api/records/:id` - 获取单条记录详情
- `POST /api/records/:id/replay` - 重放单条记录
- `DELETE /api/records/:id` - 删除记录

### 3. Playground 调试环境
- `POST /api/playground-sessions` - 创建 Playground 会话
- `GET /api/playground-sessions` - 获取 Playground 会话列表
- `GET /api/playground-sessions/:id` - 获取 Playground 会话详情
- `DELETE /api/playground-sessions/:id` - 删除 Playground 会话
- `POST /api/playground-sessions/:id/records` - 在指定 playground 中创建记录
- `GET /api/playground-sessions/:id/records` - 获取 playground 会话的所有记录
- `POST /api/playground-sessions/:id/debug` - 在指定 playground 中执行调试

### 4. 配置管理
- `GET /api/providers` - 获取可用的 LLM 提供商和模型信息

### 5. 健康检查
- `GET /health` - 服务健康状态检查

## 代码重构完成总结

### ✅ 已完成的清理工作

#### 1. 模块化重构
- **删除了 `handlers.go`** - 原来的单一大文件（1009行）已按功能模块拆分
- **删除了 `request.go`** - 数据结构定义文件已整合到 `types.go`
- **创建了 `handlers/` 目录** - 按功能模块组织代码

#### 2. 代码组织优化
- **`base.go`** - 统一的响应格式和工具函数
- **`trace.go`** - 埋点数据处理
- **`sessions.go`** - 会话管理
- **`records.go`** - 记录管理
- **`playground.go`** - Playground 功能
- **`replay.go`** - 重放功能
- **`providers.go`** - Provider 管理

#### 3. 数据结构统一
- **`types.go`** - 所有数据结构定义统一管理
- 消除了重复的结构定义
- 修复了字段不匹配问题

#### 4. 代码质量提升
- 更好的代码组织和可读性
- 减少了代码重复
- 模块化设计，便于测试和维护
- 统一的错误处理和响应格式
- 清晰的文件依赖关系

### 🔄 待完成工作

- [ ] 完善 handlers 包与 models.go 的集成（目前部分函数还是占位符）
- [ ] 添加单元测试
- [ ] 实现真正的数据库操作函数
- [ ] 完善错误处理和参数验证

## 数据模型

### 核心实体

#### Session (对话会话)
- 生产环境中的对话会话
- 包含会话ID、名称、创建时间等基本信息

#### Record (调用记录)
- 生产环境中的 LLM 调用记录
- 包含请求、响应、状态、错误信息等

#### PlaygroundSession (调试会话)
- 基于原始会话和轮次创建的调试环境
- 支持多轮调试和参数调优

#### PlaygroundRecord (调试记录)
- 在 playground 中的调试记录
- 包含原始记录引用，便于追溯和对比

### 数据关系
```
Session (1) -> (N) Record
Record (1) -> (1) PlaygroundRecord (通过 OriginalRecordID)
PlaygroundSession (1) -> (N) PlaygroundRecord
```

## 配置说明

### 数据库配置
支持多种数据库驱动：
- SQLite (默认)
- MySQL
- PostgreSQL

### LLM 提供商配置
支持动态配置多个 LLM 提供商：
- OpenAI
- Azure OpenAI
- 其他兼容 OpenAI API 的服务

## 开发指南

### 环境要求
- Go 1.21+
- 支持的数据库之一

### 本地开发
1. 克隆项目
2. 安装依赖: `go mod tidy`
3. 配置数据库连接
4. 运行服务: `go run .`

### 构建
```bash
go build -o llmtrace .
```

### 代码结构说明

#### handlers 包
所有 HTTP 路由处理函数都按功能模块组织在 `handlers/` 目录中：

```go
import "llmTrace/handlers"

// 设置路由
api.POST("/trace", handlers.HandleTrace)
api.GET("/sessions", handlers.HandleGetSessions)
// ... 其他路由
```

#### 统一响应格式
所有接口都使用统一的 `APIResponse` 格式：

```go
type APIResponse struct {
    Success bool        `json:"success"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}
```

## API 使用示例

### 创建 Playground 会话
```bash
curl -X POST http://localhost:10081/api/playground-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "original_session_id": "session_123",
    "original_turn_number": 1,
    "name": "调试会话1"
  }'
```

### 在 Playground 中创建记录
```bash
curl -X POST http://localhost:10081/api/playground-sessions/playground_123/records \
  -H "Content-Type: application/json" \
  -d '{
    "original_record_id": "record_456",
    "turn_number": 1
  }'
```

### 执行调试
```bash
curl -X POST http://localhost:10081/api/playground-sessions/playground_123/debug \
  -H "Content-Type: application/json" \
  -d '{
    "turn_number": 1,
    "request": {
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": "Hello"}]
    },
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "config": {
      "temperature": 0.7,
      "max_tokens": 100
    }
  }'
```

## 更新日志

### v2.1.0 (当前版本)
- ✅ 完成代码重构和模块化
- ✅ 删除无用文件和重复代码
- ✅ 统一数据结构定义
- ✅ 优化代码组织和可读性
- ✅ 修复编译错误和字段不匹配问题

### v2.0.0
- 重构后端接口，统一调试环境
- 移除重复功能，简化代码结构
- 改进数据模型和业务流程
- 提升代码质量和可维护性

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

### 开发规范
1. 新增功能请在对应的 handlers 模块中添加
2. 数据结构修改请更新 `types.go`
3. 数据库操作请更新 `models.go`
4. 保持代码模块化和清晰性

## 许可证

[许可证信息]
