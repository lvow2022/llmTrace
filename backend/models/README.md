# Models 包

这个包包含了所有数据库相关的结构体定义和操作方法。

## 文件结构

- `types.go` - 包含所有数据模型结构体定义
- `database.go` - 数据库连接和初始化逻辑
- `session.go` - 会话相关的数据库操作
- `record.go` - 记录相关的数据库操作
- `replay.go` - 重放相关的数据库操作
- `playground.go` - Playground 相关的数据库操作

## 主要功能

### 数据模型
- `Session` - 对话会话（生产环境）
- `Record` - 调用记录（生产环境）
- `ReplaySession` - 重放调试会话
- `ReplayRecord` - 重放调试记录
- `PlaygroundSession` - Playground 会话
- `PlaygroundRecord` - Playground 测试记录

### 数据库操作
- 数据库连接和初始化
- CRUD 操作
- 分页查询
- 事务处理

## 使用方法

```go
import "llmTrace/models"

// 初始化数据库
err := models.InitDatabase(driver, dsn)

// 获取会话列表
sessions, err := models.GetSessions(page, size)

// 保存埋点数据
err := models.SaveTraceData(sessionID, turnNumber, request, response, status, errorMessage, metadata)
```

## 注意事项

1. 所有数据库操作都通过 models 包进行
2. 使用事务确保数据一致性
3. 错误处理遵循 Go 的惯例
4. 支持多种数据库驱动（SQLite、MySQL、PostgreSQL）
