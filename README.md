# LLM Trace - OpenAI调用追踪系统

一个简洁的OpenAI API调用追踪工具，专为开发人员调试LLM应用而设计。支持实时查看调用记录、对话轮次管理和多轮调试会话功能。

## 🎯 核心功能

- **埋点追踪**: 用户代码中异步上报LLM调用数据
- **实时查看**: 前端定时轮询显示最新调用记录
- **对话追踪**: 按轮次组织和管理对话记录
- **单次重放**: 修改请求内容后重新执行测试
- **多轮调试**: 基于某个轮次创建调试会话，进行多轮对话调试
- **白盒调试**: 完全透明的请求/响应数据，告别黑盒调试

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户的应用代码                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Agent     │  │   LLM调用   │  │   埋点代码  │        │
│  │   逻辑      │  │   (OpenAI)  │  │  (异步上报) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM Trace 服务                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   HTTP API  │  │  数据存储   │  │  前端服务   │        │
│  │  (接收数据) │  │  (SQLite)   │  │  (查看数据) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    调试会话管理                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 重放会话    │  │ 调试记录    │  │ 多轮对话    │        │
│  │ (Replay)    │  │ (Debug)     │  │ (Chat)      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 📊 数据模型

### 生产环境数据模型
```go
// 对话会话（生产环境）
type Session struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`      // 自动生成：对话-时间
    CreatedAt time.Time `json:"created_at"`
}

// 调用记录（生产环境）
type Record struct {
    ID          string    `json:"id"`
    TraceID     string    `json:"trace_id"`     // 会话标识符
    TurnNumber  int       `json:"turn_number"`  // 对话轮次
    Request     string    `json:"request"`      // 完整请求JSON
    Response    string    `json:"response"`     // 完整响应JSON
    Status      string    `json:"status"`       // success/error
    ErrorMsg    string    `json:"error_msg"`
    Metadata    string    `json:"metadata"`     // 元数据JSON
    CreatedAt   time.Time `json:"created_at"`
}
```

### 调试环境数据模型
```go
// 重放调试会话
type ReplaySession struct {
    ID                string    `json:"id"`
    Name              string    `json:"name"`              // 调试会话名称
    OriginalSessionID string    `json:"original_session_id"` // 关联的原始会话
    StartTurnNumber   int       `json:"start_turn_number"`   // 开始调试的轮次
    Status            string    `json:"status"`            // active/completed
    CreatedAt         time.Time `json:"created_at"`
    UpdatedAt         time.Time `json:"updated_at"`
}

// 重放调试记录
type ReplayRecord struct {
    ID              string    `json:"id"`
    ReplaySessionID string    `json:"replay_session_id"`
    TurnNumber      int       `json:"turn_number"`
    Request         string    `json:"request"`         // 完整请求JSON
    Response        string    `json:"response"`        // 完整响应JSON
    Status          string    `json:"status"`          // success/error
    ErrorMsg        string    `json:"error_msg"`
    Provider        string    `json:"provider"`        // 使用的Provider
    Model           string    `json:"model"`           // 使用的模型
    Config          string    `json:"config"`          // 调试配置JSON
    CreatedAt       time.Time `json:"created_at"`
}
```

### 埋点数据结构
```go
type TraceRequest struct {
    TraceID      string      `json:"trace_id"`      // 会话标识符
    TurnNumber   int         `json:"turn_number"`   // 对话轮次
    Request      interface{} `json:"request"`       // 完整请求数据
    Response     interface{} `json:"response"`      // 完整响应数据
    Status       string      `json:"status"`        // success/error/pending
    ErrorMessage string      `json:"error_message"` // 错误信息
    Metadata     interface{} `json:"metadata"`      // 自定义元数据
}
```

## 🔌 API接口

### 生产环境接口
```bash
# 上报LLM调用数据
POST /api/trace
Content-Type: application/json

{
  "trace_id": "session_123",
  "turn_number": 1,
  "request": {
    "model": "gpt-3.5-turbo",
    "messages": [...],
    "temperature": 0.7
  },
  "response": {
    "id": "chatcmpl-123",
    "choices": [...],
    "usage": {...}
  },
  "status": "success",
  "error_message": "",
  "metadata": {
    "user_id": "user_123",
    "agent_name": "my_agent"
  }
}

