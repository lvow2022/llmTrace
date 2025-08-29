import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  Modal, 
  message,
  Input,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  MessageOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSessionStore, useRecordStore } from '../../stores';
import { Session } from '../../types';

const { Title } = Typography;
const { Search } = Input;

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const { 
    sessions, 
    loading, 
    pagination, 
    fetchSessions,
    setCurrentSession 
  } = useSessionStore();
  const { records } = useRecordStore();
  const [searchText, setSearchText] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // 过滤会话
  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchText.toLowerCase()) ||
    session.id.toLowerCase().includes(searchText.toLowerCase())
  );

  // 获取会话统计信息
  const getSessionStats = (sessionId: string) => {
    const sessionRecords = records.filter(r => r.session_id === sessionId);
    return {
      total: sessionRecords.length,
      success: sessionRecords.filter(r => r.status === 'success').length,
      error: sessionRecords.filter(r => r.status === 'error').length,
      pending: sessionRecords.filter(r => r.status === 'pending').length,
    };
  };

  // 表格列配置
  const columns = [
    {
      title: '会话名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Session) => (
        <Space>
          <MessageOutlined />
          <span 
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleViewSession(record)}
          >
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '会话ID',
      dataIndex: 'id',
      key: 'id',
      width: 280,
      ellipsis: true,
      render: (text: string) => (
        <code style={{ fontSize: '12px' }}>{text}</code>
      ),
    },
    {
      title: '记录统计',
      key: 'stats',
      width: 200,
      render: (_: any, record: Session) => {
        const stats = getSessionStats(record.id);
        return (
          <Space size="small">
            <Tag color="blue">{stats.total} 条</Tag>
            <Tag color="success">{stats.success} 成功</Tag>
            <Tag color="error">{stats.error} 错误</Tag>
            {stats.pending > 0 && (
              <Tag color="warning">{stats.pending} 处理中</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Session) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSession(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSession(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 查看会话详情
  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setCurrentSession(session);
    setDetailModalVisible(true);
  };

  // 删除会话
  const handleDeleteSession = (session: Session) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会话 "${session.name}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // TODO: 实现删除会话的API调用
        message.success('会话删除成功');
      },
    });
  };

  // 查看会话记录
  const handleViewRecords = () => {
    if (selectedSession) {
      setDetailModalVisible(false);
      navigate(`/records?session_id=${selectedSession.id}`);
    }
  };

  // 分页处理
  const handleTableChange = (pagination: any) => {
    fetchSessions(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <Title level={2}>会话管理</Title>

      {/* 搜索和统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Search
            placeholder="搜索会话名称或ID"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="总会话数"
                value={sessions.length}
                prefix={<MessageOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="总记录数"
                value={records.length}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="活跃会话"
                value={sessions.filter(s => getSessionStats(s.id).total > 0).length}
                prefix={<MessageOutlined />}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {/* 会话列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredSessions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 会话详情模态框 */}
      <Modal
        title={`会话详情 - ${selectedSession?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="viewRecords" 
            type="primary" 
            onClick={handleViewRecords}
          >
            查看记录
          </Button>,
        ]}
        width={800}
      >
        {selectedSession && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="会话ID"
                  value={selectedSession.id}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="创建时间"
                  value={new Date(selectedSession.created_at).toLocaleString('zh-CN')}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {(() => {
                const stats = getSessionStats(selectedSession.id);
                return (
                  <>
                    <Col span={6}>
                      <Statistic
                        title="总记录数"
                        value={stats.total}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="成功记录"
                        value={stats.success}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="错误记录"
                        value={stats.error}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="处理中"
                        value={stats.pending}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                  </>
                );
              })()}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sessions;
