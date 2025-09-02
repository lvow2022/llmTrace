import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Table, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Playground as PlaygroundType } from '../../types';
import { playgroundService } from '../../services/api';
import CreatePlaygroundModal from './components/CreatePlaygroundModal';
import DebugSessionList from './components/DebugSessionList';

const Playground: React.FC = () => {
  const [playgrounds, setPlaygrounds] = useState<PlaygroundType[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedPlayground, setSelectedPlayground] = useState<PlaygroundType | null>(null);
  const [debugSessionsVisible, setDebugSessionsVisible] = useState(false);

  useEffect(() => {
    fetchPlaygrounds();
  }, []);

  const fetchPlaygrounds = async () => {
    setLoading(true);
    try {
      const response = await playgroundService.getPlaygrounds();
      if (response.success && response.data) {
        setPlaygrounds(response.data.data || []);
      }
    } catch (error) {
      message.error('获取Playground列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayground = async (values: { name: string; description?: string }) => {
    try {
      const response = await playgroundService.createPlayground(values);
      if (response.success) {
        message.success('创建成功');
        setCreateModalVisible(false);
        fetchPlaygrounds();
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDeletePlayground = async (id: string) => {
    try {
      const response = await playgroundService.deletePlayground(id);
      if (response.success) {
        message.success('删除成功');
        fetchPlaygrounds();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewDebugSessions = (playground: PlaygroundType) => {
    setSelectedPlayground(playground);
    setDebugSessionsVisible(true);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PlaygroundType) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleViewDebugSessions(record)}
          >
            调试会话
          </Button>
          <Popconfirm
            title="确定要删除这个Playground吗？"
            onConfirm={() => handleDeletePlayground(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Playground管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建Playground
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={playgrounds}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <CreatePlaygroundModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSubmit={handleCreatePlayground}
      />

      <DebugSessionList
        visible={debugSessionsVisible}
        playground={selectedPlayground}
        onCancel={() => setDebugSessionsVisible(false)}
      />
    </div>
  );
};

export default Playground;
