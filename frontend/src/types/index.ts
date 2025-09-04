// 基础数据结构
export interface Session {
  id: number; // 改为number类型，匹配后端的uint类型
  name: string;
  trace_id?: string; // 添加 trace_id 字段
  created_at: string;
}

export interface Record {
  id: number; // 改为number类型，匹配后端的uint类型
  session_id: number; // 改为number类型，匹配后端的uint类型
  turn_number: number;
  request: string;
  response: string;
  status: string;
  error_msg: string;
  metadata: string;
  created_at: string;
  requestMessages: any[];
  responseMessages: any[];
}

export interface PlaygroundSession {
  id: number; // 改为number类型，匹配后端的uint类型
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 添加正确的Playground类型定义，匹配后端返回的数据结构
export interface Playground {
  id: number; // 匹配后端的uint类型
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlaygroundRecord {
  id: string;
  playground_session_id: string;
  turn_number: number;
  original_record_id: string;
  request: string;
  response: string;
  status: string;
  error_msg: string;
  provider: string;
  model: string;
  config: string;
  created_at: string;
  updated_at: string;
}

// 调试会话相关类型
export interface DebugSession {
  id: number; // 改为number类型，匹配后端的uint类型
  name: string;
  playground_id: number; // 改为number类型，匹配后端的uint类型
  original_session_id: number; // 改为number类型，匹配后端的uint类型
  original_record_id: number; // 改为number类型，匹配后端的uint类型
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: string; // user, assistant, system
  content: string; // 消息内容
}

export interface ModelConfig {
  temperature?: number; // 温度参数 (0.0-2.0)
  max_tokens?: number; // 最大token数
  top_p?: number; // Top-p参数 (0.0-1.0)
  stream?: boolean; // 是否流式响应
}

// API 请求/响应类型
export interface CreatePlaygroundRequest { 
  name: string; // playground 名称
  description?: string; // playground 描述
}

export interface CreateDebugSessionRequest {
  playground_id: number; // playground ID，改为number类型
  original_session_id: number; // 来源会话ID，改为number类型
  original_record_id: number; // 来源记录ID，改为number类型
  name?: string; // 可选，自动生成
}

export interface CreateDebugSessionFromRecordRequest {
  playground_id: number; // playground ID，改为number类型
  name?: string; // 可选，自动生成
}

export interface CreatePlaygroundRecordRequest {
  original_record_id: string;
  turn_number: number;
}

export interface PlaygroundDebugRequest {
  turn_number: number;
  context: ChatMessage[]; // 对话上下文（历史消息）
  user_input: string; // 用户本次输入
  provider: string;
  model: string;
  config?: ModelConfig; // 模型配置参数
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Playground 详情响应类型
export interface PlaygroundDetailResponse {
  playground: Playground;
  sessions: DebugSession[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

// 组件 Props 类型
export interface LayoutProps {
  children: React.ReactNode;
}

export interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Record;
}

export interface PlaygroundCardProps {
  playground: PlaygroundSession;
  onViewDetail: (id: string) => void;
  onCreateDebug: (id: string) => void;
}

export interface RecordCardProps {
  record: Record;
  onViewDetail: (id: string) => void;
  onDebug: (record: Record) => void;
}

export interface SessionCardProps {
  session: Session;
  onViewDetail: (id: string) => void;
}
