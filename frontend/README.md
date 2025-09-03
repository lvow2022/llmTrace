# LLM Trace 前端

这是 LLM Trace 项目的前端界面，基于 React + TypeScript + Tailwind CSS 构建。

## 功能特性

### 🎯 核心功能
- **生产环境监控**: 查看会话和调用记录
- **调试环境管理**: 创建和管理 Playground 调试环境
- **智能调试**: 基于生产记录创建调试会话
- **参数调优**: 支持调整模型参数进行测试

### 🎨 界面设计
- **现代简约**: 采用卡片式布局，界面清晰易用
- **响应式设计**: 完美适配桌面、平板、手机
- **深色主题**: 科技感配色，减少眼部疲劳
- **交互友好**: 支持拖拽、实时更新等高级交互

### 🚀 技术栈
- **React 18**: 最新的 React 版本
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 原子化 CSS 框架
- **Zustand**: 轻量级状态管理
- **React Router**: 客户端路由
- **Axios**: HTTP 客户端
- **Lucide React**: 现代化图标库

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── ui/            # UI 基础组件
│   │   ├── Button.tsx # 按钮组件
│   │   └── Modal.tsx  # 模态框组件
│   ├── Layout.tsx     # 主布局组件
│   └── DebugModal.tsx # 调试弹窗组件
├── pages/              # 页面组件
│   ├── Dashboard.tsx  # 仪表盘页面
│   ├── Sessions.tsx   # 会话管理页面
│   ├── RecordDetail.tsx # 记录详情页面
│   ├── Playgrounds.tsx # 调试环境管理页面
│   └── ...            # 其他页面
├── services/           # API 服务
│   └── api.ts         # API 接口封装
├── store/              # 状态管理
│   └── index.ts       # Zustand 状态管理
├── types/              # 类型定义
│   └── index.ts       # TypeScript 类型
├── App.tsx             # 主应用组件
└── index.tsx           # 应用入口
```

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 启动开发服务器
```bash
npm start
# 或
yarn start
```

应用将在 http://localhost:3000 启动

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

## 核心页面说明

### 1. 仪表盘 (`/`)
- 系统概览和统计信息
- 快速操作入口
- 最近活动展示

### 2. 会话管理 (`/sessions`)
- 生产环境会话列表
- 搜索和过滤功能
- 会话详情查看

### 3. 记录详情 (`/records/:id`)
- 显示调用记录详细信息
- 请求/响应内容展示
- **Debug 按钮** - 创建调试环境

### 4. 调试环境 (`/playgrounds`)
- Playground 列表管理
- 调试环境创建和配置
- 调试会话管理

## 核心交互流程

### Debug 流程
1. 在生产环境浏览会话和记录
2. 点击感兴趣的记录查看详情
3. 点击"开始调试"按钮
4. 选择现有 Playground 或创建新的
5. 自动跳转到调试环境开始调试

### Playground 管理
- 每个 Playground 基于特定的生产记录创建
- 支持在 Playground 中创建多个调试会话
- 可以调整模型参数进行 A/B 测试

## 开发指南

### 添加新页面
1. 在 `src/pages/` 目录下创建页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/types/index.ts` 中添加相关类型定义

### 添加新组件
1. 在 `src/components/` 目录下创建组件
2. 使用 TypeScript 定义 Props 接口
3. 遵循项目的设计规范和样式约定

### 状态管理
- 使用 Zustand 进行全局状态管理
- 在 `src/store/index.ts` 中定义状态和操作
- 组件中通过 `useAppStore()` 访问状态

### API 集成
- 在 `src/services/api.ts` 中封装 API 调用
- 使用统一的错误处理和响应格式
- 支持请求拦截和响应处理

## 样式规范

### 颜色系统
- **主色调**: 蓝色系 (`blue-600`, `blue-700`)
- **成功色**: 绿色系 (`green-500`, `green-600`)
- **警告色**: 黄色系 (`yellow-500`, `yellow-600`)
- **错误色**: 红色系 (`red-500`, `red-600`)
- **中性色**: 灰色系 (`gray-50` 到 `gray-900`)

### 组件样式
- 使用 Tailwind CSS 类名
- 遵循移动优先的响应式设计
- 保持一致的间距和圆角规范
- 使用适当的阴影和过渡效果

## 部署说明

### 开发环境
- 后端服务运行在 `http://localhost:8080`
- 前端开发服务器运行在 `http://localhost:3000`
- 通过 proxy 配置转发 API 请求

### 生产环境
- 构建后的静态文件可以部署到任何静态文件服务器
- 需要配置正确的后端 API 地址
- 支持环境变量配置

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
