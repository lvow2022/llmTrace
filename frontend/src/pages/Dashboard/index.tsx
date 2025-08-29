import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space } from 'antd';
import { 
  MessageOutlined, 
  HistoryOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { useSessionStore, useRecordStore } from '../../stores';
import { Session, Record } from '../../types';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { sessions, fetchSessions } = useSessionStore();
  const { records, fetchRecords } = useRecordStore();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalRecords: 0,
    successRecords: 0,
    errorRecords: 0,
    pendingRecords: 0,
  });

  useEffect(() => {
    // 获取会话数据
    fetchSessions(1, 1000); // 获取所有会话用于统计
  }, [fetchSessions]);

  useEffect(() => {
    // 计算统计数据
    const totalSessions = sessions.length;
    const totalRecords = records.length;
    const successRecords = records.filter(r => r.status === 'success').length;
    const errorRecords = records.filter(r => r.status === 'error').length;
    const pendingRecords = records.filter(r => r.status === 'pending').length;

    setStats({
      totalSessions,
      totalRecords,
      successRecords,
      errorRecords,
      pendingRecords,
    });
  }, [sessions, records]);

  // 最近会话表格列配置
  const recentSessionsColumns = [
    {
      title: '会话名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <MessageOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '记录数量',
      key: 'recordCount',
      render: (_: any, record: Session) => {
        const count = records.filter(r => r.session_id === record.id).length;
        return count;
      },
    },
  ];

  // 最近记录表格列配置
  const recentRecordsColumns = [
    {
      title: '轮次',
      dataIndex: 'turn_number',
      key: 'turn_number',
      width: 80,
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
          return request.messages?.[0]?.content || '无内容';
        } catch {
          return text.substring(0, 50) + '...';
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
  ];

  return (
    <div>
      <Title level={2}>系统概览</Title>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总会话数"
              value={stats.totalSessions}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={stats.totalRecords}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功记录"
              value={stats.successRecords}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误记录"
              value={stats.errorRecords}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近会话" size="small">
            <Table
              columns={recentSessionsColumns}
              dataSource={sessions.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近记录" size="small">
            <Table
              columns={recentRecordsColumns}
              dataSource={records.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
