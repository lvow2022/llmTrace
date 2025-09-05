import React, { useMemo } from "react";
import { Settings, Zap, Hash, Target } from "lucide-react";
import { ModelConfig } from "../types";

interface ModelConfigPanelProps {
  config: ModelConfig;
  onConfigChange: (config: ModelConfig) => void;
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  availableProviders: any[];
}

const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({
  config,
  onConfigChange,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  availableProviders,
}) => {
  const updateConfig = (key: keyof ModelConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const modelOptions = useMemo(() => {
    const providerData = availableProviders.find(
      (p) => p.name === selectedProvider
    );
    return providerData?.models || [];
  }, [selectedProvider, availableProviders]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">模型配置</h3>
        <Settings className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {/* 提供商选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            提供商
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Array.isArray(availableProviders) ? availableProviders : []).map(
              (provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* 模型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {modelOptions.map((model: any) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* 温度参数 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              温度
            </label>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {config.temperature}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) =>
              updateConfig("temperature", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>保守 (0.0)</span>
            <span>平衡 (1.0)</span>
            <span>创新 (2.0)</span>
          </div>
        </div>

        {/* 最大Token数 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Hash className="w-4 h-4 mr-1" />
              最大Token数
            </label>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {config.max_tokens}
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="4096"
            value={config.max_tokens}
            onChange={(e) =>
              updateConfig("max_tokens", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Top-p参数 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Top-p
            </label>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {config.top_p}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.top_p}
            onChange={(e) => updateConfig("top_p", parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>聚焦 (0.0)</span>
            <span>平衡 (0.5)</span>
            <span>多样 (1.0)</span>
          </div>
        </div>

        {/* 流式响应 */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">流式响应</label>
          <input
            type="checkbox"
            checked={config.stream}
            onChange={(e) => updateConfig("stream", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* 配置摘要 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">当前配置</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div>提供商: {selectedProvider}</div>
            <div>模型: {selectedModel}</div>
            <div>
              温度: {config.temperature} | Top-p: {config.top_p}
            </div>
            <div>
              最大Token: {config.max_tokens} | 流式:{" "}
              {config.stream ? "是" : "否"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelConfigPanel;
