# LLM Trace - OpenAI调用追踪系统

一个简洁的OpenAI API调用追踪工具，专为开发人员调试LLM应用而设计。支持实时查看调用记录、对话轮次管理和请求重放功能。

## 🎯 核心功能

- **埋点追踪**: 用户代码中异步上报LLM调用数据
- **实时查看**: 前端定时轮询显示最新调用记录
- **对话追踪**: 按轮次组织和管理对话记录
- **请求重放**: 修改请求内容后重新执行测试
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
```

## 📊 数据模型

### 埋点数据结构
```go
type TraceRequest struct {
    SessionID    string      `json:"session_id"`
    TurnNumber   int         `json:"turn_number"`
    Request      interface{} `json:"request"`      // 完整请求数据
    Response     interface{} `json:"response"`     // 完整响应数据
    Status       string      `json:"status"`       // success/error/pending
    ErrorMessage string      `json:"error_message"`
    Metadata     interface{} `json:"metadata"`     // 自定义元数据
}
```

### 数据库模型
```go
// 对话会话
type Session struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`      // 自动生成：对话-时间
    CreatedAt time.Time `json:"created_at"`
}

// 调用记录
type Record struct {
    ID          string    `json:"id"`
    SessionID   string    `json:"session_id"`
    TurnNumber  int       `json:"turn_number"`  // 对话轮次
    Request     string    `json:"request"`      // 完整请求JSON
    Response    string    `json:"response"`     // 完整响应JSON
    Status      string    `json:"status"`       // success/error
    ErrorMsg    string    `json:"error_msg"`
    Metadata    string    `json:"metadata"`     // 元数据JSON
    CreatedAt   time.Time `json:"created_at"`
}
```

## 🔌 API接口

### 埋点接口
```bash
# 上报LLM调用数据
POST /api/trace
Content-Type: application/json

{
  "session_id": "session_123",
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
```

### 查询接口
```bash
# 获取会话列表
GET /api/sessions?page=1&size=20

# 获取会话的调用记录
GET /api/sessions/:id/records?page=1&size=50

# 重放请求
POST /api/records/:id/replay
Body: { "request": "修改后的请求JSON" }

# 删除记录
DELETE /api/records/:id
```

## 📁 项目结构

```
llmTrace/
├── backend/
│   ├── main.go              # 主程序入口
│   ├── models.go            # 数据模型
│   ├── database.go          # 数据库操作
│   ├── handlers.go          # HTTP处理器
│   ├── config.go            # 配置管理
│   ├── go.mod               # 依赖管理
│   ├── start.sh             # 启动脚本
│   └── client_example.py    # 客户端示例
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # 主应用
│   │   ├── components/      # 组件
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
    SessionID    string      `json:"session_id"`
    TurnNumber   int         `json:"turn_number"`
    Request      interface{} `json:"request"`
    Response     interface{} `json:"response"`
    Status       string      `json:"status"`
    ErrorMessage string      `json:"error_message"`
}

// traceLLMCall 埋点LLM调用
func traceLLMCall(sessionID string, turnNumber int, request, response interface{}, status string) {
    traceData := TraceRequest{
        SessionID:  sessionID,
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
    sessionID := "my_session_123"
    turnNumber := 1
    
    request := map[string]interface{}{
        "model":    "gpt-3.5-turbo",
        "messages": messages,
    }
    
    // 埋点请求
    traceLLMCall(sessionID, turnNumber, request, nil, "pending")
    
    // 执行原始调用
    response, err := openaiClient.CreateChatCompletion(messages)
    if err != nil {
        // 埋点错误
        traceLLMCall(sessionID, turnNumber, request, nil, "error")
        return nil, err
    }
    
    // 埋点响应
    traceLLMCall(sessionID, turnNumber, request, response, "success")
    
    return response, nil
}
```

```python
# Python示例 - 简单集成
import requests

def trace_llm_call(session_id, turn_number, request, response, status="success"):
    trace_data = {
        "session_id": session_id,
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
    session_id = "my_session_123"
    turn_number = 1
    
    # 埋点请求
    trace_llm_call(session_id, turn_number, {"messages": messages}, None, "pending")
    
    # 执行原始调用
    response = openai.chat.completions.create(messages=messages)
    
    # 埋点响应
    trace_llm_call(session_id, turn_number, {"messages": messages}, response.model_dump(), "success")
    
    return response
```

### 4. 开始调试
- 打开前端界面：http://localhost:3000
- 运行你的应用，所有埋点的LLM调用都会显示
- 前端每2秒自动刷新显示最新记录
- 选择任意轮次进行重放测试

## 🔄 工作流程

### 埋点数据流程
```
1. 用户代码调用LLM → 获取请求和响应
2. 构造埋点数据 → 包含完整信息
3. 异步发送到Trace服务 → POST /api/trace
4. 服务保存数据 → 存储到SQLite
5. 返回确认 → 用户代码继续执行
```

### 会话管理流程
```
1. 埋点数据包含session_id → 用户指定或自动生成
2. 服务查找会话 → 存在则关联，不存在则创建
3. 轮次管理 → 基于session_id自动递增
4. 数据存储 → 保存完整记录
```

### 重放流程
```
1. 前端选择记录 → 获取原始数据
2. 修改请求内容 → 用户编辑
3. 发送重放请求 → POST /api/records/:id/replay
4. 服务执行调用 → 调用OpenAI API
5. 保存新记录 → 存储结果
6. 返回响应 → 前端显示
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
- **轻量部署**: 单文件数据库，资源占用少

## 🎯 使用场景

- **Agent调试**: 实时查看Agent的决策过程
- **Prompt优化**: 快速测试不同的prompt效果
- **参数调优**: 对比不同参数的响应结果
- **错误排查**: 查看失败的API调用详情
- **对话分析**: 分析多轮对话的上下文
- **性能监控**: 监控LLM调用的响应时间

## 📝 开发计划

- [x] 基础架构设计
- [ ] 后端API实现
- [ ] 数据库操作
- [ ] 前端界面开发
- [ ] 重放功能实现
- [ ] 文档完善
