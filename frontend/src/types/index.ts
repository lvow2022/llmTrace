// API响应基础结构
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 分页响应结构
export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

// 会话数据结构（生产环境）
export interface Session {
  id: string;
  name: string;
  created_at: string;
}

// 调用记录数据结构（生产环境）
export interface Record {
  id: string;
  session_id: string;
  turn_number: number;
  request: string;
  response: string;
  status: 'success' | 'error' | 'pending';
  error_msg: string;
  metadata: string;
  created_at: string;
}

// Playground环境
export interface Playground {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// 调试会话数据结构
export interface DebugSession {
  id: string;
  playground_id: string;
  original_session_id: string;
  original_record_id: string;
  name: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

// 调试记录数据结构
export interface DebugRecord {
  id: string;
  debug_session_id: string;
  turn_number: number;
  request: string;
  response: string;
  status: string;
  error_msg: string;
  provider: string;
  model: string;
  config: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

// 调试会话详情（包含所有记录）
export interface DebugSessionWithRecords extends DebugSession {
  records: DebugRecord[];
}

// 埋点请求数据结构
export interface TraceRequest {
  trace_id: string;
  turn_number: number;
  request: any;
  response?: any;
  status: 'success' | 'error' | 'pending';
  error_message?: string;
  metadata?: any;
}

// 创建Playground请求
export interface CreatePlaygroundRequest {
  name: string;
  description?: string;
}

// 从记录创建调试会话请求
export interface CreateDebugSessionFromRecordRequest {
  playground_id: string;
  name?: string;
}

// 调试请求
export interface DebugRequest {
  turn_number: number;
  request: any;
  provider: string;
  model: string;
  config?: any;
}

// 模型信息
export interface ModelInfo {
  name: string;
  model: string;
  enabled: boolean;
}

// Provider信息
export interface ProviderInfo {
  name: string;
  type: string;
  enabled: boolean;
  models: ModelInfo[];
}

// 查询参数
export interface QueryParams {
  page?: number;
  size?: number;
}

// 会话查询参数
export interface SessionQueryParams extends QueryParams {
  // 可以添加会话特定的查询参数
}

// 记录查询参数
export interface RecordQueryParams extends QueryParams {
  session_id: string;
}

// Playground查询参数
export interface PlaygroundQueryParams extends QueryParams {
  // 可以添加Playground特定的查询参数
}

// 调试会话查询参数
export interface DebugSessionQueryParams extends QueryParams {
  playground_id: string;
}

// 表格列配置
export interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: any, record: any) => React.ReactNode;
  width?: number | string;
  ellipsis?: boolean;
}

// 菜单项配置
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

// 重放配置
export interface ReplayConfig {
  id: string;
  name: string;
  description?: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  config?: any;
  created_at: string;
  updated_at: string;
}

// 重放会话
export interface ReplaySession {
  id: string;
  name: string;
  config_id: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// 重放记录
export interface ReplayRecord {
  id: string;
  replay_session_id: string;
  turn_number: number;
  request: any;
  response: any;
  status: 'success' | 'error' | 'pending';
  error_msg?: string;
  created_at: string;
}

// 创建重放会话请求
export interface CreateReplaySessionRequest {
  name: string;
  config_id: string;
}

// 重放调试请求
export interface ReplayDebugRequest {
  replay_session_id: string;
  turn_number: number;
  request: any;
  config?: any;
}
