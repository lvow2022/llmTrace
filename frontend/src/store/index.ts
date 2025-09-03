import { create } from 'zustand';
import { 
  Session, 
  Record as TraceRecord, 
  Playground,
  DebugSession
} from '../types';

interface AppState {
  // 生产环境数据
  sessions: Session[];
  records: TraceRecord[];
  
  // Playground 环境数据
  playgrounds: Playground[];  // 改为Playground类型
  debugSessions: Record<string, DebugSession[]>; // playgroundId -> debugSessions
  
  // 当前选中状态
  currentSession?: Session;
  currentPlayground?: Playground;  // 改为Playground类型
  currentRecord?: TraceRecord;
  
  // 加载状态
  loading: {
    sessions: boolean;
    records: boolean;
    playgrounds: boolean;
    debugSessions: boolean;
  };
  
  // 操作函数
  setSessions: (sessions: Session[]) => void;
  setRecords: (records: TraceRecord[]) => void;
  setPlaygrounds: (playgrounds: Playground[]) => void;
  setDebugSessions: (playgroundId: number, sessions: DebugSession[]) => void;
  setCurrentSession: (session?: Session) => void;
  setCurrentPlayground: (playground?: Playground) => void;
  setCurrentRecord: (record?: TraceRecord) => void;
  setLoading: (key: keyof AppState['loading'], value: boolean) => void;
  
  // 添加新数据
  addSession: (session: Session) => void;
  addRecord: (record: TraceRecord) => void;
  addPlayground: (playground: Playground) => void;
  addDebugSession: (playgroundId: number, session: DebugSession) => void;
  
  // 更新数据
  updateSession: (id: number, updates: Partial<Session>) => void;
  updateRecord: (id: number, updates: Partial<TraceRecord>) => void;
  updatePlayground: (id: number, updates: Partial<Playground>) => void;
  updateDebugSession: (playgroundId: number, sessionId: number, updates: Partial<DebugSession>) => void;
  
  // 删除数据
  removeSession: (id: number) => void;
  removeRecord: (id: number) => void;
  removePlayground: (id: number) => void;
  removeDebugSession: (playgroundId: number, sessionId: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  sessions: [],
  records: [],
  playgrounds: [],
  debugSessions: {},
  loading: {
    sessions: false,
    records: false,
    playgrounds: false,
    debugSessions: false,
  },
  
  // 设置数据
  setSessions: (sessions) => set({ sessions }),
  setRecords: (records) => set({ records }),
  setPlaygrounds: (playgrounds) => {
    console.log('Store: 设置playgrounds数据:', playgrounds);
    set({ playgrounds });
  },
  setDebugSessions: (playgroundId, sessions) => 
    set((state) => ({
      debugSessions: { ...state.debugSessions, [playgroundId]: sessions }
    })),
  
  setCurrentSession: (session) => set({ currentSession: session }),
  setCurrentPlayground: (playground) => set({ currentPlayground: playground }),
  setCurrentRecord: (record) => set({ currentRecord: record }),
  
  setLoading: (key, value) => 
    set((state) => ({
      loading: { ...state.loading, [key]: value }
    })),
  
  // 添加数据
  addSession: (session) => 
    set((state) => ({ sessions: [...state.sessions, session] })),
  
  addRecord: (record) => 
    set((state) => ({ records: [...state.records, record] })),
  
  addPlayground: (playground) => 
    set((state) => ({ playgrounds: [...state.playgrounds, playground] })),
  
  addDebugSession: (playgroundId, session) => 
    set((state) => {
      const currentSessions = state.debugSessions[playgroundId] || [];
      return {
        debugSessions: {
          ...state.debugSessions,
          [playgroundId]: [...currentSessions, session]
        }
      };
    }),
  
  // 更新数据
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
    })),
  
  updateRecord: (id, updates) =>
    set((state) => ({
      records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
    })),
  
  updatePlayground: (id, updates) =>
    set((state) => ({
      playgrounds: state.playgrounds.map(p => p.id === id ? { ...p, ...updates } : p)
    })),
  
  updateDebugSession: (playgroundId, sessionId, updates) =>
    set((state) => {
      const currentSessions = state.debugSessions[playgroundId] || [];
      const updatedSessions = currentSessions.map(s => 
        s.id === sessionId ? { ...s, ...updates } : s
      );
      return {
        debugSessions: {
          ...state.debugSessions,
          [playgroundId]: updatedSessions
        }
      };
    }),
  
  // 删除数据
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter(s => s.id !== id)
    })),
  
  removeRecord: (id) =>
    set((state) => ({
      records: state.records.filter(r => r.id !== id)
    })),
  
  removePlayground: (id) =>
    set((state) => ({
      playgrounds: state.playgrounds.filter(p => p.id !== id),
      debugSessions: Object.fromEntries(
        Object.entries(state.debugSessions).filter(([key]) => parseInt(key) !== id)
      )
    })),
  
  removeDebugSession: (playgroundId, sessionId) =>
    set((state) => {
      const currentSessions = state.debugSessions[playgroundId] || [];
      const filteredSessions = currentSessions.filter(s => s.id !== sessionId);
      return {
        debugSessions: {
          ...state.debugSessions,
          [playgroundId]: filteredSessions
        }
      };
    }),
}));
