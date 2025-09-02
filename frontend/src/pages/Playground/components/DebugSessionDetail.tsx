import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Descriptions, Table, Tag, Button, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { DebugSession, DebugRecord } from '../../../types';
import { playgroundService } from '../../../services/api';
import DebugExecutionModal from './DebugExecutionModal';

interface DebugSessionDetailProps {
  visible: boolean;
  debugSession: DebugSession | null;
  onCancel: () => void;
}

const DebugSessionDetail: React.FC<DebugSessionDetailProps> = ({
  visible,
  debugSession,
  onCancel,
}) => {
  const [debugRecords, setDebugRecords] = useState<DebugRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);

  const fetchDebugRecords = useCallback(async () => {
    if (!debugSession) return;
    
    setLoading(true);
    try {
      const response = await playgroundService.getDebugSessionDetail(debugSession.id);
      if (response.success) {
        setDebugRecords(response.data.records || []);
      }
    } catch (error) {
      message.error('获取调试记录失败');
    } finally {
      setLoading(false);
    }
  }, [debugSession]);

  useEffect(() => {
    if (visible && debugSession) {
      fetchDebugRecords();
    }
  }, [visible, debugSession, fetchDebugRecords]);

  const handleExecuteDebug = () => {
    setDebugModalVisible(true);
  };

  const handleDebugSuccess = () => {
    fetchDebugRecords();
    setDebugModalVisible(false);
  };

  const columns = [
    {
      title: '轮次',
      dataIndex: 'turn_number',
      key: 'turn_number',
      width: 80,
    },
    {
      title: '请求',
      dataIndex: 'request',
      key: 'request',
      ellipsis: true,
      render: (text: string) => {
        try {
          const parsed = JSON.parse(text);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return text;
        }
      },
    },
    {
      title: '响应',
      dataIndex: 'response',
      key: 'response',
      ellipsis: true,
      render: (text: string) => {
        if (!text) return '-';
        try {
          const parsed = JSON.parse(text);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return text;
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange'}>
          {status === 'success' ? '成功' : status === 'error' ? '错误' : '待处理'}
        </Tag>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '执行时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  if (!debugSession) return null;

  return (
    <>
      <Modal
        title={`调试会话详情 - ${debugSession.name}`}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={1400}
        destroyOnClose
      >
        <Descriptions title="基本信息" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="ID">{debugSession.id}</Descriptions.Item>
          <Descriptions.Item label="名称">{debugSession.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={debugSession.status === 'active' ? 'green' : 'blue'}>
              {debugSession.status === 'active' ? '活跃' : '已完成'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="原始会话ID">{debugSession.original_session_id}</Descriptions.Item>
          <Descriptions.Item label="原始记录ID">{debugSession.original_record_id}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(debugSession.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecuteDebug}
          >
            执行调试
          </Button>
        </div>

        <Table
          title={() => <h3>调试记录</h3>}
          columns={columns}
          dataSource={debugRecords}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Modal>

      <DebugExecutionModal
        visible={debugModalVisible}
        debugSession={debugSession}
        onCancel={() => setDebugModalVisible(false)}
        onSuccess={handleDebugSuccess}
      />
    </>
  );
};

export default DebugSessionDetail;
