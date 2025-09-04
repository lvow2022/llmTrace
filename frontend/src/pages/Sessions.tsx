import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Table, Input, Button, Space, Typography } from "antd";
import { Search, Eye } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useAppStore } from "../store";
import { sessionsAPI } from "../services/api";
import { Session } from "../types";

const { Title, Text } = Typography;

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
          <Link to={`/sessions/${record.id}`}>
            <Button type="link" icon={<Eye size={16} />} size="small">
              查看详情
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>会话管理</Title>
        <Text type="secondary">管理生产环境中的对话会话和调用记录</Text>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: "16px" }}>
        <Input.Search
          placeholder="搜索会话名称或ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<Search size={16} />}
          style={{ maxWidth: "400px" }}
          allowClear
        />
        <Text type="secondary" style={{ marginLeft: "16px" }}>
          共 {filteredSessions.length} 个会话
        </Text>
      </div>

      {/* 数据表格 */}
      <Table
        bordered
        columns={columns}
        dataSource={filteredSessions}
        rowKey="id"
        loading={loading.sessions}
        pagination={{
          total: filteredSessions.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
        }}
        locale={{
          emptyText: searchTerm ? "没有找到匹配的会话" : "暂无会话数据",
        }}
        scroll={{ x: 800 }}
        size="middle"
      />
    </div>
  );
};

export default Sessions;
