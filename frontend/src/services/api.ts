import axios, { AxiosResponse } from 'axios';
import { 
  APIResponse, 
  PaginatedResponse, 
  Session, 
  Record, 
  TraceRequest, 
  SessionQueryParams,
  RecordQueryParams,
  ProviderInfo,
  Playground,
  DebugSession,
  CreatePlaygroundRequest,
  CreateDebugSessionFromRecordRequest,
  DebugRequest
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 120000, // 增加到120秒，因为调试请求可能需要较长时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<APIResponse>) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API服务类
export class APIService {
  // 埋点数据上报
  static async submitTrace(traceData: TraceRequest): Promise<APIResponse> {
    const response = await api.post<APIResponse>('/trace', traceData);
    return response.data;
  }

  // 获取会话列表
  static async getSessions(params: SessionQueryParams = {}): Promise<APIResponse<PaginatedResponse<Session>>> {
    const response = await api.get<APIResponse<PaginatedResponse<Session>>>('/sessions', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response.data;
  }

  // 获取会话记录
  static async getSessionRecords(sessionId: string, params: Partial<RecordQueryParams> = {}): Promise<APIResponse<PaginatedResponse<Record>>> {
    const response = await api.get<APIResponse<PaginatedResponse<Record>>>(`/sessions/${sessionId}/records`, {
      params: {
        page: params.page || 1,
        size: params.size || 50,
      },
    });
    return response.data;
  }

  // 获取单条记录详情
  static async getRecord(recordId: string): Promise<APIResponse<Record>> {
    const response = await api.get<APIResponse<Record>>(`/records/${recordId}`);
    return response.data;
  }

  // 获取可用的providers
  static async getProviders(): Promise<APIResponse<ProviderInfo[]>> {
    const response = await api.get<APIResponse<ProviderInfo[]>>('/providers');
    return response.data;
  }

  // 健康检查
  static async healthCheck(): Promise<APIResponse> {
    const response = await api.get<APIResponse>('/health');
    return response.data;
  }

  // 删除记录
  static async deleteRecord(recordId: string): Promise<APIResponse> {
    const response = await api.delete<APIResponse>(`/records/${recordId}`);
    return response.data;
  }

  // 重放记录
  static async replayRecord(recordId: string, replayData: any): Promise<APIResponse> {
    const response = await api.post<APIResponse>(`/records/${recordId}/replay`, replayData);
    return response.data;
  }

  // 获取重放会话列表
  static async getReplaySessions(params: { page?: number; size?: number } = {}): Promise<APIResponse<PaginatedResponse<any>>> {
    const response = await api.get<APIResponse<PaginatedResponse<any>>>('/replay-sessions', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response.data;
  }

  // 创建重放会话
  static async createReplaySession(data: any): Promise<APIResponse<any>> {
    const response = await api.post<APIResponse<any>>('/replay-sessions', data);
    return response.data;
  }

  // 删除重放会话
  static async deleteReplaySession(id: string): Promise<APIResponse> {
    const response = await api.delete<APIResponse>(`/replay-sessions/${id}`);
    return response.data;
  }

  // 获取重放会话记录
  static async getReplaySessionRecords(sessionId: string, params: { page?: number; size?: number; replay_session_id?: string } = {}): Promise<APIResponse<PaginatedResponse<any>>> {
    const response = await api.get<APIResponse<PaginatedResponse<any>>>(`/replay-sessions/${sessionId}/records`, {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        replay_session_id: params.replay_session_id || sessionId,
      },
    });
    return response.data;
  }

  // 重放调试
  static async replayDebug(data: any): Promise<APIResponse<any>> {
    const response = await api.post<APIResponse<any>>('/replay-debug', data);
    return response.data;
  }
}

// Playground服务
export class PlaygroundService {
  // 创建Playground
  async createPlayground(data: CreatePlaygroundRequest): Promise<APIResponse<Playground>> {
    const response = await api.post<APIResponse<Playground>>('/playground', data);
    return response.data;
  }

  // 获取Playground列表
  async getPlaygrounds(params: { page?: number; size?: number } = {}): Promise<APIResponse<PaginatedResponse<Playground>>> {
    const response = await api.get<APIResponse<PaginatedResponse<Playground>>>('/playground', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response.data;
  }

  // 获取单个Playground
  async getPlayground(id: string): Promise<APIResponse<Playground>> {
    const response = await api.get<APIResponse<Playground>>(`/playground/${id}`);
    return response.data;
  }

  // 删除Playground
  async deletePlayground(id: string): Promise<APIResponse> {
    const response = await api.delete<APIResponse>(`/playground/${id}`);
    return response.data;
  }

  // 获取调试会话列表
  async getDebugSessions(playgroundId: string, params: { page?: number; size?: number } = {}): Promise<APIResponse<PaginatedResponse<DebugSession>>> {
    const response = await api.get<APIResponse<PaginatedResponse<DebugSession>>>(`/playground/${playgroundId}/sessions`, {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response.data;
  }

  // 获取调试会话详情（包含所有记录）
  async getDebugSessionDetail(debugSessionId: string): Promise<APIResponse<any>> {
    // 这里需要根据实际的后端API调整，暂时使用一个通用的URL
    const response = await api.get<APIResponse<any>>(`/debug-sessions/${debugSessionId}`);
    return response.data;
  }

  // 删除调试会话
  async deleteDebugSession(debugSessionId: string): Promise<APIResponse> {
    // 这里需要根据实际的后端API调整，暂时使用一个通用的URL
    const response = await api.delete<APIResponse>(`/debug-sessions/${debugSessionId}`);
    return response.data;
  }

  // 从记录创建调试会话
  async createDebugSessionFromRecord(recordId: string, data: CreateDebugSessionFromRecordRequest): Promise<APIResponse<DebugSession>> {
    const response = await api.post<APIResponse<DebugSession>>(`/records/${recordId}/create-debug-session`, data);
    return response.data;
  }

  // 执行调试
  async executeDebug(debugSessionId: string, data: DebugRequest): Promise<APIResponse<any>> {
    const response = await api.post<APIResponse<any>>(`/playground-sessions/${debugSessionId}/debug`, data);
    return response.data;
  }

  // 创建调试会话（临时方法，后续可能需要调整）
  async createDebugSession(data: { playground_id: string; name: string }): Promise<APIResponse<DebugSession>> {
    // 这里需要根据实际的后端API调整
    const response = await api.post<APIResponse<DebugSession>>(`/playground/${data.playground_id}/sessions`, data);
    return response.data;
  }

  // 获取可用的providers
  async getProviders(): Promise<APIResponse<ProviderInfo[]>> {
    const response = await api.get<APIResponse<ProviderInfo[]>>('/providers');
    return response.data;
  }
}

// 导出服务实例
export const playgroundService = new PlaygroundService();

export default api;
