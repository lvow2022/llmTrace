import React from 'react';
import { Card, Tag, Space, Button, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ReplaySession } from '../../../types';

const { Text, Title } = Typography;

interface ReplaySessionItemProps {
  replaySession: ReplaySession;
  onView: (session: ReplaySession) => void;
  onDelete: (id: string) => void;
}

const ReplaySessionItem: React.FC<ReplaySessionItemProps> = ({
  replaySession,
  onView,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    return status === 'active' ? 'green' : 'orange';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '进行中' : '已完成';
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: '12px' }}
      actions={[
        <Button
          key="view"
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onView(replaySession)}
        >
          查看调试
        </Button>,
        <Button
          key="delete"
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(replaySession.id)}
        >
          删除
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <PlayCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0 }}>
              {replaySession.name}
            </Title>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <Text type="secondary">基于会话: </Text>
            <Text code>{replaySession.original_session_id}</Text>
          </div>
          
          <Space size="small">
            <Tag color="blue">轮次 {replaySession.start_turn_number}</Tag>
            <Tag color={getStatusColor(replaySession.status)}>
              {getStatusText(replaySession.status)}
            </Tag>
          </Space>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(replaySession.created_at).toLocaleString()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default ReplaySessionItem;
