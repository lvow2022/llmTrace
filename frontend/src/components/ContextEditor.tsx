import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Trash2,
  User,
  Bot,
  Settings,
  MessageSquare,
} from "lucide-react";
import { ChatMessage } from "../types";
import Button from "./ui/Button";

interface ContextEditorProps {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onSave: () => void;
  onReset: () => void;
}

const ContextEditor: React.FC<ContextEditorProps> = ({
  messages,
  onMessagesChange,
  onSave,
  onReset,
}) => {
  const [showEditor, setShowEditor] = useState(false);

  const addMessage = (role: "user" | "assistant" | "system") => {
    const newMessage: ChatMessage = {
      role,
      content: "",
    };
    onMessagesChange([...messages, newMessage]);
  };

  const updateMessage = (index: number, content: string) => {
    const newMessages = [...messages];
    newMessages[index].content = content;
    onMessagesChange(newMessages);
  };

  const updateMessageRole = (
    index: number,
    role: "user" | "assistant" | "system"
  ) => {
    const newMessages = [...messages];
    newMessages[index].role = role;
    onMessagesChange(newMessages);
  };

  const removeMessage = (index: number) => {
    const newMessages = messages.filter((_, i) => i !== index);
    onMessagesChange(newMessages);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "user":
        return <User className="w-4 h-4" />;
      case "assistant":
        return <Bot className="w-4 h-4" />;
      case "system":
        return <Settings className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "user":
        return "bg-blue-100 text-blue-800";
      case "assistant":
        return "bg-green-100 text-green-800";
      case "system":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[810px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">对话上下文</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title={showEditor ? "隐藏编辑器" : "显示编辑器"}
          >
            {showEditor ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onReset}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="重置对话"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showEditor ? (
        <div className="space-y-4">
          {/* 添加消息按钮 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">添加消息:</span>
            <Button
              onClick={() => addMessage("user")}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm"
            >
              <User className="w-3 h-3 mr-1" />
              用户
            </Button>
            <Button
              onClick={() => addMessage("assistant")}
              className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 text-sm"
            >
              <Bot className="w-3 h-3 mr-1" />
              AI助手
            </Button>
            <Button
              onClick={() => addMessage("system")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 text-sm"
            >
              <Settings className="w-3 h-3 mr-1" />
              系统
            </Button>
          </div>

          {/* 消息列表 */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <select
                      value={message.role}
                      onChange={(e) =>
                        updateMessageRole(index, e.target.value as any)
                      }
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="user">用户</option>
                      <option value="assistant">AI助手</option>
                      <option value="system">系统</option>
                    </select>
                    <span
                      className={`px-2 py-1 text-xs rounded ${getRoleColor(
                        message.role
                      )}`}
                    >
                      {message.role}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMessage(index)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="删除消息"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <textarea
                  value={message.content}
                  onChange={(e) => updateMessage(index, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="输入消息内容..."
                />
              </div>
            ))}
          </div>

          {/* 保存按钮 */}
          <Button
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            保存上下文
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 上下文摘要 */}
          <div className="text-sm text-gray-600">
            <p>
              当前对话轮次:{" "}
              <span className="font-medium">{messages.length}</span>
            </p>
            <p>
              最后消息:{" "}
              <span className="font-medium">
                {messages[messages.length - 1]?.content.substring(0, 50)}...
              </span>
            </p>
          </div>

          {/* 消息预览 */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.slice(-3).map((message, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 p-2 bg-gray-50 rounded"
              >
                <div className={`p-1 rounded ${getRoleColor(message.role)}`}>
                  {getRoleIcon(message.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">
                    {message.role === "user"
                      ? "用户"
                      : message.role === "assistant"
                      ? "AI助手"
                      : "系统"}
                  </div>
                  <div className="text-sm text-gray-700 truncate">
                    {message.content || "(空消息)"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {messages.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              显示最近 3 条消息，共 {messages.length} 条
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextEditor;
