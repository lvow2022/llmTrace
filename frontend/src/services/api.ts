import axios from "axios";
import {
  Session,
  Record,
  Playground,
  CreatePlaygroundRequest,
  PlaygroundDebugRequest,
  CreateDebugSessionFromRecordRequest,
  APIResponse,
  PlaygroundDetailResponse,
  PaginatedResponse,
} from "../types";

// 创建 axios 实例
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// --- Sessions ---

// 获取会话列表
export const getSessions = async (): Promise<PaginatedResponse<Session>> => {
  const response = await api.get("/sessions");
  return response.data as PaginatedResponse<Session>;
};

// 获取指定会话的记录
export const getSessionRecords = async (
  sessionId: number
): Promise<PaginatedResponse<Record>> => {
  const response = await api.get(`/sessions/${sessionId}/records`);
  return response.data as PaginatedResponse<Record>;
};

// --- Records ---

// 获取记录详情
export const getRecord = async (recordId: number): Promise<Record> => {
  const response = await api.get(`/records/${recordId}`);
  return response.data as Record;
};

// 从记录创建调试会话
export const createDebugSessionFromRecord = async (
  recordId: string,
  data: CreateDebugSessionFromRecordRequest
): Promise<any> => {
  const response = await api.post(
    `/records/${recordId}/create-debug-session`,
    data
  );
  return response.data as any;
};

// --- Playgrounds ---

// 获取 Playground 列表
export const getPlaygrounds = async (): Promise<
  PaginatedResponse<Playground>
> => {
  const response = await api.get("/playgrounds");
  return response.data as PaginatedResponse<Playground>;
};

// 获取 Playground 详情
export const getPlayground = async (
  playgroundId: number
): Promise<PlaygroundDetailResponse> => {
  const response = await api.get(`/playground/${playgroundId}`);
  return response.data as PlaygroundDetailResponse;
};

// 创建 Playground
export const createPlayground = async (
  data: CreatePlaygroundRequest
): Promise<Playground> => {
  const response = await api.post("/playground", data);
  return response.data as Playground;
};

// 删除 Playground
export const deletePlayground = (playgroundId: number): Promise<void> =>
  api.delete(`/playground/${playgroundId}`);

// 获取 Playground 下的调试会话
export const getPlaygroundSessions = (playgroundId: number): Promise<any> =>
  api.get(`/playground/${playgroundId}`);

// 获取调试会话详情
export const getDebugSession = async (
  playgroundId: number,
  sessionId: number
): Promise<any> => {
  const response = await api.get(
    `/playground/${playgroundId}/sessions/${sessionId}`
  );
  console.log("API 原始响应:", response);
  // 如果后端返回的是包装格式，提取 data 字段
  if (response && response.data) {
    console.log("提取 data 字段:", response.data);
    return response.data as any;
  }
  console.log("直接返回响应:", response);
  return response as unknown as any;
};

// 删除调试会话
export const deleteDebugSession = (
  playgroundId: number,
  sessionId: number
): Promise<void> =>
  api.delete(`/playground/${playgroundId}/sessions/${sessionId}`);

// 执行调试
export const debug = ( 
  playgroundId: number,
  sessionId: number,
  data: PlaygroundDebugRequest
): Promise<any> =>
  api.post(`/playground/${playgroundId}/sessions/${sessionId}/debug`, data);

// --- Providers ---

// 获取可用的提供商和模型信息
export const getProviders = async (): Promise<any[]> => {
  const response = await api.get("/providers");
  return response.data as any[];
};

// --- Trace ---

// 发送埋点数据
export const sendTrace = (data: any): Promise<APIResponse> =>
  api.post("/trace", data);

export default api;
