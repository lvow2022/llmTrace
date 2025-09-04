import axios from 'axios';
import { 
  Session, 
  Record, 
  Playground,
  CreatePlaygroundRequest,
  PlaygroundDebugRequest,
  CreateDebugSessionFromRecordRequest,
  APIResponse,
  PlaygroundDetailResponse
} from '../types';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 会话相关 API
export const sessionsAPI = {
  // 获取会话列表
  getSessions: (): Promise<Session[]> => 
    api.get('/sessions'),
  
  // 获取指定会话的记录
  getSessionRecords: (sessionId: number): Promise<Record[]> => 
    api.get(`/sessions/${sessionId}/records`),
};

// 记录相关 API
export const recordsAPI = {
  // 获取记录详情
  getRecord: (recordId: number): Promise<Record> => 
    api.get(`/records/${recordId}`),
  
  // 从记录创建调试会话
  createDebugSessionFromRecord: (recordId: string, data: CreateDebugSessionFromRecordRequest): Promise<any> =>
    api.post(`/records/${recordId}/create-debug-session`, data),
};

// Playground 相关 API
export const playgroundsAPI = {
  // 获取 Playground 列表
  getPlaygrounds: (): Promise<Playground[]> => 
    api.get('/playgrounds'),
  
  // 获取 Playground 详情
  getPlayground: async (playgroundId: number): Promise<PlaygroundDetailResponse> => {
    const response = await api.get(`/playground/${playgroundId}`);
    // 如果后端返回的是包装格式，提取 data 字段
    if (response && response.data) {
      return response.data as PlaygroundDetailResponse;
    }
    return response as unknown as PlaygroundDetailResponse;
  },
  
  // 创建 Playground
  createPlayground: (data: CreatePlaygroundRequest): Promise<Playground> => 
    api.post('/playgrounds', data),
  
  // 删除 Playground
  deletePlayground: (playgroundId: number): Promise<void> => 
    api.delete(`/playground/${playgroundId}`),
  
  // 获取 Playground 下的调试会话
  getPlaygroundSessions: (playgroundId: number): Promise<any[]> => 
    api.get(`/playground/${playgroundId}/sessions`),
  
  // 获取调试会话详情
  getDebugSession: async (playgroundId: number, sessionId: number): Promise<any> => {
    const response = await api.get(`/playground/${playgroundId}/sessions/${sessionId}`);
    console.log('API 原始响应:', response);
    // 如果后端返回的是包装格式，提取 data 字段
    if (response && response.data) {
      console.log('提取 data 字段:', response.data);
      return response.data as any;
    }
    console.log('直接返回响应:', response);
    return response as unknown as any;
  },
  
  // 删除调试会话
  deleteDebugSession: (playgroundId: number, sessionId: number): Promise<void> => 
    api.delete(`/playground/${playgroundId}/sessions/${sessionId}`),
  
  // 执行调试
  debug: (playgroundId: number, sessionId: number, data: PlaygroundDebugRequest): Promise<any> => 
    api.post(`/playground/${playgroundId}/sessions/${sessionId}/debug`, data),
};

// 提供商相关 API
export const providersAPI = {
  // 获取可用的提供商和模型信息
  getProviders: (): Promise<any[]> => 
    api.get('/providers'),
};

// 埋点相关 API
export const traceAPI = {
  // 发送埋点数据
  sendTrace: (data: any): Promise<APIResponse> => 
    api.post('/trace', data),
};

export default api;