# 获取会话列表
GET /api/sessions?page=1&size=20

# 获取会话的调用记录
GET /api/sessions/:id/records?page=1&size=50

# 单次重放请求
POST /api/records/:id/replay
Body: { "request": "修改后的请求JSON" }

# 删除记录
DELETE /api/records/:id
```

### 调试环境接口
```bash
# 创建重放会话
POST /api/replay-sessions
Content-Type: application/json

{
  "original_session_id": "session_123",
  "start_turn_number": 2,
  "name": "调试会话名称"
}

# 获取重放会话列表
GET /api/replay-sessions?page=1&size=20

# 获取单个重放会话
GET /api/replay-sessions/:id

# 获取重放会话记录
GET /api/replay-sessions/:id/records?page=1&size=50

# 删除重放会话
DELETE /api/replay-sessions/:id

# 调试重放（多轮对话）
POST /api/replay-debug
Content-Type: application/json

{
  "replay_session_id": "replay_session_123",
  "turn_number": 1,
  "request": {
    "model": "gpt-4",
    "messages": [...],
    "temperature": 0.8
  },
  "provider": "openai",
  "model": "gpt-4",
  "config": {
    "temperature": 0.8,
    "max_tokens": 2048,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }
}
```

## 📁 项目结构

```
llmTrace/
├── backend/
│   ├── main.go              # 主程序入口
│   ├── models.go            # 数据模型和数据库操作
│   ├── handlers.go          # HTTP处理器
│   ├── request.go           # 请求数据结构
│   ├── config.go            # 配置管理
│   ├── go.mod               # 依赖管理
│   ├── start.sh             # 启动脚本
│   └── client_example.py    # 客户端示例
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # 主应用
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   │   ├── Sessions/    # 会话管理
│   │   │   ├── Records/     # 记录查看
│   │   │   └── ReplaySessions/ # 重放会话
│   │   └── services/        # API调用
│   └── package.json
└── README.md
```

## 🚀 快速开始

### 1. 启动后端服务
```bash
cd backend

# 设置环境变量
export OPENAI_API_KEY="your-openai-api-key"
export SERVER_PORT="8080"

# 启动服务
./start.sh
# 或者直接运行
go run .
```

### 2. 启动前端
```bash
cd frontend
npm install
npm start
```

### 3. 集成到你的代码
```go
// Go示例 - 简单集成
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "time"
)

// TraceRequest 埋点请求结构
type TraceRequest struct {
    TraceID      string      `json:"trace_id"`      // 会话标识符
    TurnNumber   int         `json:"turn_number"`   // 对话轮次
    Request      interface{} `json:"request"`       // 完整请求数据
    Response     interface{} `json:"response"`      // 完整响应数据
    Status       string      `json:"status"`        // success/error/pending
    ErrorMessage string      `json:"error_message"` // 错误信息
    Metadata     interface{} `json:"metadata"`      // 自定义元数据
}

// traceLLMCall 埋点LLM调用
func traceLLMCall(traceID string, turnNumber int, request, response interface{}, status string) {
    traceData := TraceRequest{
        TraceID:    traceID,
        TurnNumber: turnNumber,
        Request:    request,
        Response:   response,
        Status:     status,
    }
    
    jsonData, err := json.Marshal(traceData)
    if err != nil {
        return
    }
    
    // 异步发送埋点数据
    go func() {
        http.Post("http://localhost:8080/api/trace", "application/json", bytes.NewBuffer(jsonData))
    }()
}

// 在你的LLM调用代码中添加埋点
func callLLM(messages []map[string]string) (interface{}, error) {
    traceID := "my_session_123"     // 会话标识符
    turnNumber := 1                  // 对话轮次
    
    request := map[string]interface{}{
        "model":    "gpt-3.5-turbo",
        "messages": messages,
    }
    
    // 执行原始调用
    response, err := openaiClient.CreateChatCompletion(messages)
    
    // 埋点：一次调用记录完整的请求和响应
    if err != nil {
        traceLLMCall(traceID, turnNumber, request, nil, "error")
        return nil, err
    } else {
        traceLLMCall(traceID, turnNumber, request, response, "success")
    }
    
    return response, nil
}
```

```python
# Python示例 - 简单集成
import requests

