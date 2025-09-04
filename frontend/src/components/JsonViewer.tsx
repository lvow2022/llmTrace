import React, { useState, useMemo } from 'react';
import { Copy, ChevronDown, ChevronRight, Search } from 'lucide-react';

interface JsonViewerProps {
  data: string;
  className?: string;
  title?: string;
  showCopyButton?: boolean;
  showSearchButton?: boolean;
  defaultExpanded?: boolean;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  className = '', 
  title,
  showCopyButton = true,
  showSearchButton = true,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }, [data]);

  const formatJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  const highlightJSON = (jsonString: string, searchTerm: string = '') => {
    const formatted = formatJSON(jsonString);
    
    let highlighted = formatted;
    
    // 只有在有搜索词时才高亮搜索词
    if (searchTerm.trim()) {
      highlighted = highlighted.replace(
        new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), 
        '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
      );
    }
    
    // 高亮键名
    highlighted = highlighted.replace(/"([^"]+)":/g, '<span class="text-blue-600 font-medium">"$1":</span>');
    
    // 高亮字符串值
    highlighted = highlighted.replace(/:\s*"([^"]*)"/g, ': <span class="text-green-600">"$1"</span>');
    
    // 高亮数字
    highlighted = highlighted.replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-purple-600">$1</span>');
    
    // 高亮布尔值和null
    highlighted = highlighted.replace(/:\s*(true|false|null)/g, ': <span class="text-orange-600">$1</span>');
    
    // 高亮标点符号
    highlighted = highlighted.replace(/([{}[\],])/g, '<span class="text-gray-500">$1</span>');
    
    return highlighted;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const getDataSize = () => {
    const size = new Blob([data]).size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDataPreview = () => {
    if (!parsedData) return 'Invalid JSON';
    
    if (typeof parsedData === 'object' && parsedData !== null) {
      const keys = Object.keys(parsedData);
      if (keys.length === 0) return 'Empty object';
      return `Object with ${keys.length} properties: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`;
    }
    
    return String(parsedData).substring(0, 100) + (String(parsedData).length > 100 ? '...' : '');
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {title && (
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            )}
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {getDataSize()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {showSearchButton && isExpanded && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {showCopyButton && (
              <button
                onClick={copyToClipboard}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title="复制到剪贴板"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
            {getDataPreview()}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="p-4">
          <div className="relative">
            <pre 
              className="text-sm text-gray-900 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap font-mono"
              dangerouslySetInnerHTML={{ __html: highlightJSON(data, searchTerm) }}
            />
            
            {copied && (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                已复制
              </div>
            )}
          </div>
          
          {/* 数据统计 */}
          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
            <span>行数: {formatJSON(data).split('\n').length}</span>
            <span>字符数: {data.length}</span>
            {parsedData && typeof parsedData === 'object' && (
              <span>属性数: {Object.keys(parsedData).length}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;
