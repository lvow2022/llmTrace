# 前后端接口修复总结

## 修复的问题

### 1. 接口路径不匹配

**修复前：**
- 前端使用 `/playground-sessions` 路径
- 后端使用 `/playground` 路径

**修复后：**
- 统一使用 `/playground` 路径
- 所有相关接口路径已更新

### 2. 缺失的接口

**新增接口：**
- `POST /records/:record_id/create-debug-session` - 从记录创建调试会话

**移除的接口：**
- `GET /playground-sessions/:playgroundId/records` - 获取调试记录列表
- `POST /playground-sessions/:playgroundId/records` - 创建调试记录

**替换为：**
- `GET /playground/:id/sessions` - 获取调试会话列表
- `GET /playground/:id/sessions/:session_id` - 获取调试会话详情

### 3. 数据结构不匹配

**CreatePlaygroundRequest 修复：**
```typescript
// 修复前
interface CreatePlaygroundRequest {
  original_session_id: string;
  original_turn_number: number;
  name?: string;
}

// 修复后
interface CreatePlaygroundRequest {
  name: string;        // playground 名称
  description?: string; // playground 描述
}
```

**PlaygroundDebugRequest 修复：**
```typescript
// 修复前
interface PlaygroundDebugRequest {
  turn_number: number;
  request: any;
  provider: string;
  model: string;
  config?: any;
}

// 修复后
interface PlaygroundDebugRequest {
  turn_number: number;
  context: ChatMessage[];     // 对话上下文（历史消息）
  user_input: string;         // 用户本次输入
  provider: string;
  model: string;
  config?: ModelConfig;       // 模型配置参数
}
```

### 4. 新增类型定义

**新增类型：**
- `DebugSession` - 调试会话类型
- `ChatMessage` - 聊天消息类型
- `ModelConfig` - 模型配置类型
- `CreateDebugSessionRequest` - 创建调试会话请求类型

### 5. 组件更新

**DebugModal 组件：**
- 更新创建 Playground 的逻辑
- 使用新的 API 接口
- 修复类型引用

**Playgrounds 页面：**
- 移除对不存在字段的引用
- 更新显示逻辑
- 修复搜索功能

**Dashboard 页面：**
- 更新 Playground 显示逻辑
- 移除对不存在字段的引用

**Store 状态管理：**
- 更新类型引用
- 重命名相关方法
- 统一数据结构

## 修复后的接口列表

### 会话管理
- `GET /api/sessions` - 获取会话列表 ✅
- `GET /api/sessions/:id/records` - 获取会话记录 ✅

### 记录管理
- `GET /api/records/:id` - 获取记录详情 ✅
- `POST /api/records/:record_id/create-debug-session` - 从记录创建调试会话 ✅

### Playground 管理
- `GET /api/playground` - 获取 Playground 列表 ✅
- `POST /api/playground` - 创建 Playground ✅
- `GET /api/playground/:id` - 获取 Playground 详情 ✅
- `DELETE /api/playground/:id` - 删除 Playground ✅

### 调试会话管理
- `GET /api/playground/:id/sessions` - 获取调试会话列表 ✅
- `GET /api/playground/:id/sessions/:session_id` - 获取调试会话详情 ✅
- `DELETE /api/playground/:id/sessions/:session_id` - 删除调试会话 ✅
- `POST /api/playground/:id/sessions/:session_id/debug` - 执行调试 ✅

### 其他接口
- `GET /api/providers` - 获取提供商信息 ✅
- `POST /api/trace` - 发送埋点数据 ✅

## 注意事项

1. **类型安全**：所有接口现在都有完整的 TypeScript 类型定义
2. **错误处理**：统一的错误处理和响应格式
3. **数据一致性**：前后端数据结构完全匹配
4. **向后兼容**：保持了原有的功能逻辑，只是修复了接口问题

## 测试建议

1. 测试创建 Playground 功能
2. 测试从记录创建调试会话
3. 测试调试功能
4. 验证所有页面显示正常
5. 检查控制台是否有 API 错误
