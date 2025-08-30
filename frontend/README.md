# LLM Trace Frontend - 前端开发文档

## 🎯 项目概述

LLM Trace前端是一个基于React + TypeScript的Web应用，用于管理和调试LLM调用记录。支持生产环境的会话管理和记录查看，以及调试环境的多轮对话调试功能。

## 🏗️ 技术栈

- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **路由**: React Router
- **构建工具**: Vite

## 📁 项目结构

```
frontend/src/
├── components/           # 通用组件
│   └── Layout/
│       └── MainLayout.tsx
├── pages/               # 页面组件
│   ├── Dashboard/       # 仪表板
│   │   └── index.tsx
│   ├── Sessions/        # 生产环境会话管理
│   │   └── index.tsx
│   ├── Records/         # 生产环境记录查看
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── RecordDetail.tsx
│   │       ├── ReplayModal.tsx
│   │       └── StartDebugModal.tsx (新增)
│   ├── ReplaySessions/  # 调试会话管理 (新增)
│   │   ├── index.tsx
│   │   └── components/
│   │       └── ReplaySessionItem.tsx
│   ├── ReplayDebug/     # 调试界面 (新增)
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── DebugChat.tsx
│   │       ├── DebugInput.tsx
│   │       └── DebugConfig.tsx
│   └── Settings/        # 设置页面
│       └── index.tsx
├── services/            # API服务
│   └── api.ts
├── stores/              # 状态管理
│   └── index.ts
├── types/               # 类型定义
│   └── index.ts
├── App.tsx              # 主应用组件
└── index.tsx            # 应用入口
```

## 🎨 页面功能设计

### 1. **Sessions页面** (生产环境会话管理)
- **功能**: 显示所有生产环境的会话列表
- **显示内容**: 
  - 会话名称
  - 创建时间
  - 记录数量
  - 操作按钮
- **操作**: 
  - 点击会话进入Records页面
  - 查看会话详情

### 2. **Records页面** (生产环境记录查看)
- **功能**: 显示选中会话的所有记录
- **显示内容**:
  - 轮次号
  - 请求内容摘要
  - 响应状态
  - 时间戳
- **操作**:
  - 查看记录详情
  - 单次重放（保留功能）
  - **开始调试**（新增功能）

### 3. **ReplaySessions页面** (新增 - 调试会话管理)
- **功能**: 显示所有调试会话列表
- **显示内容**:
  - 调试会话名称
  - 关联的原始会话
  - 开始调试的轮次
  - 调试状态（active/completed）
  - 创建时间
- **操作**:
  - 进入调试界面
  - 删除调试会话

### 4. **ReplayDebug页面** (新增 - 调试界面)
- **功能**: 多轮对话调试界面
- **界面布局**:
  - 左侧：调试记录列表（聊天形式）
  - 右侧：调试配置面板
  - 底部：输入框和发送按钮
- **功能特性**:
  - 实时显示调试结果
  - 支持修改模型参数
  - 历史记录查看
  - 多轮对话支持

## 🔧 组件设计

### 1. **StartDebugModal组件** (新增)
```typescript
interface StartDebugModalProps {
  visible: boolean;
  record: Record | null;
  onCancel: () => void;
  onSuccess: (replaySession: ReplaySession) => void;
}
```
- **功能**: 从生产环境记录开始调试的弹窗
- **内容**: 
  - 显示选中的记录信息
  - 调试会话名称输入
  - 确认创建调试会话

### 2. **ReplaySessionItem组件** (新增)
```typescript
interface ReplaySessionItemProps {
  replaySession: ReplaySession;
  onView: (session: ReplaySession) => void;
  onDelete: (id: string) => void;
}
```
- **功能**: 调试会话列表项组件
- **显示**: 会话信息和操作按钮

### 3. **DebugChat组件** (新增)
```typescript
interface DebugChatProps {
  records: ReplayRecord[];
  loading: boolean;
}
```
- **功能**: 调试聊天记录显示
- **特性**: 类似微信聊天的界面设计

### 4. **DebugInput组件** (新增)
```typescript
interface DebugInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}
```
- **功能**: 调试消息输入组件
- **特性**: 支持发送调试请求

### 5. **DebugConfig组件** (新增)
```typescript
interface DebugConfigProps {
  config: ReplayConfig;
  onConfigChange: (config: ReplayConfig) => void;
}
```
- **功能**: 调试配置管理
- **配置项**: 模型、温度、token数等参数

## 📊 类型定义

