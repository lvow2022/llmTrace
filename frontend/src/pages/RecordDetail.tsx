import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Bug, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAppStore } from "../store";
import { getRecord } from "../services/api";
import { Record } from "../types";
import DebugModal from "../components/DebugModal";
import Button from "../components/ui/Button";
import JsonViewer from "../components/JsonViewer";
import LLMRequestViewer from "../components/LLMRequestViewer";

const RecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentRecord } = useAppStore();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showDebugModal, setShowDebugModal] = useState(false);

  const fetchRecord = useCallback(
    async (recordId: number) => {
      try {
        setLoading(true);
        setError("");
        const response = await getRecord(recordId);

        // 处理API响应的嵌套结构
        let recordData: Record;
        if (response && typeof response === "object") {
          if ("data" in response && response.data) {
            recordData = response.data as Record;
          } else {
            recordData = response as Record;
          }
        } else {
          throw new Error("Invalid response format");
        }

        setRecord(recordData);
        setCurrentRecord(recordData);
      } catch (err) {
        console.error("获取记录详情失败:", err);
        setError("获取记录详情失败");
      } finally {
        setLoading(false);
      }
    },
    [setCurrentRecord]
  );

  useEffect(() => {
    if (id) {
      fetchRecord(parseInt(id)); // 将字符串ID转换为数字
    }
  }, [id, fetchRecord]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载记录详情中...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
        <p className="mt-1 text-sm text-gray-500">{error || "记录不存在"}</p>
        <div className="mt-6">
          <Link
            to="/sessions"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            返回会话列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link to="/sessions" className="hover:text-gray-700">
          会话管理
        </Link>
        <span>/</span>
        <Link
          to={`/sessions/${record.session_id}`}
          className="hover:text-gray-700"
        >
          会话 {record.session_id}
        </Link>
        <span>/</span>
        <span className="text-gray-900">记录详情</span>
      </nav>

      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={`/sessions/${record.session_id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">记录详情</h1>
            <div className="text-sm text-gray-600">
              <Link
                to={`/sessions/${record.session_id}`}
                className="hover:text-gray-700"
              >
                会话 {record.session_id}
              </Link>
              {" - "}
              <span>轮次 {record.turn_number}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowDebugModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          <Bug className="w-4 h-4 mr-2" />
          开始调试
        </Button>
      </div>

      {/* 记录基本信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(record.status)}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  record.status
                )}`}
              >
                {record.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              会话 {record.session_id} · 轮次 #{record.turn_number}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(record.created_at).toLocaleString("zh-CN", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            {record.error_msg && (
              <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                {record.error_msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 请求和响应内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 请求内容 */}
        <LLMRequestViewer
          data={record.request}
          title="LLM 请求"
          defaultExpanded={true}
        />

        {/* 响应内容 */}
        {record.response ? (
          <JsonViewer
            data={record.response}
            title="响应内容"
            defaultExpanded={true}
            showSearchButton={true}
            showCopyButton={true}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">响应内容</h3>
            <div className="text-sm text-gray-500 bg-gray-50 p-8 rounded border text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p>暂无响应内容</p>
                <p className="text-xs text-gray-400">
                  可能请求还在处理中或发生了错误
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 元数据 */}
      {record.metadata && (
        <JsonViewer
          data={record.metadata}
          title="元数据"
          defaultExpanded={false}
          showSearchButton={true}
          showCopyButton={true}
        />
      )}

      {/* Debug 弹窗 */}
      <DebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        record={record}
      />
    </div>
  );
};

export default RecordDetail;
