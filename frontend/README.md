# LLM Trace 前端

这是LLM调用追踪系统的前端实现，基于React + TypeScript + Ant Design构建。

## 🚀 功能特性

### 📊 仪表盘
- 系统概览统计
- 会话和记录数量统计
- 最近会话和记录展示
- 实时数据更新

### 💬 会话管理
- 会话列表展示
- 会话搜索和筛选
- 会话详情查看
- 会话统计信息

### 📝 调用记录
- 记录列表展示
- 状态筛选（成功/错误/处理中）
- 记录详情查看
- 请求和响应内容展示
- **记录重放功能** - 支持选择不同的AI Provider
- 记录删除功能

### ⚙️ 系统设置
- API配置管理
- 界面主题设置
- 分页大小配置
- 数据保留策略

### 🤖 AI Provider管理
- **多Provider支持** - OpenAI、Anthropic、Azure、Custom
- **Provider选择** - 重放时选择不同的AI服务
- **配置管理** - 后端统一管理API密钥
- **动态切换** - 支持运行时切换Provider

## 🛠️ 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **UI组件库**: Ant Design 5.x
- **状态管理**: Zustand
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **构建工具**: Create React App

## 📦 安装和运行

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖
```bash
cd frontend
npm install
```

### 开发环境运行
```bash
npm start
```

应用将在 http://localhost:3000 启动

### 生产环境构建
```bash
npm run build
```

构建产物将生成在 `build` 目录中

## 🔧 配置说明

### 环境变量
创建 `.env` 文件来配置环境变量：

```env
# API服务器地址
REACT_APP_API_BASE_URL=http://localhost:8080/api

# 应用标题
REACT_APP_TITLE=LLM Trace

# 是否启用调试模式
REACT_APP_DEBUG=true
```

### API配置
确保后端API服务器正在运行，默认地址为 `http://localhost:8080/api`

## 📁 项目结构

```
src/
├── components/          # 通用组件
│   └── Layout/         # 布局组件
├── pages/              # 页面组件
│   ├── Dashboard/      # 仪表盘
│   ├── Sessions/       # 会话管理
│   ├── Records/        # 调用记录
│   └── Settings/       # 系统设置
├── services/           # API服务
├── stores/             # 状态管理
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
├── App.tsx             # 主应用组件
└── index.tsx           # 应用入口
```

## 🎨 界面设计

### 设计原则
- **简洁明了**: 界面简洁，信息层次清晰
- **响应式**: 支持桌面和移动设备
- **一致性**: 统一的视觉风格和交互模式
- **可访问性**: 支持键盘导航和屏幕阅读器

### 主题支持
- 浅色主题（默认）
- 深色主题
- 自动主题切换

## 🎯 **特色功能**

1. **重放功能** - 可以修改历史请求并重新执行
2. **多Provider支持** - 支持选择不同的AI服务提供商
3. **JSON编辑器** - 支持格式化和验证
4. **复制功能** - 一键复制请求/响应数据
5. **状态管理** - 实时状态更新和同步
6. **响应式设计** - 适配各种屏幕尺寸

## 🔌 API集成

### 主要接口
- `POST /api/trace` - 埋点数据上报
- `GET /api/sessions` - 获取会话列表
- `GET /api/sessions/:id/records` - 获取会话记录
- `POST /api/records/:id/replay` - 重放记录（支持Provider选择）
- `DELETE /api/records/:id` - 删除记录
- `GET /api/providers` - 获取可用的AI Providers

### 错误处理
- 统一的错误处理机制
- 友好的错误提示
- 网络异常重试

## 🚀 部署

### 静态文件部署
```bash
npm run build
```

将 `build` 目录中的文件部署到Web服务器

### Docker部署
```dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循TypeScript最佳实践

### 组件开发
- 使用函数式组件和Hooks
- 保持组件的单一职责
- 合理使用TypeScript类型

### 状态管理
- 使用Zustand进行全局状态管理
- 本地状态使用useState
- 复杂状态逻辑使用useReducer



## 📝 更新日志

### v1.1.0
- 新增多Provider支持
- 重放功能支持选择不同的AI服务
- 新增Provider管理接口
- 优化重放模态框界面

### v1.0.0
- 初始版本发布
- 基础功能实现
- 响应式设计支持

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🆘 支持

如有问题，请提交Issue或联系开发团队。
