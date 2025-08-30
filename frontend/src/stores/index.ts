import { create } from 'zustand';
import { Session, Record, PaginatedResponse, ReplaySession, ReplayRecord, CreateReplaySessionRequest, ReplayDebugRequest } from '../types';
import { APIService } from '../services/api';

// 会话状态
interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // Actions
  fetchSessions: (page?: number, pageSize?: number) => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  loading: false,
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
  },

  fetchSessions: async (page = 1, pageSize = 20) => {
    set({ loading: true });
    try {
      const response = await APIService.getSessions({ page, size: pageSize });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Session>;
        set({
          sessions: data.data,
          pagination: {
            current: data.page,
            pageSize: data.size,
            total: data.total,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      set({ loading: false });
    }
  },

  setCurrentSession: (session) => {
    set({ currentSession: session });
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));

// 记录状态
interface RecordState {
  records: Record[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // Actions
  fetchRecords: (sessionId: string, page?: number, pageSize?: number) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  replayRecord: (recordId: string, replayData: any) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  loading: false,
  pagination: {
    current: 1,
    pageSize: 50,
    total: 0,
  },

  fetchRecords: async (sessionId: string, page = 1, pageSize = 50) => {
    set({ loading: true });
    try {
      const response = await APIService.getSessionRecords(sessionId, { page, size: pageSize, session_id: sessionId });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Record>;
        set({
          records: data.data,
          pagination: {
            current: data.page,
            pageSize: data.size,
            total: data.total,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      set({ loading: false });
    }
  },

  deleteRecord: async (recordId: string) => {
    try {
      const response = await APIService.deleteRecord(recordId);
      if (response.success) {
        // 重新获取记录列表
        const { pagination } = get();
        const currentSession = useSessionStore.getState().currentSession;
        if (currentSession) {
          await get().fetchRecords(currentSession.id, pagination.current, pagination.pageSize);
        }
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  },

  replayRecord: async (recordId: string, replayData: any) => {
    try {
      const response = await APIService.replayRecord(recordId, replayData);
      if (response.success) {
        // 重新获取记录列表
        const { pagination } = get();
        const currentSession = useSessionStore.getState().currentSession;
        if (currentSession) {
          await get().fetchRecords(currentSession.id, pagination.current, pagination.pageSize);
        }
      }
    } catch (error) {
      console.error('Failed to replay record:', error);
    }
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));

// 重放会话状态
interface ReplaySessionState {
  replaySessions: ReplaySession[];
  currentReplaySession: ReplaySession | null;
  replayRecords: ReplayRecord[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // Actions
  fetchReplaySessions: (page?: number, pageSize?: number) => Promise<void>;
  createReplaySession: (data: CreateReplaySessionRequest) => Promise<ReplaySession | null>;
  deleteReplaySession: (id: string) => Promise<void>;
  setCurrentReplaySession: (session: ReplaySession | null) => void;
  fetchReplaySessionRecords: (sessionId: string, page?: number, pageSize?: number) => Promise<void>;
  replayDebug: (data: ReplayDebugRequest) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useReplaySessionStore = create<ReplaySessionState>((set, get) => ({
  replaySessions: [],
  currentReplaySession: null,
  replayRecords: [],
  loading: false,
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
  },

  fetchReplaySessions: async (page = 1, pageSize = 20) => {
    set({ loading: true });
    try {
      const response = await APIService.getReplaySessions({ page, size: pageSize });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<ReplaySession>;
        set({
          replaySessions: data.data,
          pagination: {
            current: data.page,
            pageSize: data.size,
            total: data.total,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch replay sessions:', error);
    } finally {
      set({ loading: false });
    }
  },

  createReplaySession: async (data: CreateReplaySessionRequest) => {
    set({ loading: true });
    try {
      const response = await APIService.createReplaySession(data);
      if (response.success && response.data) {
        const newSession = response.data;
        // 添加到列表中
        const { replaySessions } = get();
        set({
          replaySessions: [newSession, ...replaySessions],
        });
        return newSession;
      }
      return null;
    } catch (error) {
      console.error('Failed to create replay session:', error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  deleteReplaySession: async (id: string) => {
    try {
      const response = await APIService.deleteReplaySession(id);
      if (response.success) {
        // 从列表中移除
        const { replaySessions } = get();
        set({
          replaySessions: replaySessions.filter(session => session.id !== id),
        });
        // 如果删除的是当前会话，清空当前会话
        const { currentReplaySession } = get();
        if (currentReplaySession?.id === id) {
          set({ currentReplaySession: null, replayRecords: [] });
        }
      }
    } catch (error) {
      console.error('Failed to delete replay session:', error);
    }
  },

  setCurrentReplaySession: (session) => {
    set({ currentReplaySession: session });
  },

  fetchReplaySessionRecords: async (sessionId: string, page = 1, pageSize = 50) => {
    set({ loading: true });
    try {
      const response = await APIService.getReplaySessionRecords(sessionId, { page, size: pageSize, replay_session_id: sessionId });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<ReplayRecord>;
        set({
          replayRecords: data.data,
          pagination: {
            current: data.page,
            pageSize: data.size,
            total: data.total,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch replay session records:', error);
    } finally {
      set({ loading: false });
    }
  },

  replayDebug: async (data: ReplayDebugRequest) => {
    set({ loading: true });
    try {
      const response = await APIService.replayDebug(data);
      if (response.success && response.data) {
        const newRecord = response.data;
        // 添加到记录列表中
        const { replayRecords } = get();
        set({
          replayRecords: [...replayRecords, newRecord],
        });
      }
    } catch (error) {
      console.error('Failed to replay debug:', error);
    } finally {
      set({ loading: false });
    }
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));

// 应用全局状态
interface AppState {
  collapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  toggleCollapsed: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  theme: 'light',

  toggleCollapsed: () => {
    set((state) => ({ collapsed: !state.collapsed }));
  },

  setTheme: (theme) => {
    set({ theme });
  },
}));
