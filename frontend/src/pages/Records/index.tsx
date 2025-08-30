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
  Statistic,
  Select,
  Drawer,
  Tabs,
  Alert
} from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  CodeOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSessionStore, useRecordStore } from '../../stores';
import { Record, Session, ReplaySession } from '../../types';
import RecordDetail from './components/RecordDetail';
import ReplayModal from './components/ReplayModal';
import StartDebugModal from './components/StartDebugModal';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Records: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    sessions, 
    currentSession,
    fetchSessions,
    setCurrentSession 
  } = useSessionStore();
  const { 
    records, 
    loading, 
    pagination, 
    fetchRecords,
    deleteRecord 
  } = useRecordStore();
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [replayModalVisible, setReplayModalVisible] = useState(false);
  const [replayRecord, setReplayRecord] = useState<Record | null>(null);
  const [startDebugModalVisible, setStartDebugModalVisible] = useState(false);
  const [debugRecord, setDebugRecord] = useState<Record | null>(null);

  // 从URL参数获取会话ID
  const sessionIdFromUrl = searchParams.get('session_id');

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (sessionIdFromUrl) {
      // 设置当前会话
      const session = sessions.find(s => s.id === sessionIdFromUrl);
      if (session) {
        setCurrentSession(session);
      }
      // 获取该会话的记录
      fetchRecords(sessionIdFromUrl);
    } else if (currentSession) {
      // 如果没有URL参数但有当前会话，获取当前会话的记录
      fetchRecords(currentSession.id);
    }
  }, [sessionIdFromUrl, currentSession, sessions, fetchRecords, setCurrentSession]);

  // 过滤记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.id.toLowerCase().includes(searchText.toLowerCase()) ||
      record.request.toLowerCase().includes(searchText.toLowerCase()) ||
      record.response.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 表格列配置
  const columns = [
    {
      title: '轮次',
      dataIndex: 'turn_number',
      key: 'turn_number',
      width: 80,
      render: (text: number) => (
        <Tag color="blue">#{text}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
          error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '错误' },
          pending: { color: 'warning', icon: <ClockCircleOutlined />, text: '处理中' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Space>
            {config.icon}
            <span style={{ color: config.color === 'success' ? '#52c41a' : config.color === 'error' ? '#ff4d4f' : '#faad14' }}>
              {config.text}
            </span>
          </Space>
        );
      },
    },
    {
      title: '请求内容',
      dataIndex: 'request',
      key: 'request',
      ellipsis: true,
      render: (text: string) => {
        try {
          const request = JSON.parse(text);
          const content = request.messages?.[0]?.content || '无内容';
          return (
            <div style={{ maxWidth: 300 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {request.model || '未知模型'}
              </div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {content.length > 100 ? content.substring(0, 100) + '...' : content}
              </div>
            </div>
          );
        } catch {
          return (
            <div style={{ maxWidth: 300, fontSize: '12px', color: '#666' }}>
              {text.length > 100 ? text.substring(0, 100) + '...' : text}
            </div>
          );
        }
      },
    },
    {
      title: '响应内容',
      dataIndex: 'response',
      key: 'response',
      ellipsis: true,
      render: (text: string) => {
        if (!text) return <span style={{ color: '#ccc' }}>无响应</span>;
        try {
          const response = JSON.parse(text);
          const content = response.choices?.[0]?.message?.content || '无内容';
          return (
            <div style={{ maxWidth: 300, fontSize: '12px', color: '#666' }}>
              {content.length > 100 ? content.substring(0, 100) + '...' : content}
            </div>
          );
        } catch {
          return (
            <div style={{ maxWidth: 300, fontSize: '12px', color: '#666' }}>
              {text.length > 100 ? text.substring(0, 100) + '...' : text}
            </div>
          );
        }
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
      width: 200,
      render: (_: any, record: Record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewRecord(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleReplayRecord(record)}
          >
            重放
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartDebug(record)}
          >
            开始调试
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRecord(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 查看记录详情
  const handleViewRecord = (record: Record) => {
    setSelectedRecord(record);
    setDetailDrawerVisible(true);
  };

  // 重放记录
  const handleReplayRecord = (record: Record) => {
    setReplayRecord(record);
    setReplayModalVisible(true);
  };

  // 开始调试
  const handleStartDebug = (record: Record) => {
    setDebugRecord(record);
    setStartDebugModalVisible(true);
  };

  // 处理调试会话创建成功
  const handleDebugSuccess = (replaySession: ReplaySession) => {
    setStartDebugModalVisible(false);
    setDebugRecord(null);
    message.success('调试会话创建成功，正在跳转到调试界面...');
    // 跳转到调试界面
    navigate(`/replay-debug/${replaySession.id}`);
  };

  // 删除记录
  const handleDeleteRecord = (record: Record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这条记录吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteRecord(record.id);
          message.success('记录删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 分页处理
  const handleTableChange = (pagination: any) => {
    if (currentSession) {
      fetchRecords(currentSession.id, pagination.current, pagination.pageSize);
    }
  };

  // 会话选择处理
  const handleSessionChange = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setSearchParams({ session_id: sessionId });
      fetchRecords(sessionId);
    }
  };

  return (
    <div>
      <Title level={2}>调用记录</Title>

      {/* 会话选择和搜索 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Select
            placeholder="选择会话"
            style={{ width: '100%' }}
            value={currentSession?.id}
            onChange={handleSessionChange}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {sessions.map(session => (
              <Option key={session.id} value={session.id}>
                {session.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={8}>
          <Search
            placeholder="搜索记录内容"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            placeholder="状态筛选"
            style={{ width: '100%' }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">全部状态</Option>
            <Option value="success">成功</Option>
            <Option value="error">错误</Option>
            <Option value="pending">处理中</Option>
          </Select>
        </Col>
      </Row>

      {/* 统计信息 */}
      {currentSession && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="总记录数"
              value={records.length}
              prefix={<HistoryOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功记录"
              value={records.filter(r => r.status === 'success').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="错误记录"
              value={records.filter(r => r.status === 'error').length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="处理中"
              value={records.filter(r => r.status === 'pending').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>
      )}

      {/* 记录列表 */}
      <Card>
        {!currentSession ? (
          <Alert
            message="请选择会话"
            description="请从上方选择一个会话来查看其调用记录"
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRecords}
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
            scroll={{ x: 1400 }}
          />
        )}
      </Card>

      {/* 记录详情抽屉 */}
      <Drawer
        title="记录详情"
        placement="right"
        width={800}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                if (selectedRecord) {
                  setDetailDrawerVisible(false);
                  handleReplayRecord(selectedRecord);
                }
              }}
            >
              重放
            </Button>
          </Space>
        }
      >
        {selectedRecord && (
          <RecordDetail record={selectedRecord} />
        )}
      </Drawer>

      {/* 重放模态框 */}
      <ReplayModal
        visible={replayModalVisible}
        record={replayRecord}
        onCancel={() => {
          setReplayModalVisible(false);
          setReplayRecord(null);
        }}
        onSuccess={() => {
          setReplayModalVisible(false);
          setReplayRecord(null);
          message.success('重放成功');
          // 刷新记录列表
          if (currentSession) {
            fetchRecords(currentSession.id, pagination.current, pagination.pageSize);
          }
        }}
      />

      {/* 开始调试模态框 */}
      <StartDebugModal
        visible={startDebugModalVisible}
        record={debugRecord}
        onCancel={() => {
          setStartDebugModalVisible(false);
          setDebugRecord(null);
        }}
        onSuccess={handleDebugSuccess}
      />
    </div>
  );
};

export default Records;
