import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Table, Input, Button, Space, Spin } from "antd";
import { Search, Eye, MessageSquare } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useAppStore } from "../store";
import { sessionsAPI } from "../services/api";
import { Session } from "../types";

const Sessions: React.FC = () => {
  const { sessions, setSessions, loading, setLoading } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading("sessions", true);
      const data: any = await sessionsAPI.getSessions();

      // 处理嵌套的数据结构
      let sessionsArray: Session[] = [];
      if (data && typeof data === "object") {
        if (data.data && Array.isArray(data.data)) {
          // 直接结构：{ data: [...], total: 1, page: 1, size: 20, total_pages: 1 }
          sessionsArray = data.data;
        } else if (
          data.data &&
          typeof data.data === "object" &&
          "data" in data.data
        ) {
          // 嵌套结构：{ data: { data: [...], total: 1, page: 1, size: 20, total_pages: 1 } }
          sessionsArray = data.data.data || [];
        } else if (Array.isArray(data)) {
          // 数组结构：直接是数据数组
          sessionsArray = data;
        }
      }

      if (Array.isArray(sessionsArray)) {
        setSessions(sessionsArray);
      } else {
        console.error("API 返回的数据格式不正确:", data);
        setSessions([]);
      }
    } catch (error) {
      console.error("获取会话列表失败:", error);
      setSessions([]);
    } finally {
      setLoading("sessions", false);
    }
  }, [setLoading, setSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    // 确保 sessions 是数组，然后进行过滤
    if (Array.isArray(sessions)) {
      const filtered = sessions.filter(
        (session) =>
          session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) // 转换为字符串进行搜索
      );
      setFilteredSessions(filtered);
    } else {
      // 如果 sessions 不是数组，设置为空数组
      console.warn("sessions 不是数组:", sessions);
      setFilteredSessions([]);
    }
  }, [sessions, searchTerm]);

  // 定义表格列
  const columns: ColumnsType<Session> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "会话名称",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Link
            to={`/sessions/${record.id}`}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" /> 查看详情
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">会话管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          管理生产环境中的对话会话和调用记录
        </p>
      </div>

      {/* 搜索框 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <Input
              prefix={<Search className="h-5 w-5 text-gray-400" />}
              placeholder="搜索会话名称或ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              共 {filteredSessions.length} 个会话
            </span>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Spin spinning={loading.sessions}>
          <Table
            bordered
            columns={columns}
            dataSource={filteredSessions}
            rowKey="id"
            pagination={{
              total: filteredSessions.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
            }}
            locale={{
              emptyText: (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm ? "没有找到匹配的会话" : "暂无会话数据"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "尝试调整搜索条件"
                      : "当有API调用时，会自动创建会话记录"}
                  </p>
                </div>
              ),
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        </Spin>
      </div>
    </div>
  );
};

export default Sessions;
