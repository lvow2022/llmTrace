# LLM Trace 后端服务

## 项目简介

LLM Trace 是一个用于追踪、调试和测试 LLM 调用的后端服务。该服务支持多种 LLM 提供商，提供完整的调用记录管理和调试环境。

## 技术栈

- **框架**: Gin (Go Web 框架)
- **数据库**: 支持 SQLite、MySQL、PostgreSQL，使用 GORM 作为 ORM
- **配置管理**: Viper
- **日志**: Zap (结构化日志)
- **LLM 客户端**: OpenAI Go 客户端

## 后端接口重构完成总结

### 1. 新的接口架构

#### 1.1 核心埋点接口
- `POST /api/trace` - 接收 LLM 调用埋点数据

#### 1.2 生产环境管理
- `GET /api/sessions` - 获取会话列表
- `GET /api/sessions/:id/records` - 获取指定会话的记录
- `GET /api/records/:id` - 获取单条记录详情
- `POST /api/records/:id/replay` - 重放单条记录
- `DELETE /api/records/:id` - 删除记录

#### 1.3 Playground 调试环境（统一的新调试环境）
- `POST /api/playground-sessions` - 创建 Playground 会话
- `GET /api/playground-sessions` - 获取 Playground 会话列表
- `GET /api/playground-sessions/:id` - 获取 Playground 会话详情
- `DELETE /api/playground-sessions/:id` - 删除 Playground 会话

- `POST /api/playground-sessions/:id/records` - 在指定 playground 中创建记录
- `GET /api/playground-sessions/:id/records` - 获取 playground 会话的所有记录

- `POST /api/playground-sessions/:id/debug` - 在指定 playground 中执行调试

#### 1.4 配置管理
- `GET /api/providers` - 获取可用的 LLM 提供商和模型信息

#### 1.5 健康检查
- `GET /health` - 服务健康状态检查

### 2. 主要改进

#### 2.1 统一调试环境
- 移除了重放调试和 Playground 测试的重复功能
- 统一使用 Playground 作为调试环境
- 支持基于会话轮次创建调试环境

#### 2.2 简化的数据模型
- `PlaygroundSession` 现在基于原始会话和轮次创建
- `PlaygroundRecord` 包含原始记录引用，便于追溯
- 支持在同一个 playground 中进行多轮调试

#### 2.3 清晰的业务流程
1. 用户选中 session 的某个轮次，点击调试
2. 创建或选择 playground 会话
3. 复制选中的 session turn 作为 playground 下的记录
4. 在 playground 中进行调试和参数调优

### 3. 移除的旧接口
- 重放会话管理接口（`/api/replay-sessions/*`）
- 重放调试接口（`/api/replay-debug`）
- Playground 测试接口（`/api/playground-test`）

### 4. 技术改进
- 代码结构更清晰，减少了重复代码
- 统一的错误处理和日志记录
- 更好的数据一致性和引用关系
- 支持事务操作确保数据完整性

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
- Go 1.19+
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

### v2.0.0 (当前版本)
- 重构后端接口，统一调试环境
- 移除重复功能，简化代码结构
- 改进数据模型和业务流程
- 提升代码质量和可维护性

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

[许可证信息]
