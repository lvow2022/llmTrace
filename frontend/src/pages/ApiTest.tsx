import React, { useState } from 'react';
import { 
  Play, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Bug,
  Settings
} from 'lucide-react';
import { sessionsAPI, playgroundsAPI, providersAPI } from '../services/api';
import ApiResponseViewer from '../components/ApiResponseViewer';

interface ApiEndpoint {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: () => Promise<any>;
  color: string;
}

const ApiTest: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoints: ApiEndpoint[] = [
    {
      name: '获取会话列表',
      description: '获取所有会话的列表，支持分页',
      icon: MessageSquare,
      method: 'GET',
      path: '/api/sessions',
      handler: sessionsAPI.getSessions,
      color: 'bg-blue-500'
    },
    {
      name: '获取调试环境',
      description: '获取所有 Playground 调试环境',
      icon: Bug,
      method: 'GET',
      path: '/api/playground',
      handler: playgroundsAPI.getPlaygrounds,
      color: 'bg-purple-500'
    },
    {
      name: '获取提供商信息',
      description: '获取可用的 LLM 提供商和模型',
      icon: Settings,
      method: 'GET',
      path: '/api/providers',
      handler: providersAPI.getProviders,
      color: 'bg-green-500'
    }
  ];

  const handleApiCall = async (endpoint: ApiEndpoint) => {
    try {
      setLoading(endpoint.name);
      setError(null);
      setResponse(null);
      
      const data = await endpoint.handler();
      setResponse(data);
    } catch (err: any) {
      console.error(`API 调用失败 (${endpoint.name}):`, err);
      setError(err.message || '未知错误');
    } finally {
      setLoading(null);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API 接口测试</h1>
        <p className="mt-2 text-sm text-gray-600">
          测试和查看各种 API 接口的响应数据
        </p>
      </div>

      {/* API 端点列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apiEndpoints.map((endpoint) => {
          const Icon = endpoint.icon;
          const isLoading = loading === endpoint.name;
          
          return (
            <div key={endpoint.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${endpoint.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{endpoint.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{endpoint.description}</p>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-md p-3">
                  <code className="text-sm text-gray-700 font-mono">{endpoint.path}</code>
                </div>
                
                <button
                  onClick={() => handleApiCall(endpoint)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>请求中...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>测试接口</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 响应展示区域 */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">正在请求 API...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-medium">请求失败</h3>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {response && !loading && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">请求成功</span>
          </div>
          
          <ApiResponseViewer 
            data={response} 
            title="API 响应数据"
            showRaw={false}
          />
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">使用说明</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• 点击任意 API 端点的"测试接口"按钮来发送请求</p>
          <p>• 响应数据会以格式化的方式展示，支持展开/折叠</p>
          <p>• 可以切换原始 JSON 视图和格式化视图</p>
          <p>• 支持复制完整的 JSON 响应数据</p>
          <p>• 所有请求都会显示加载状态和错误处理</p>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
