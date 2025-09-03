import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface ApiResponseViewerProps {
  data: any;
  title?: string;
  showRaw?: boolean;
}

const ApiResponseViewer: React.FC<ApiResponseViewerProps> = ({ 
  data, 
  title = "API 响应数据", 
  showRaw = false 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState(showRaw);
  const [copied, setCopied] = useState(false);

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const renderPaginatedData = () => {
    if (!data || typeof data !== 'object') return null;
    
    // 处理嵌套的数据结构
    let items, total, page, size, total_pages;
    
    if (data.data && typeof data.data === 'object' && 'data' in data.data) {
      // 嵌套结构：{ data: { data: [...], total: 1, page: 1, size: 20, total_pages: 1 } }
      const innerData = data.data;
      items = innerData.data;
      total = innerData.total;
      page = innerData.page;
      size = innerData.size;
      total_pages = innerData.total_pages;
    } else if (data.data && Array.isArray(data.data)) {
      // 直接结构：{ data: [...], total: 1, page: 1, size: 20, total_pages: 1 }
      items = data.data;
      total = data.total;
      page = data.page;
      size = data.size;
      total_pages = data.total_pages;
    } else if (Array.isArray(data)) {
      // 数组结构：直接是数据数组
      items = data;
      total = data.length;
      page = 1;
      size = data.length;
      total_pages = 1;
    } else {
      return null;
    }
    
    if (!Array.isArray(items)) return null;
    
    return (
      <div className="space-y-4">
        {/* 分页信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  总数据量: {total}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  第 {page} 页，每页 {size} 条
                </span>
              </div>
            </div>
            <div className="text-sm text-blue-600">
              共 {total_pages} 页
            </div>
          </div>
        </div>
        
        {/* 数据列表 */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.name || `会话 ${item.id}`}
                      </h4>
                      <p className="text-sm text-gray-500">ID: {item.id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>创建时间: {new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    {item.updated_at && (
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>更新时间: {new Date(item.updated_at).toLocaleString()}</span>
                      </div>
                    )}
                    {item.status && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span>状态: {item.status}</span>
                      </div>
                    )}
                    {item.trace_id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Trace ID: {item.trace_id.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => toggleSection(`item-${index}`)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  {expandedSections.has(`item-${index}`) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* 展开的详细信息 */}
              {expandedSections.has(`item-${index}`) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showRawData ? '隐藏原始数据' : '显示原始数据'}</span>
            </button>
            
            <button
              onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制' : '复制 JSON'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 内容 */}
      <div className="p-6">
        {showRawData ? (
          /* 原始数据视图 */
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">原始 JSON 数据:</h4>
              <pre className="text-sm text-gray-800 overflow-x-auto bg-white p-3 rounded border">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          /* 格式化视图 */
          <div className="space-y-4">
            {renderPaginatedData() || (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>暂无数据或数据格式不正确</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiResponseViewer;
