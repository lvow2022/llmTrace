import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, Button, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Playground, DebugSession } from '../../../types';
import { playgroundService } from '../../../services/api';
import CreateDebugSessionModal from './CreateDebugSessionModal';
import DebugSessionDetail from './DebugSessionDetail';

interface DebugSessionListProps {
  visible: boolean;
  playground: Playground | null;
  onCancel: () => void;
}

const DebugSessionList: React.FC<DebugSessionListProps> = ({
  visible,
  playground,
  onCancel,
}) => {
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedDebugSession, setSelectedDebugSession] = useState<DebugSession | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchDebugSessions = useCallback(async () => {
    if (!playground) return;
    setLoading(true);
    try {
      const response = await playgroundService.getDebugSessions(playground.id);
      if (response.success && response.data) {
        setDebugSessions(response.data.data || []);
      }
    } catch (error) {
      message.error('获取调试会话列表失败');
    } finally {
      setLoading(false);
    }
  }, [playground]);

  useEffect(() => {
    if (visible && playground) {
      fetchDebugSessions();
    }
  }, [visible, playground, fetchDebugSessions]);

  const handleCreateDebugSession = async (values: { name: string }) => {
    try {
      const response = await playgroundService.createDebugSession({
        playground_id: playground!.id,
        name: values.name,
      });
      if (response.success) {
        message.success('创建成功');
        setCreateModalVisible(false);
        fetchDebugSessions();
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDeleteDebugSession = async (id: string) => {
    try {
      const response = await playgroundService.deleteDebugSession(id);
      if (response.success) {
        message.success('删除成功');
        fetchDebugSessions();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewDetail = (debugSession: DebugSession) => {
    setSelectedDebugSession(debugSession);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '原始会话ID',
      dataIndex: 'original_session_id',
      key: 'original_session_id',
      ellipsis: true,
    },
    {
      title: '原始记录ID',
      dataIndex: 'original_record_id',
      key: 'original_record_id',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'blue'}>
          {status === 'active' ? '活跃' : '已完成'}
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
      render: (_: any, record: DebugSession) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Popconfirm
            title="确定要删除这个调试会话吗？"
            onConfirm={() => handleDeleteDebugSession(record.id)}
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

  if (!playground) return null;

  return (
    <>
      <Modal
        title={`${playground.name} - 调试会话管理`}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建调试会话
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={debugSessions}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Modal>

      <CreateDebugSessionModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSubmit={handleCreateDebugSession}
      />

      <DebugSessionDetail
        visible={detailModalVisible}
        debugSession={selectedDebugSession}
        onCancel={() => setDetailModalVisible(false)}
      />
    </>
  );
};

export default DebugSessionList;
