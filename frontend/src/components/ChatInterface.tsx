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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentInput]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const MessageIcon = ({ role }: { role: string }) => {
    switch (role) {
      case "user":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
            <User size={18} />
          </div>
        );
      case "assistant":
        return (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white flex-shrink-0">
            <Bot size={18} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[1400px] flex flex-col">
      {/* 对话头部 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">调试对话</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1.5">
              <Bot className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{selectedModel}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Settings className="w-4 h-4 text-gray-400" />
              <span>温度: {modelConfig.temperature}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Bot size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="font-medium">开始您的调试对话</p>
              <p className="text-sm text-gray-400 mt-1">
                输入消息来测试模型响应
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            if (message.role === "system") {
              return (
                <div key={index} className="text-center my-4">
                  <p className="text-xs text-gray-400 bg-gray-100  px-3 py-1 inline-block">
                    {message.content}
                  </p>
                </div>
              );
            }
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <MessageIcon role="assistant" />
                )}
                <div
                  className={`max-w-[70%] p-3 px-4 rounded-xl shadow-sm ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                {message.role === "user" && <MessageIcon role="user" />}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start gap-3 justify-start">
            <MessageIcon role="assistant" />
            <div className="bg-gray-100 p-3 px-4 rounded-xl shadow-sm flex items-center">
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/70">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的消息..."
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow duration-200"
            rows={2}
            disabled={isSending}
            style={{ maxHeight: "150px" }}
          />
          <Button
            onClick={onSendMessage}
            disabled={!currentInput.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
