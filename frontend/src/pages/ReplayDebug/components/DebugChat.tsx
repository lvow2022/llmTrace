import React, { useEffect, useRef } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Spin, 
  Empty,
  Avatar,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { ReplayRecord } from '../../../types';

const { Text, Paragraph } = Typography;

interface DebugChatProps {
  records: ReplayRecord[];
  loading: boolean;
  currentTurnNumber: number;
}

const DebugChat: React.FC<DebugChatProps> = ({
  records,
  loading,
  currentTurnNumber,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [records]);

  // 获取状态图标和颜色
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  // 解析请求内容
  const parseRequest = (requestStr: string) => {
    try {
      const request = JSON.parse(requestStr);
      return request.messages?.[0]?.content || '无内容';
    } catch {
      return requestStr;
    }
  };

  // 解析响应内容
  const parseResponse = (responseStr: string) => {
    try {
      const response = JSON.parse(responseStr);
      return response.choices?.[0]?.message?.content || '无内容';
    } catch {
      return responseStr;
    }
  };

  if (loading && records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载调试记录...</Text>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Empty
        description="暂无调试记录"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {records.map((record, index) => (
        <div key={record.id} style={{ marginBottom: '16px' }}>
          {/* 轮次标识 */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '8px',
            background: '#f0f0f0',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              轮次 {record.turn_number} • {new Date(record.created_at).toLocaleTimeString()}
            </Text>
          </div>

          {/* 用户消息 */}
          <div style={{ marginBottom: '8px' }}>
            <Card size="small" style={{ maxWidth: '80%', marginLeft: 'auto' }}>
              <Space align="start">
                <Avatar icon={<UserOutlined />} size="small" />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <Text strong>用户</Text>
                    <Tag style={{ marginLeft: '8px', fontSize: '12px' }}>
                      {record.provider} / {record.model}
                    </Tag>
                  </div>
                  <Paragraph style={{ margin: 0 }}>
                    {parseRequest(record.request)}
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </div>

          {/* AI响应 */}
          <div style={{ marginBottom: '8px' }}>
            <Card size="small" style={{ maxWidth: '80%' }}>
              <Space align="start">
                <Avatar icon={<RobotOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <Space>
                      <Text strong>AI助手</Text>
                      {getStatusIcon(record.status)}
                      {record.status === 'error' && (
                        <Text type="danger" style={{ fontSize: '12px' }}>
                          {record.error_msg}
                        </Text>
                      )}
                    </Space>
                  </div>
                  {record.status === 'success' ? (
                    <Paragraph style={{ margin: 0 }}>
                      {parseResponse(record.response)}
                    </Paragraph>
                  ) : record.status === 'error' ? (
                    <Text type="danger">请求失败: {record.error_msg}</Text>
                  ) : (
                    <Text type="secondary">处理中...</Text>
                  )}
                </div>
              </Space>
            </Card>
          </div>

          {/* 配置信息 */}
          {record.config && (
            <div style={{ 
              background: '#f9f9f9', 
              padding: '8px', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666'
            }}>
              <Text type="secondary">
                配置: 温度 {JSON.parse(record.config).temperature} • 
                Token {JSON.parse(record.config).max_tokens} • 
                Top-P {JSON.parse(record.config).top_p}
              </Text>
            </div>
          )}

          {index < records.length - 1 && <Divider style={{ margin: '16px 0' }} />}
        </div>
      ))}
      
      {/* 当前轮次提示 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '16px',
        background: '#e6f7ff',
        borderRadius: '4px',
        border: '1px dashed #91d5ff'
      }}>
        <Text type="secondary">
          当前轮次: {currentTurnNumber} • 准备发送下一条消息
        </Text>
      </div>

      <div ref={chatEndRef} />
    </div>
  );
};

export default DebugChat;
