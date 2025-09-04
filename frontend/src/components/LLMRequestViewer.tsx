import React, { useState, useMemo } from "react";
import {
  Copy,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
  Settings,
} from "lucide-react";

interface LLMRequestViewerProps {
  data: string;
  className?: string;
  title?: string;
  defaultExpanded?: boolean;
}

const LLMRequestViewer: React.FC<LLMRequestViewerProps> = ({
  data,
  className = "",
  title = "LLM 请求",
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }, [data]);

  const extractLLMInfo = (data: any) => {
    if (!data || typeof data !== "object") return null;

    const info: any = {};

    // 提取模型信息
    if (data.model) {
      info.model = data.model;
    }

    // 提取消息信息
    if (data.messages && Array.isArray(data.messages)) {
      info.messageCount = data.messages.length;
      info.lastMessage = data.messages[data.messages.length - 1];
    }

    // 提取参数信息
    if (data.temperature !== undefined) info.temperature = data.temperature;
    if (data.max_tokens !== undefined) info.maxTokens = data.max_tokens;
    if (data.top_p !== undefined) info.topP = data.top_p;
    if (data.stream !== undefined) info.stream = data.stream;

    return info;
  };

  const llmInfo = useMemo(() => extractLLMInfo(parsedData), [parsedData]);

  const formatJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  const highlightJSON = (jsonString: string, searchTerm: string = "") => {
    const formatted = formatJSON(jsonString);

    let highlighted = formatted;

    // 只有在有搜索词时才高亮搜索词
    if (searchTerm.trim()) {
      highlighted = highlighted.replace(
        new RegExp(
          `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi"
        ),
        '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
      );
    }

    // 高亮重要字段
    highlighted = highlighted.replace(
      /"model":/g,
      '<span class="text-blue-600 font-bold">"model":</span>'
    );
    highlighted = highlighted.replace(
      /"messages":/g,
      '<span class="text-green-600 font-bold">"messages":</span>'
    );
    highlighted = highlighted.replace(
      /"temperature":/g,
      '<span class="text-purple-600 font-bold">"temperature":</span>'
    );
    highlighted = highlighted.replace(
      /"max_tokens":/g,
      '<span class="text-purple-600 font-bold">"max_tokens":</span>'
    );
    highlighted = highlighted.replace(
      /"top_p":/g,
      '<span class="text-purple-600 font-bold">"top_p":</span>'
    );
    highlighted = highlighted.replace(
      /"stream":/g,
      '<span class="text-purple-600 font-bold">"stream":</span>'
    );

    // 高亮键名
    highlighted = highlighted.replace(
      /"([^"]+)":/g,
      '<span class="text-blue-600 font-medium">"$1":</span>'
    );

    // 高亮字符串值
    highlighted = highlighted.replace(
      /:\s*"([^"]*)"/g,
      ': <span class="text-green-600">"$1"</span>'
    );

    // 高亮数字
    highlighted = highlighted.replace(
      /:\s*(\d+\.?\d*)/g,
      ': <span class="text-purple-600">$1</span>'
    );

    // 高亮布尔值和null
    highlighted = highlighted.replace(
      /:\s*(true|false|null)/g,
      ': <span class="text-orange-600">$1</span>'
    );

    // 高亮标点符号
    highlighted = highlighted.replace(
      /([{}[\],])/g,
      '<span class="text-gray-500">$1</span>'
    );

    return highlighted;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const getDataSize = () => {
    const size = new Blob([data]).size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPreview = () => {
    if (!llmInfo) return "Invalid JSON";

    const parts = [];
    if (llmInfo.model) parts.push(`模型: ${llmInfo.model}`);
    if (llmInfo.messageCount) parts.push(`消息数: ${llmInfo.messageCount}`);
    if (llmInfo.temperature !== undefined)
      parts.push(`温度: ${llmInfo.temperature}`);
    if (llmInfo.maxTokens) parts.push(`最大Token: ${llmInfo.maxTokens}`);

    return parts.length > 0 ? parts.join(" | ") : "LLM 请求数据";
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
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            </div>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {getDataSize()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isExpanded && (
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

            <button
              onClick={copyToClipboard}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="复制到剪贴板"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isExpanded && (
          <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
            {getPreview()}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="p-4">
          {/* LLM 信息摘要 */}
          {llmInfo && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">请求摘要</h4>
              </div>
              <div className="grid grid-cols-2 w-full md:grid-cols-2 gap-3 text-xs">
                {llmInfo.model && (
                  <div>
                    <span className="text-blue-600 font-medium max-w-min">
                      模型:
                    </span>
                    <span className="ml-1 text-blue-900">{llmInfo.model}</span>
                  </div>
                )}
                {llmInfo.messageCount && (
                  <div>
                    <span className="text-blue-600 font-medium">消息数:</span>
                    <span className="ml-1 text-blue-900">
                      {llmInfo.messageCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <pre
              className="text-sm text-gray-900 bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap font-mono"
              dangerouslySetInnerHTML={{
                __html: highlightJSON(data, searchTerm),
              }}
            />

            {copied && (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                已复制
              </div>
            )}
          </div>

          {/* 数据统计 */}
          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
            <span>行数: {formatJSON(data).split("\n").length}</span>
            <span>字符数: {data.length}</span>
            {parsedData && typeof parsedData === "object" && (
              <span>属性数: {Object.keys(parsedData).length}</span>
            )}
            {llmInfo && llmInfo.messageCount && (
              <span>对话轮次: {llmInfo.messageCount}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMRequestViewer;