def trace_llm_call(trace_id, turn_number, request, response, status="success"):
    trace_data = {
        "trace_id": trace_id,
        "turn_number": turn_number,
        "request": request,
        "response": response,
        "status": status
    }
    
    try:
        requests.post("http://localhost:8080/api/trace", json=trace_data)
    except:
        # 埋点失败不影响主流程
        pass

# 在你的LLM调用代码中添加埋点
def call_llm(messages):
    trace_id = "my_session_123"
    turn_number = 1
    
    # 执行原始调用
    response = openai.chat.completions.create(messages=messages)
    
    # 埋点：一次调用记录完整的请求和响应
    trace_llm_call(trace_id, turn_number, {"messages": messages}, response.model_dump(), "success")
    
    return response
```

### 4. 开始调试
- 打开前端界面：http://localhost:3000
- 运行你的应用，所有埋点的LLM调用都会显示
- 前端每2秒自动刷新显示最新记录
- 选择任意轮次进行单次重放测试
- 创建调试会话进行多轮对话调试

## 🔄 工作流程

### 埋点数据流程
```
1. 用户代码调用LLM → 获取请求和响应
2. 构造埋点数据 → 包含完整的请求、响应和状态
3. 异步发送到Trace服务 → POST /api/trace
4. 服务保存数据 → 一条记录包含完整的调用信息
5. 返回确认 → 用户代码继续执行
```

### 会话管理流程
```
1. 埋点数据包含trace_id → 用户指定或自动生成
2. 服务查找会话 → 存在则关联，不存在则创建
3. 轮次管理 → 基于trace_id自动递增
4. 数据存储 → 保存完整记录
```

### 单次重放流程
```
1. 前端选择记录 → 获取原始数据
2. 修改请求内容 → 用户编辑
3. 发送重放请求 → POST /api/records/:id/replay
4. 服务执行调用 → 调用OpenAI API
5. 保存新记录 → 存储结果
6. 返回响应 → 前端显示
```

### 多轮调试流程
```
1. 用户选择Session的某个轮次 → 点击"开始调试"
2. 创建重放会话 → POST /api/replay-sessions
3. 基于选中轮次作为起点 → 进行多轮对话调试
4. 每次调试请求 → POST /api/replay-debug
5. 保存调试记录 → 存储到ReplayRecord表
6. 调试完成后查看历史 → 完整的调试会话记录
```

## 🛠️ 技术栈

- **后端**: Go + Gin + SQLite
- **前端**: React + TypeScript + Axios
- **存储**: SQLite（单文件）
- **通信**: REST API + 定时轮询

## ✨ 核心优势

- **极简架构**: 5个核心文件，零复杂性
- **零侵入性**: 只需添加几行埋点代码，不影响现有逻辑
- **异步执行**: 埋点失败不影响主流程
- **快速集成**: 任何语言都可以轻松集成
- **实时调试**: 前端实时查看调用记录
- **快速重放**: 修改请求内容立即测试效果
- **多轮调试**: 支持基于某个轮次进行多轮对话调试
- **轻量部署**: 单文件数据库，资源占用少

## 🎯 使用场景

- **Agent调试**: 实时查看Agent的决策过程
- **Prompt优化**: 快速测试不同的prompt效果
- **参数调优**: 对比不同参数的响应结果
- **错误排查**: 查看失败的API调用详情
- **对话分析**: 分析多轮对话的上下文
- **性能监控**: 监控LLM调用的响应时间
- **多轮调试**: 基于某个轮次进行完整的对话调试
- **A/B测试**: 对比不同模型和参数的效果

## 📝 开发计划

- [x] 基础架构设计
- [x] 后端API实现
- [x] 数据库操作
- [x] 前端界面开发
- [x] 单次重放功能实现
- [x] 重放会话和调试功能实现
- [x] 数据模型分离（生产环境 vs 调试环境）
- [ ] 前端调试界面开发
- [ ] 文档完善

## 🔄 最新更新

### v2.0.0 - 重放会话和调试功能
- **新增**: 重放会话管理功能
- **新增**: 多轮调试对话功能
- **新增**: 调试配置管理（温度、token等参数）
- **优化**: 数据模型分离，生产环境和调试环境独立
- **新增**: 调试会话的完整生命周期管理
- **优化**: 支持基于某个轮次进行多轮对话调试
