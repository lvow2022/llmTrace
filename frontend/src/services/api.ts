import axios, { AxiosResponse } from 'axios';
import { 
  APIResponse, 
  PaginatedResponse, 
  Session, 
  Record, 
  TraceRequest, 
  ReplayRequest,
  SessionQueryParams,
  RecordQueryParams,
  ProviderInfo,
  ReplaySession,
  ReplayRecord,
  CreateReplaySessionRequest,
  ReplayDebugRequest,
  ReplaySessionQueryParams,
  ReplayRecordQueryParams
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 120000, // 增加到120秒，因为重放请求可能需要较长时间
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

  // 重放记录（单次重放）
  static async replayRecord(recordId: string, replayData: ReplayRequest): Promise<APIResponse<Record>> {
    const response = await api.post<APIResponse<Record>>(`/records/${recordId}/replay`, replayData);
    return response.data;
  }

  // 获取可用的providers
  static async getProviders(): Promise<APIResponse<ProviderInfo[]>> {
    const response = await api.get<APIResponse<ProviderInfo[]>>('/providers');
    return response.data;
  }

  // 删除记录
  static async deleteRecord(recordId: string): Promise<APIResponse> {
    const response = await api.delete<APIResponse>(`/records/${recordId}`);
    return response.data;
  }

  // 健康检查
  static async healthCheck(): Promise<APIResponse> {
    const response = await api.get<APIResponse>('/health');
    return response.data;
  }

  // ========== 重放会话管理 API ==========

  // 创建重放会话
  static async createReplaySession(data: CreateReplaySessionRequest): Promise<APIResponse<ReplaySession>> {
    const response = await api.post<APIResponse<ReplaySession>>('/replay-sessions', data);
    return response.data;
  }

  // 获取重放会话列表
  static async getReplaySessions(params: ReplaySessionQueryParams = {}): Promise<APIResponse<PaginatedResponse<ReplaySession>>> {
    const response = await api.get<APIResponse<PaginatedResponse<ReplaySession>>>('/replay-sessions', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response.data;
  }

  // 获取单个重放会话
  static async getReplaySession(id: string): Promise<APIResponse<ReplaySession>> {
    const response = await api.get<APIResponse<ReplaySession>>(`/replay-sessions/${id}`);
    return response.data;
  }

  // 删除重放会话
  static async deleteReplaySession(id: string): Promise<APIResponse> {
    const response = await api.delete<APIResponse>(`/replay-sessions/${id}`);
    return response.data;
  }

  // ========== 重放记录管理 API ==========

  // 获取重放会话记录
  static async getReplaySessionRecords(sessionId: string, params: Partial<ReplayRecordQueryParams> = {}): Promise<APIResponse<PaginatedResponse<ReplayRecord>>> {
    const response = await api.get<APIResponse<PaginatedResponse<ReplayRecord>>>(`/replay-sessions/${sessionId}/records`, {
      params: {
        page: params.page || 1,
        size: params.size || 50,
      },
    });
    return response.data;
  }

  // ========== 调试重放 API ==========

  // 调试重放（多轮对话）
  static async replayDebug(data: ReplayDebugRequest): Promise<APIResponse<ReplayRecord>> {
    const response = await api.post<APIResponse<ReplayRecord>>('/replay-debug', data);
    return response.data;
  }
}

export default api;
