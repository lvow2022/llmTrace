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

// 重放会话数据结构（调试环境）
export interface ReplaySession {
  id: string;
  name: string;
  original_session_id: string;
  start_turn_number: number;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

// 重放记录数据结构（调试环境）
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

// 埋点请求数据结构
export interface TraceRequest {
  session_id: string;
  turn_number: number;
  request: any;
  response?: any;
  status: 'success' | 'error' | 'pending';
  error_message?: string;
  metadata?: any;
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

// 重放请求数据结构（单次重放）
export interface ReplayRequest {
  session_id: string;
  turn_number: number;
  request: any;
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
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

// 重放会话查询参数
export interface ReplaySessionQueryParams extends QueryParams {
  // 可以添加重放会话特定的查询参数
}

// 重放记录查询参数
export interface ReplayRecordQueryParams extends QueryParams {
  replay_session_id: string;
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
