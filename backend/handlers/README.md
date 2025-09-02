# Handlers 目录

这个目录包含了所有 HTTP 路由处理函数的模块化实现。

## 目录结构

```
handlers/
├── base.go           # 基础工具函数和响应结构
├── trace.go          # 埋点数据处理
├── sessions.go       # 会话管理
├── records.go        # 记录管理
├── playground.go     # Playground 功能
├── replay.go         # 重放会话功能
├── providers.go      # Provider 管理
├── index.go          # 包入口文件
└── README.md         # 本文件
```

## 模块说明

### base.go
- 统一的 API 响应格式 (`APIResponse`)
- 分页参数解析函数 (`parsePaginationParams`)
- 标准化的响应发送函数 (`sendSuccessResponse`, `sendErrorResponse` 等)

### trace.go
- 埋点数据接收和处理
- `TraceRequest` 结构定义

### sessions.go
- 会话列表获取
- 会话记录获取
- 分页支持

### records.go
- 记录详情获取
- 记录重放功能
- 记录删除

### playground.go
- Playground 会话管理
- Playground 记录管理
- Playground 调试功能

### replay.go
- 重放会话管理
- 重放调试功能

### providers.go
- AI 服务提供商信息获取
- 模型列表管理

## 使用方式

在 `main.go` 中，通过 `handlers.HandleXXX` 的方式调用各个处理函数：

```go
import "llmTrace/handlers"

// 设置路由
api.POST("/trace", handlers.HandleTrace)
api.GET("/sessions", handlers.HandleGetSessions)
// ... 其他路由
```

## 注意事项

1. 所有处理函数都遵循统一的错误处理和响应格式
2. 分页参数有合理的默认值和上限限制
3. 每个模块都是独立的，便于维护和测试
4. 数据结构定义已统一到 `types.go` 文件中

## 已完成的清理工作

- [x] 删除了 `handlers.go` 文件（已拆分到各个模块）
- [x] 删除了 `request.go` 文件（数据结构已移到 `types.go`）
- [x] 清理了重复的结构定义
- [x] 统一了数据结构到 `types.go` 文件
- [x] 修复了编译错误

## 待完成工作

- [ ] 完善与 models.go 的集成（目前部分函数还是占位符）
- [ ] 添加单元测试
- [ ] 完善错误处理
- [ ] 添加请求参数验证
- [ ] 实现真正的数据库操作函数

## 文件依赖关系

```
main.go
├── handlers/          # 路由处理函数
├── types.go           # 数据结构定义
├── models.go          # 数据库操作和业务逻辑
└── config.go          # 配置管理
```

现在代码结构更加清晰，每个模块都有明确的职责分工。
