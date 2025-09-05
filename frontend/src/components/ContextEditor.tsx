import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  User,
  Bot,
  Settings,
  MessageSquare,
} from "lucide-react";
import { ChatMessage } from "../types";
import Button from "./ui/Button";
import JsonViewer from "./JsonViewer";

interface ContextEditorProps {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onReset: () => void;
}

const ContextEditor: React.FC<ContextEditorProps> = ({
  messages,
  onMessagesChange,
  onReset,
}) => {
  const [showJson, setShowJson] = useState(true);

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[840px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">对话上下文</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title={showJson ? "编辑上下文" : "查看 JSON"}
          >
            {showJson ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
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

      {showJson ? (
        <JsonViewer
          data={JSON.stringify(messages, null, 2)}
          title="上下文 JSON"
          showSearchButton={false}
        />
      ) : (
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
          <div className="space-y-3 h-full overflow-y-auto">
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
                  rows={5}
                  placeholder="输入消息内容..."
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextEditor;
