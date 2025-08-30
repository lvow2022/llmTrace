import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  message, 
  Popconfirm, 
  Tag, 
  Typography,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlayCircleOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useReplaySessionStore } from '../../stores';
import { ReplaySession } from '../../types';
import ReplaySessionItem from './components/ReplaySessionItem';

const { Title } = Typography;

const ReplaySessions: React.FC = () => {
  const navigate = useNavigate();
  const {
    replaySessions,
    loading,
    pagination,
    fetchReplaySessions,
    deleteReplaySession,
  } = useReplaySessionStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchReplaySessions();
  }, [fetchReplaySessions]);

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    fetchReplaySessions(pagination.current, pagination.pageSize);
  };

  // 处理删除调试会话
  const handleDelete = async (id: string) => {
    try {
      await deleteReplaySession(id);
      message.success('调试会话删除成功');
      // 重新获取列表
      fetchReplaySessions(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理查看调试会话
  const handleView = (session: ReplaySession) => {
    navigate(`/replay-debug/${session.id}`);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的调试会话');
      return;
    }

    try {
      for (const id of selectedRowKeys) {
        await deleteReplaySession(id as string);
      }
      message.success(`成功删除 ${selectedRowKeys.length} 个调试会话`);
      setSelectedRowKeys([]);
      fetchReplaySessions(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '调试会话名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReplaySession) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            基于会话: {record.original_session_id}
          </div>
        </div>
      ),
    },
    {
      title: '开始轮次',
      dataIndex: 'start_turn_number',
      key: 'start_turn_number',
      width: 100,
      render: (turnNumber: number) => (
        <Tag color="blue">轮次 {turnNumber}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '进行中' : '已完成'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (text: string, record: ReplaySession) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看调试
          </Button>
          <Popconfirm
            title="确定要删除这个调试会话吗？"
            description="删除后将无法恢复，包括所有调试记录。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总调试会话数"
                value={pagination.total}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="进行中的调试"
                value={replaySessions.filter(s => s.status === 'active').length}
                valueStyle={{ color: '#3f8600' }}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="已完成的调试"
                value={replaySessions.filter(s => s.status === 'completed').length}
                valueStyle={{ color: '#cf1322' }}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>调试会话管理</Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchReplaySessions()}
                loading={loading}
              >
                刷新
              </Button>
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 个调试会话吗？`}
                  description="删除后将无法恢复，包括所有调试记录。"
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={replaySessions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default ReplaySessions;
