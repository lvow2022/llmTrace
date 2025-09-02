import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Card, Descriptions, Tag } from 'antd';
import { Record, CreateDebugSessionFromRecordRequest, Playground, DebugSession } from '../../../types';
import { playgroundService } from '../../../services/api';
import DebugExecutionModal from '../../Playground/components/DebugExecutionModal';

const { Option } = Select;

interface CreateDebugSessionModalProps {
  visible: boolean;
  record: Record | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateDebugSessionModal: React.FC<CreateDebugSessionModalProps> = ({
  visible,
  record,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<string>('');
  const [debugExecutionVisible, setDebugExecutionVisible] = useState(false);
  const [createdDebugSession, setCreatedDebugSession] = useState<DebugSession | null>(null);

  useEffect(() => {
    if (visible) {
      fetchPlaygrounds();
      form.resetFields();
    }
  }, [visible, form]);

  const fetchPlaygrounds = async () => {
    try {
      const response = await playgroundService.getPlaygrounds();
      if (response.success && response.data) {
        setPlaygrounds(response.data.data || []);
      }
    } catch (error) {
      message.error('获取Playground列表失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const request: CreateDebugSessionFromRecordRequest = {
        playground_id: values.playground_id,
        name: values.name,
      };

      const response = await playgroundService.createDebugSessionFromRecord(record!.id, request);
      if (response.success && response.data) {
        message.success('调试会话创建成功');
        // 保存创建的调试会话，并打开调试执行模态框
        setCreatedDebugSession(response.data);
        setDebugExecutionVisible(true);
        // 不立即关闭模态框，让用户看到调试执行界面
      }
    } catch (error) {
      message.error('创建调试会话失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedPlayground('');
    onCancel();
  };

  const handlePlaygroundChange = (value: string) => {
    setSelectedPlayground(value);
  };

  const handleDebugExecutionCancel = () => {
    setDebugExecutionVisible(false);
    setCreatedDebugSession(null);
    // 关闭调试执行模态框后，关闭创建调试会话模态框
    onSuccess();
  };

  const handleDebugExecutionSuccess = () => {
    setDebugExecutionVisible(false);
    setCreatedDebugSession(null);
    // 调试执行成功后，关闭所有模态框
    onSuccess();
  };

  if (!record) return null;

  return (
    <Modal
      title="创建调试会话"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      width={800}
      destroyOnClose
    >
      <div style={{ marginBottom: 24 }}>
        <Card title="原始记录信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="记录ID">{record.id}</Descriptions.Item>
            <Descriptions.Item label="轮次">#{record.turn_number}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={record.status === 'success' ? 'green' : record.status === 'error' ? 'red' : 'orange'}>
                {record.status === 'success' ? '成功' : record.status === 'error' ? '错误' : '处理中'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(record.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
          
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>请求内容：</div>
            <div style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 4, 
              fontSize: '12px',
              maxHeight: 100,
              overflow: 'auto'
            }}>
              {record.request}
            </div>
          </div>
        </Card>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="playground_id"
          label="选择Playground"
          rules={[{ required: true, message: '请选择Playground' }]}
        >
          <Select
            placeholder="请选择Playground"
            onChange={handlePlaygroundChange}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {playgrounds.map(playground => (
              <Option key={playground.id} value={playground.id}>
                {playground.name} - {playground.description || '无描述'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="name"
          label="调试会话名称"
          rules={[{ required: true, message: '请输入调试会话名称' }]}
        >
          <Input 
            placeholder="请输入调试会话名称" 
            defaultValue={`调试-${record.turn_number}轮次-${new Date().toLocaleDateString('zh-CN')}`}
          />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
        <div style={{ color: '#52c41a', fontWeight: 'bold', marginBottom: 8 }}>
          💡 提示
        </div>
        <div style={{ fontSize: '12px', color: '#52c41a' }}>
          创建调试会话后，系统会自动复制原始记录作为第一条调试记录。
          您可以在Playground中继续添加新的调试记录，测试不同的参数和配置。
        </div>
      </div>

      <DebugExecutionModal
        visible={debugExecutionVisible}
        debugSession={createdDebugSession}
        originalRecord={record}
        onCancel={handleDebugExecutionCancel}
        onSuccess={handleDebugExecutionSuccess}
      />
    </Modal>
  );
};

export default CreateDebugSessionModal;
