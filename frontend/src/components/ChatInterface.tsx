import React, { useRef, useEffect } from "react";
import { Send, Bot, User, Settings, Loader2 } from "lucide-react";
import { ChatMessage } from "../types";
import Button from "./ui/Button";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  selectedModel: string;
  modelConfig: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  currentInput,
  onInputChange,
  onSendMessage,
  isSending, 
  selectedModel,
  modelConfig,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // 简单的换行处理
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[1100px] flex flex-col">
      {/* 对话头部 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">调试对话</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Bot className="w-4 h-4" />
              <span>{selectedModel}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Settings className="w-4 h-4" />
              <span>温度: {modelConfig.temperature}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">开始您的调试对话</p>
              <p className="text-sm text-gray-400 mt-1">
                输入消息来测试模型响应
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : message.role === "assistant"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-yellow-100 text-yellow-900"
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : message.role === "assistant" ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {message.role === "user"
                      ? "用户"
                      : message.role === "assistant"
                      ? "AI助手"
                      : "系统"}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {formatMessageContent(message.content)}
                </div>
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={currentInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的消息... (Shift+Enter 换行，Enter 发送)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              disabled={isSending}
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
          </div>
          <Button
            onClick={onSendMessage}
            disabled={!currentInput.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 self-end"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 输入提示 */}
        <div className="mt-2 text-xs text-gray-500">
          <span>按 Enter 发送，Shift+Enter 换行</span>
          <span className="ml-4">当前消息长度: {currentInput.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
