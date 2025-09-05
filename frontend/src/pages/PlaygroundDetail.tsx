import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, Play, Pause, Code } from "lucide-react";
import { useAppStore } from "../store";
import {
  getPlayground,
  getProviders,
  getDebugSession,
  debug,
} from "../services/api";
import {
  Playground,
  ChatMessage,
  ModelConfig,
  PlaygroundDebugRequest,
  DebugSession,
} from "../types";
import Button from "../components/ui/Button";
import ModelConfigPanel from "../components/ModelConfigPanel";
import ChatInterface from "../components/ChatInterface";
import ContextEditor from "../components/ContextEditor";

const PlaygroundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentPlayground } = useAppStore();

  const [playground, setPlayground] = useState<Playground | null>(null);
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // 调试状态
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugSessionId, setDebugSessionId] = useState<number | null>(null);

  // 模型配置
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1.0,
    stream: false,
  });

  // 提供商和模型选择
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);

  // 对话状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // 上下文编辑
  const [, setContextMessages] = useState<ChatMessage[]>([]);

  // 调试数据
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebugData, setShowDebugData] = useState(false);

  // 获取 playground 详情
  const fetchPlayground = useCallback(
    async (playgroundId: number) => {
      try {
        setLoading(true);
        setError("");
        console.log("开始获取 playground 详情，ID:", playgroundId);
        const response = await getPlayground(playgroundId);
        console.log("API 响应:", response);

        // 检查响应数据结构
        if (response && response.playground) {
          setPlayground(response.playground);
          setSessions(response.sessions || []);
          setCurrentPlayground(response.playground);
          console.log("成功设置 playground 和 sessions");
        } else {
          console.error("响应数据格式不正确:", response);
          setError("响应数据格式不正确");
        }
      } catch (err) {
        console.error("获取 playground 详情失败:", err);
        setError("获取 playground 详情失败: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [setCurrentPlayground]
  );

  // 获取可用的提供商
  const fetchProviders = useCallback(async () => {
    try {
      const data = await getProviders();
      console.log("获取到的提供商数据:", data);
      // 确保 data 是数组格式
      if (Array.isArray(data)) {
        setAvailableProviders(data);
      } else {
        console.warn("提供商数据不是数组格式:", data);
        setAvailableProviders([]);
      }
    } catch (err) {
      console.error("获取提供商列表失败:", err);
      // 设置默认的提供商列表
      setAvailableProviders([]);
    }
  }, []);

  useEffect(() => {
    if (availableProviders && availableProviders.length > 0) {
      const firstProvider = availableProviders[0];
      setSelectedProvider(firstProvider.name);
      if (firstProvider.models && firstProvider.models.length > 0) {
        setSelectedModel(firstProvider.models[0]);
      }
    }
  }, [availableProviders]);

  // 初始化调试会话
  const initializeDebugSession = useCallback(async () => {
    if (!playground) return;

    try {
      // 这里应该调用创建调试会话的API
      // const session = await playgroundsAPI.createDebugSession(playground.id, ...);
      // setDebugSessionId(session.id);

      // 临时设置一个调试会话ID
      setDebugSessionId(1);
      setIsDebugging(true);

      // 初始化消息历史
      setMessages([
        { role: "system", content: "你是一个有用的AI助手。" },
        { role: "user", content: "你好，请开始我们的对话。" },
      ]);
    } catch (err) {
      console.error("初始化调试会话失败:", err);
    }
  }, [playground]);

  // 发送消息
  const sendMessage = async () => {
    if (!currentInput.trim() || isSending || !playground || !debugSessionId)
      return;

    const userMessage: ChatMessage = {
      role: "user",
      content: currentInput.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentInput("");
    setIsSending(true);

    try {
      // 构造调试请求
      const debugRequest: PlaygroundDebugRequest = {
        turn_number: newMessages.length, // turn_number should be based on the new messages length
        context: messages, // context should be the messages before adding the new user message
        user_input: userMessage.content,
        provider: selectedProvider,
        model: selectedModel,
        config: modelConfig,
      };

      // 保存调试数据用于显示
      setDebugData({
        request: debugRequest,
        timestamp: new Date().toISOString(),
        playground_id: playground.id,
        session_id: debugSessionId,
      });

      // 调用调试API
      const response = await debug(playground.id, debugSessionId, debugRequest);

      // 模拟响应
      if (
        response &&
        response.choices &&
        response.choices.length > 0 &&
        response.choices[0].message
      ) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content:
            response.choices[0].message.content ||
            "抱歉，我无法生成有效的回复。",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("API响应格式不正确或为空");
      }
    } catch (err) {
      console.error("发送消息失败:", err);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `发送消息失败: ${
          (err as Error).message || "未知错误"
        }. 请检查控制台获取更多信息。`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // 重置对话
  const resetConversation = () => {
    setMessages([{ role: "system", content: "你是一个有用的AI助手。" }]);
  };

  // 保存上下文
  const saveContext = () => {
    setContextMessages([...messages]);
  };

  // 开始调试会话
  const startDebugSession = async (sessionId: number) => {
    if (!playground) return;

    try {
      console.log("开始调试会话:", sessionId);
      // 调用 API 获取调试会话详情
      const debugSessionData = await getDebugSession(playground.id, sessionId);
      console.log("调试会话数据:", debugSessionData);
      console.log("调试会话数据类型:", typeof debugSessionData);
      console.log("调试会话数据键:", Object.keys(debugSessionData || {}));

      // 设置调试会话ID并进入调试模式
      setDebugSessionId(sessionId);
      setIsDebugging(true);

      // 如果有历史记录，初始化消息上下文
      if (
        debugSessionData &&
        debugSessionData.records &&
        Array.isArray(debugSessionData.records)
      ) {
        console.log("调试会话记录:", debugSessionData.records);

        // 将历史记录转换为消息格式
        const historyMessages: ChatMessage[] = [];

        // 处理历史记录，按轮次排序
        const sortedRecords = debugSessionData.records.sort(
          (a: any, b: any) => a.turn_number - b.turn_number
        );

        sortedRecords.forEach((record: any) => {
          try {
            // 解析请求数据 - record.request 是双重编码的 JSON 字符串
            if (record.request) {
              console.log("原始请求数据:", record.request);

              // 第一次解析：从字符串中提取 JSON
              const firstParse = JSON.parse(record.request);
              console.log("第一次解析结果:", firstParse);

              // 第二次解析：解析实际的请求数据
              const requestData = JSON.parse(firstParse);
              console.log("最终请求数据:", requestData);

              // 检查是否是标准的 ChatCompletion 请求格式
              if (requestData.messages && Array.isArray(requestData.messages)) {
                // 添加请求中的消息
                requestData.messages.forEach((msg: any) => {
                  if (
                    msg.role === "system" ||
                    msg.role === "user" ||
                    msg.role === "assistant"
                  ) {
                    historyMessages.push({
                      role: msg.role,
                      content: msg.content,
                    });
                  }
                });
              }
            }

            // 解析响应数据 - record.response 是双重编码的 JSON 字符串
            if (record.response) {
              try {
                console.log("原始响应数据:", record.response);

                // 第一次解析：从字符串中提取 JSON
                const firstParse = JSON.parse(record.response);
                console.log("第一次解析结果:", firstParse);

                // 第二次解析：解析实际的响应数据
                const responseData = JSON.parse(firstParse);
                console.log("最终响应数据:", responseData);

                // 检查是否是标准的 ChatCompletion 响应格式
                if (
                  responseData.choices &&
                  responseData.choices[0] &&
                  responseData.choices[0].message
                ) {
                  historyMessages.push({
                    role: "assistant",
                    content: responseData.choices[0].message.content,
                  });
                }
              } catch (e) {
                console.warn(
                  "解析响应数据失败:",
                  e,
                  "原始数据:",
                  record.response
                );
              }
            }
          } catch (e) {
            console.warn("解析记录数据失败:", e, "原始数据:", record);
          }
        });

        // 如果没有解析到任何消息，设置默认的系统消息
        if (historyMessages.length === 0) {
          historyMessages.push({
            role: "system",
            content: "你是一个有用的AI助手。",
          });
        }

        // 设置消息历史
        setMessages(historyMessages);
        console.log("初始化消息历史:", historyMessages);
      } else {
        // 如果没有历史记录，设置默认的系统消息
        setMessages([{ role: "system", content: "你是一个有用的AI助手。" }]);
        console.log("没有历史记录，使用默认系统消息");
      }
    } catch (err) {
      console.error("启动调试会话失败:", err);
      setError("启动调试会话失败: " + (err as Error).message);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPlayground(parseInt(id));
    }
    fetchProviders();
  }, [id, fetchPlayground, fetchProviders]);

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    const provider = availableProviders.find((p) => p.name === providerName);
    if (provider && provider.models && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载调试环境详情中...</p>
      </div>
    );
  }

  if (error || !playground) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error || "调试环境不存在"}
        </p>
        <div className="mt-6">
          <Link
            to="/playgrounds"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            返回调试环境列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/playgrounds"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">调试环境详情</h1>
            <p className="mt-1 text-sm text-gray-600">
              {playground.name} - {playground.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isDebugging && debugData && (
            <Button
              onClick={() => setShowDebugData(!showDebugData)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              <Code className="w-4 h-4 mr-2" />
              {showDebugData ? "隐藏" : "查看"}调试数据
            </Button>
          )}

          {!isDebugging ? (
            <Link
              to="/sessions"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md inline-flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              转到会话管理
            </Link>
          ) : (
            <Button
              onClick={() => setIsDebugging(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
            >
              <Pause className="w-4 h-4 mr-2" />
              停止调试
            </Button>
          )}
        </div>
      </div>

      {/* Sessions 列表展示 */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">调试会话列表</h3>
            <span className="text-sm text-gray-500">
              共 {sessions.length} 个会话
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  // TODO: 跳转到会话详情页面
                  console.log("点击会话:", session.id);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {session.name}
                  </h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      session.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {session.status === "active" ? "活跃" : "已完成"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>原始会话ID: {session.original_session_id}</div>
                  <div>原始记录ID: {session.original_record_id}</div>
                  <div>
                    创建时间: {new Date(session.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    最后更新:{" "}
                    {new Date(session.updated_at).toLocaleDateString()}
                  </span>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startDebugSession(session.id);
                    }}
                  >
                    开始调试
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDebugging ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：模型配置和上下文 */}
          <div className="space-y-6 lg:col-span-2">
            {/* 模型配置 */}
            <ModelConfigPanel
              config={modelConfig}
              onConfigChange={setModelConfig}
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={handleProviderChange}
              onModelChange={setSelectedModel}
              availableProviders={availableProviders}
            />

            {/* 上下文管理 */}
            <ContextEditor
              messages={messages}
              onMessagesChange={setMessages}
              onSave={saveContext}
              onReset={resetConversation}
            />
          </div>

          {/* 右侧：对话界面 */}
          <div className="lg:col-span-3">
            <ChatInterface
              messages={messages}
              currentInput={currentInput}
              onInputChange={setCurrentInput}
              onSendMessage={sendMessage}
              isSending={isSending}
              selectedModel={selectedModel}
              modelConfig={modelConfig}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PlaygroundDetail;
