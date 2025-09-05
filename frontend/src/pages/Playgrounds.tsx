import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bug, ArrowRight, Plus, Search, Trash2 } from "lucide-react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppStore } from "../store";
import { getPlaygrounds, deletePlayground } from "../services/api";
import { Playground } from "../types";

const Playgrounds: React.FC = () => {
  const { playgrounds, setPlaygrounds, loading, setLoading, removePlayground } =
    useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPlaygroundId, setDeletingPlaygroundId] = useState<
    number | null
  >(null);

  const fetchPlaygrounds = useCallback(async () => {
    try {
      setLoading("playgrounds", true);
      const response = await getPlaygrounds();

      if (response && response.data) {
        setPlaygrounds(response.data);
      } else {
        console.error("API returned incorrect data format:", response);
        setPlaygrounds([]);
      }
    } catch (error) {
      console.error("获取 Playground 列表失败:", error);
      setPlaygrounds([]);
    } finally {
      setLoading("playgrounds", false);
    }
  }, [setLoading, setPlaygrounds]);

  useEffect(() => {
    fetchPlaygrounds();
  }, [fetchPlaygrounds]);

  const handleDeletePlayground = async (playgroundId: number) => {
    try {
      setDeletingPlaygroundId(playgroundId);
      await deletePlayground(playgroundId);
      removePlayground(playgroundId);
      message.success("调试环境删除成功");
    } catch (error) {
      console.error("删除Playground失败:", error);
      message.error("删除失败，请重试");
    } finally {
      setDeletingPlaygroundId(null);
    }
  };

  const filteredPlaygrounds = Array.isArray(playgrounds)
    ? playgrounds.filter(
        (playground) =>
          playground.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (playground.description &&
            playground.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
    : [];

  const columns: ColumnsType<Playground> = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record: Playground) => (
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">
            {record.description || "无描述"}
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "活跃" : "已完成"}
        </Tag>
      ),
      filters: [
        { text: "活跃", value: "active" },
        { text: "已完成", value: "completed" },
      ],
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      sorter: (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_, record: Playground) => (
        <Space size="middle">
          <Link
            to={`/playground/${record.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            查看详情
          </Link>
          <Popconfirm
            title="确定要删除这个调试环境吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeletePlayground(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              loading={deletingPlaygroundId === record.id}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">调试环境</h1>
        <p className="mt-2 text-sm text-gray-600">
          管理基于生产记录创建的调试环境
        </p>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <Input
              prefix={<Search className="h-5 w-5 text-gray-400" />}
              placeholder="搜索调试环境名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              共 {filteredPlaygrounds.length} 个调试环境
            </span>
          </div>
        </div>
      </div>

      {/* 调试环境列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Spin spinning={loading.playgrounds}>
          <Table
            columns={columns}
            dataSource={filteredPlaygrounds}
            rowKey="id"
            pagination={{
              total: filteredPlaygrounds.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} 共 ${total} 条记录`,
            }}
            scroll={{ x: 800 }}
            locale={{
              emptyText: (
                <div className="text-center py-12">
                  <Bug className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm ? "没有找到匹配的调试环境" : "暂无调试环境"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "尝试调整搜索条件"
                      : "从生产记录创建第一个调试环境"}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <Link
                        to="/sessions"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        浏览会话记录
                      </Link>
                    </div>
                  )}
                </div>
              ),
            }}
          />
        </Spin>
      </div>
    </div>
  );
};

export default Playgrounds;