### 新增类型
```typescript
// 重放会话
export interface ReplaySession {
  id: string;
  name: string;
  original_session_id: string;
  start_turn_number: number;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

// 重放记录
export interface ReplayRecord {
  id: string;
  replay_session_id: string;
  turn_number: number;
  request: string;
  response: string;
  status: string;
  error_msg: string;
  provider: string;
  model: string;
  config: string;
  created_at: string;
}

// 创建重放会话请求
export interface CreateReplaySessionRequest {
  original_session_id: string;
  start_turn_number: number;
  name?: string;
}

// 调试重放请求
export interface ReplayDebugRequest {
  replay_session_id: string;
  turn_number: number;
  request: any;
  provider?: string;
  model?: string;
  config?: any;
}

// 重放配置
export interface ReplayConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}
```

## 🔌 API服务

### 新增API方法
```typescript
export class APIService {
  // 重放会话管理
  static async createReplaySession(data: CreateReplaySessionRequest): Promise<APIResponse<ReplaySession>>;
  static async getReplaySessions(params?: any): Promise<APIResponse<PaginatedResponse<ReplaySession>>>;
  static async getReplaySession(id: string): Promise<APIResponse<ReplaySession>>;
  static async deleteReplaySession(id: string): Promise<APIResponse>;
  
  // 重放记录管理
  static async getReplaySessionRecords(sessionId: string, params?: any): Promise<APIResponse<PaginatedResponse<ReplayRecord>>>;
  
  // 调试重放
  static async replayDebug(data: ReplayDebugRequest): Promise<APIResponse<ReplayRecord>>;
}
```

## 🗃️ 状态管理

### 新增状态管理
```typescript
interface ReplaySessionState {
  replaySessions: ReplaySession[];
  currentReplaySession: ReplaySession | null;
  replayRecords: ReplayRecord[];
  loading: boolean;
  pagination: PaginationState;
  
  // 方法
  fetchReplaySessions: (page?: number, pageSize?: number) => Promise<void>;
  createReplaySession: (data: CreateReplaySessionRequest) => Promise<void>;
  deleteReplaySession: (id: string) => Promise<void>;
  fetchReplaySessionRecords: (sessionId: string, page?: number, pageSize?: number) => Promise<void>;
  replayDebug: (data: ReplayDebugRequest) => Promise<void>;
}
```

## 🔄 用户交互流程

### 从生产环境开始调试
```
1. 用户在Records页面选择某个轮次
2. 点击"开始调试"按钮
3. 弹出StartDebugModal，确认调试参数
4. 创建ReplaySession，跳转到ReplayDebug页面
5. 在调试界面进行多轮对话调试
```

### 管理调试会话
```
1. 用户在ReplaySessions页面查看所有调试会话
2. 点击某个调试会话进入调试界面
3. 在调试界面查看历史记录，继续调试
4. 可以删除不需要的调试会话
```

## 🎨 界面设计要点

### ReplaySessions页面
- **布局**: 列表形式显示所有调试会话
- **内容**: 会话名称、关联会话、开始轮次、状态、时间
- **操作**: 查看调试、删除按钮

### ReplayDebug页面
- **布局**: 类似聊天应用的界面设计
- **左侧**: 调试记录列表（类似微信聊天）
- **右侧**: 调试配置面板（模型、参数设置）
- **底部**: 输入框和发送按钮
- **特性**: 实时显示调试结果

## 📋 实现计划

### 第一阶段: 基础架构
- [ ] 更新类型定义
- [ ] 更新API服务
- [ ] 更新状态管理

### 第二阶段: 调试会话管理
- [ ] 实现ReplaySessions页面
- [ ] 实现ReplaySessionItem组件
- [ ] 集成到主导航

### 第三阶段: 开始调试功能
- [ ] 实现StartDebugModal组件
- [ ] 在Records页面集成"开始调试"按钮
- [ ] 实现调试会话创建流程

### 第四阶段: 调试界面
- [ ] 实现ReplayDebug页面
- [ ] 实现DebugChat组件
- [ ] 实现DebugInput组件
- [ ] 实现DebugConfig组件

### 第五阶段: 优化完善
- [ ] 界面美化
- [ ] 用户体验优化
- [ ] 错误处理
- [ ] 性能优化

## 🚀 开发指南

### 环境设置
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循React Hooks最佳实践
- 使用Zustand进行状态管理
- 使用Ant Design组件库保持UI一致性

### 代码组织
- 页面组件放在`pages`目录
- 通用组件放在`components`目录
- API调用统一在`services/api.ts`
- 状态管理统一在`stores/index.ts`
- 类型定义统一在`types/index.ts`

## 🔗 相关文档

- [后端API文档](../README.md)
- [Ant Design组件库](https://ant.design/components/overview/)
- [React官方文档](https://react.dev/)
- [TypeScript官方文档](https://www.typescriptlang.org/)
