import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';
import { sessionsAPI } from '../services/api';
import { Session } from '../types';

const Sessions: React.FC = () => {
  const { sessions, setSessions, loading, setLoading } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading('sessions', true);
      const data: any = await sessionsAPI.getSessions();
      
      // 处理嵌套的数据结构
      let sessionsArray: Session[] = [];
      if (data && typeof data === 'object') {
        if (data.data && Array.isArray(data.data)) {
          // 直接结构：{ data: [...], total: 1, page: 1, size: 20, total_pages: 1 }
          sessionsArray = data.data;
        } else if (data.data && typeof data.data === 'object' && 'data' in data.data) {
          // 嵌套结构：{ data: { data: [...], total: 1, page: 1, size: 20, total_pages: 1 } }
          sessionsArray = data.data.data || [];
        } else if (Array.isArray(data)) {
          // 数组结构：直接是数据数组
          sessionsArray = data;
        }
      }
      
      if (Array.isArray(sessionsArray)) {
        setSessions(sessionsArray);
      } else {
        console.error('API 返回的数据格式不正确:', data);
        setSessions([]);
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
      setSessions([]);
    } finally {
      setLoading('sessions', false);
    }
  }, []); // 移除依赖，避免无限循环

  useEffect(() => {
    fetchSessions();
  }, []); // 只在组件挂载时调用一次

  useEffect(() => {
    // 确保 sessions 是数组，然后进行过滤
    if (Array.isArray(sessions)) {
      const filtered = sessions.filter(session =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.id.toString().toLowerCase().includes(searchTerm.toLowerCase())  // 转换为字符串进行搜索
      );
      setFilteredSessions(filtered);
    } else {
      // 如果 sessions 不是数组，设置为空数组
      console.warn('sessions 不是数组:', sessions);
      setFilteredSessions([]);
    }
  }, [sessions, searchTerm]);

  const SessionCard: React.FC<{ session: Session }> = ({ session }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
              <p className="text-sm text-gray-500">ID: {session.id}</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>创建时间: {new Date(session.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <Link
          to={`/sessions/${session.id}`}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <span>查看详情</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">会话管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          管理生产环境中的对话会话和调用记录
        </p>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">搜索会话</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="搜索会话名称或ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              共 {filteredSessions.length} 个会话
            </span>
          </div>
        </div>
      </div>

      {/* 会话列表 */}
      <div>
        {loading.sessions ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载会话中...</p>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? '没有找到匹配的会话' : '暂无会话数据'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '尝试调整搜索条件' : '开始创建第一个会话'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
