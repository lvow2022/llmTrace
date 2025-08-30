import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  message, 
  Space, 
  Card,
  Typography,
  Divider,
  Alert,
  Spin,
  Select,
  Row,
  Col
} from 'antd';
import { 
  PlayCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Record, ReplaySession, CreateReplaySessionRequest } from '../../../types';
import { useReplaySessionStore } from '../../../stores';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface StartDebugModalProps {
  visible: boolean;
  record: Record | null;
  onCancel: () => void;
  onSuccess: (replaySession: ReplaySession) => void;
}

const StartDebugModal: React.FC<StartDebugModalProps> = ({
  visible,
  record,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [originalRequest, setOriginalRequest] = useState<any>(null);
  const { createReplaySession } = useReplaySessionStore();

  useEffect(() => {
    if (record && visible) {
      try {
        const parsed = JSON.parse(record.request);
        setOriginalRequest(parsed);
        
        // 设置默认值
        form.setFieldsValue({
          name: `调试-${record.session_id}-轮次${record.turn_number}`,
          original_session_id: record.session_id,
          start_turn_number: record.turn_number,
        });
      } catch (error) {
        console.error('Failed to parse original request:', error);
        message.error('解析原始请求失败');
      }
    }
  }, [record, visible, form]);

  // 提交创建调试会话
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const createRequest: CreateReplaySessionRequest = {
        original_session_id: values.original_session_id,
        start_turn_number: values.start_turn_number,
        name: values.name,
      };

      const newSession = await createReplaySession(createRequest);
      
      if (newSession) {
        message.success('调试会话创建成功');
        onSuccess(newSession);
      } else {
        message.error('创建调试会话失败');
      }
    } catch (error) {
      console.error('Create debug session error:', error);
      message.error('创建调试会话失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <PlayCircleOutlined style={{ color: '#1890ff' }} />
          <span>开始调试会话</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          icon={<PlayCircleOutlined />}
        >
          开始调试
        </Button>,
      ]}
      width={800}
      destroyOnClose
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在创建调试会话...</Text>
          </div>
        </div>
      )}

      {!loading && (
        <div>
          {/* 调试会话信息 */}
          <Card 
            title={
              <Space>
                <InfoCircleOutlined />
                <span>调试会话信息</span>
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: '',
                original_session_id: '',
                start_turn_number: 1,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="调试会话名称"
                    name="name"
                    rules={[
                      { required: true, message: '请输入调试会话名称' },
                      { max: 100, message: '名称不能超过100个字符' },
                    ]}
                  >
                    <Input placeholder="请输入调试会话名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="原始会话ID"
                    name="original_session_id"
                    rules={[
                      { required: true, message: '原始会话ID不能为空' },
                    ]}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                label="开始调试轮次"
                name="start_turn_number"
                rules={[
                  { required: true, message: '请选择开始调试的轮次' },
                  { type: 'number', min: 1, message: '轮次必须大于0' },
                ]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Form>
          </Card>

          {/* 原始请求信息 */}
          {originalRequest && (
            <Card 
              title={
                <Space>
                  <SettingOutlined />
                  <span>原始请求信息</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong>会话ID: </Text>
                <Text code>{record?.session_id}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>轮次: </Text>
                <Text code>{record?.turn_number}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>状态: </Text>
                <Text code>{record?.status}</Text>
              </div>
              <div>
                <Text strong>请求内容: </Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, fontSize: '12px' }}>
                    {JSON.stringify(originalRequest, null, 2)}
                  </pre>
                </div>
              </div>
            </Card>
          )}

          {/* 提示信息 */}
          <Alert
            message="调试说明"
            description={
              <div>
                <p>• 调试会话将基于选中的轮次创建，您可以进行多轮对话调试</p>
                <p>• 调试过程中的所有请求和响应都会被保存</p>
                <p>• 您可以修改模型参数、Provider等配置进行测试</p>
                <p>• 调试会话与原始会话完全独立，不会影响原始数据</p>
                <p>• 调试完成后可以在"调试会话"页面查看所有调试记录</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )}
    </Modal>
  );
};

export default StartDebugModal;
