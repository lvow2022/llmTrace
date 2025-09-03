import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { useAppStore } from '../store';
import { sessionsAPI } from '../services/api';
import { Session, Record } from '../types';
import DebugModal from '../components/DebugModal';
import Button from '../components/ui/Button';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentSession } = useAppStore();
  
  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 获取会话记录（这里应该直接调用获取记录的API）
      const recordsData: any = await sessionsAPI.getSessionRecords(parseInt(id));  // 转换为数字类型
      let recordsArray: Record[] = [];
      
      // 处理嵌套的数据结构
      if (recordsData && typeof recordsData === 'object') {
        if (recordsData.data && Array.isArray(recordsData.data)) {
          recordsArray = recordsData.data;
        } else if (recordsData.data && typeof recordsData.data === 'object' && 'data' in recordsData.data) {
          recordsArray = recordsData.data.data || [];
        } else if (Array.isArray(recordsData)) {
          recordsArray = recordsData;
        }
      }
      
      setRecords(recordsArray);
      
      // 从记录中提取会话信息（第一条记录应该包含会话信息）
      if (recordsArray.length > 0) {
        const firstRecord = recordsArray[0];
        // 构造会话信息
        const sessionInfo: Session = {
          id: parseInt(id),  // 确保id是数字类型
          name: `会话 ${id}`,
          trace_id: firstRecord.session_id.toString(), // 使用 session_id 作为 trace_id，转换为字符串
          created_at: firstRecord.created_at
        };
        setSession(sessionInfo);
        setCurrentSession(sessionInfo);
      } else {
        // 如果没有记录，创建一个基本的会话信息
        const sessionInfo: Session = {
          id: parseInt(id),  // 确保id是数字类型
          name: `会话 ${id}`,
          created_at: new Date().toISOString()
        };
        setSession(sessionInfo);
        setCurrentSession(sessionInfo);
      }
      
    } catch (err: any) {
      console.error('获取会话详情失败:', err);
      setError(err.message || '获取会话详情失败');
    } finally {
      setLoading(false);
    }
  }, [id, setCurrentSession]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const handleDebug = (record: Record) => {
    setSelectedRecord(record);
    setShowDebugModal(true);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载会话详情中...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
        <p className="mt-1 text-sm text-gray-500">{error || '会话不存在'}</p>
        <div className="mt-6">
          <Link
            to="/sessions"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            返回会话列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/sessions"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回会话列表</span>
          </Link>
        </div>
      </div>

      {/* 会话信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
              <p className="text-sm text-gray-600">会话 ID: {session.id}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">创建时间</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(session.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        
        {session.trace_id && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Trace ID:</span>
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {session.trace_id}
                </code>
              </div>
              <button
                onClick={() => session.trace_id && copyToClipboard(session.trace_id, 'trace')}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {copied === 'trace' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'trace' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              调用记录 ({records.length})
            </h2>
            <div className="text-sm text-gray-500">
              按时间顺序排列
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {records.length > 0 ? (
            <div className="space-y-4">
              {records.map((record, index) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{record.turn_number}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                            {record.status === 'success' ? '成功' : 
                             record.status === 'error' ? '失败' : 
                             record.status === 'pending' ? '处理中' : record.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>创建时间: {new Date(record.created_at).toLocaleString()}</span>
                        </div>
                        {record.error_msg && (
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-600">错误: {record.error_msg}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 请求和响应预览 */}
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">请求内容</span>
                            <button
                              onClick={() => copyToClipboard(record.request, `request-${record.id}`)}
                              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              {copied === `request-${record.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copied === `request-${record.id}` ? '已复制' : '复制'}</span>
                            </button>
                          </div>
                          <div className="bg-gray-50 rounded p-3 max-h-20 overflow-y-auto">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {record.request.length > 200 ? record.request.substring(0, 200) + '...' : record.request}
                            </pre>
                          </div>
                        </div>
                        
                        {record.response && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">响应内容</span>
                              <button
                                onClick={() => copyToClipboard(record.response, `response-${record.id}`)}
                                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                              >
                                {copied === `response-${record.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-green-600" />}
                                <span>{copied === `response-${record.id}` ? '已复制' : '复制'}</span>
                              </button>
                            </div>
                            <div className="bg-gray-50 rounded p-3 max-h-20 overflow-y-auto">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                {record.response.length > 200 ? record.response.substring(0, 200) + '...' : record.response}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link
                        to={`/records/${record.id}`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        查看详情
                      </Link>
                      
                      <Button
                        onClick={() => handleDebug(record)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        开始调试
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>暂无调用记录</p>
            </div>
          )}
        </div>
      </div>

      {/* 调试弹窗 */}
      {showDebugModal && selectedRecord && (
        <DebugModal
          isOpen={showDebugModal}
          onClose={() => setShowDebugModal(false)}
          record={selectedRecord}
        />
      )}
    </div>
  );
};

export default SessionDetail;
