import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, message, Space, Card, Descriptions, Tag, Divider } from 'antd';
import { DebugSession, DebugRequest, ProviderInfo, Record } from '../../../types';
import { playgroundService } from '../../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface DebugExecutionModalProps {
  visible: boolean;
  debugSession: DebugSession | null;
  originalRecord?: Record | null; // 添加原始记录参数
  onCancel: () => void;
  onSuccess: () => void;
}

const DebugExecutionModal: React.FC<DebugExecutionModalProps> = ({
  visible,
  debugSession,
  originalRecord,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      fetchProviders();
      if (originalRecord) {
        // 预填充表单，使用原始记录的信息
        form.setFieldsValue({
          turn_number: originalRecord.turn_number,
          request: originalRecord.request,
          // 可以设置默认的provider和model
        });
      }
    }
  }, [visible, form, originalRecord]);

  useEffect(() => {
    if (selectedProvider && providers.length > 0) {
      const provider = providers.find(p => p.name === selectedProvider);
      if (provider) {
        setModels(provider.models.map(m => m.model));
      }
    }
  }, [selectedProvider, providers]);

  const fetchProviders = async () => {
    try {
      const response = await playgroundService.getProviders();
      if (response.success) {
        setProviders(response.data || []);
      }
    } catch (error) {
      message.error('获取提供商列表失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const debugRequest: DebugRequest = {
        turn_number: values.turn_number,
        request: values.request,
        provider: values.provider,
        model: values.model,
        config: {
          temperature: values.temperature,
          max_tokens: values.max_tokens,
          top_p: values.top_p,
          frequency_penalty: values.frequency_penalty,
          presence_penalty: values.presence_penalty,
        },
      };

      const response = await playgroundService.executeDebug(debugSession!.id, debugRequest);
      if (response.success) {
        message.success('调试执行成功');
        onSuccess();
      }
    } catch (error) {
      message.error('调试执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedProvider('');
    setModels([]);
    onCancel();
  };

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    form.setFieldsValue({ model: undefined });
  };

  return (
    <Modal
      title="调试执行"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={1000}
      destroyOnClose
    >
      {/* 显示原始记录信息 */}
      {originalRecord && (
        <>
          <Card title="原始记录信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="记录ID">{originalRecord.id}</Descriptions.Item>
              <Descriptions.Item label="轮次">#{originalRecord.turn_number}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={originalRecord.status === 'success' ? 'green' : originalRecord.status === 'error' ? 'red' : 'orange'}>
                  {originalRecord.status === 'success' ? '成功' : originalRecord.status === 'error' ? '错误' : '处理中'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(originalRecord.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>原始请求内容：</div>
              <div style={{ 
                background: '#f5f5f5', 
                padding: 12, 
                borderRadius: 4, 
                fontSize: '12px',
                maxHeight: 100,
                overflow: 'auto'
              }}>
                {originalRecord.request}
              </div>
            </div>

            {originalRecord.response && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>原始响应内容：</div>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4, 
                  fontSize: '12px',
                  maxHeight: 100,
                  overflow: 'auto'
                }}>
                  {originalRecord.response}
                </div>
              </div>
            )}
          </Card>
          <Divider />
        </>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="turn_number"
          label="轮次编号"
          rules={[{ required: true, message: '请输入轮次编号' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="请输入轮次编号"
          />
        </Form.Item>

        <Form.Item
          name="request"
          label="请求内容"
          rules={[{ required: true, message: '请输入请求内容' }]}
        >
          <TextArea
            rows={6}
            placeholder="请输入JSON格式的请求内容"
          />
        </Form.Item>

        <Form.Item
          name="provider"
          label="选择Provider"
          rules={[{ required: true, message: '请选择Provider' }]}
        >
          <Select
            placeholder="请选择Provider"
            onChange={handleProviderChange}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {providers.map(provider => (
              <Option key={provider.name} value={provider.name}>
                {provider.name} - {provider.type}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="model"
          label="选择模型"
          rules={[{ required: true, message: '请选择模型' }]}
        >
          <Select
            placeholder="请选择模型"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {models.map(model => (
              <Option key={model} value={model}>
                {model}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>模型参数配置</Divider>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            name="temperature"
            label="Temperature"
            initialValue={0.7}
          >
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="0.7"
            />
          </Form.Item>

          <Form.Item
            name="max_tokens"
            label="Max Tokens"
            initialValue={2048}
          >
            <InputNumber
              min={1}
              max={8192}
              style={{ width: '100%' }}
              placeholder="2048"
            />
          </Form.Item>

          <Form.Item
            name="top_p"
            label="Top P"
            initialValue={1.0}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="1.0"
            />
          </Form.Item>

          <Form.Item
            name="frequency_penalty"
            label="Frequency Penalty"
            initialValue={0.0}
          >
            <InputNumber
              min={-2}
              max={2}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="0.0"
            />
          </Form.Item>

          <Form.Item
            name="presence_penalty"
            label="Presence Penalty"
            initialValue={0.0}
          >
            <InputNumber
              min={-2}
              max={2}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="0.0"
            />
          </Form.Item>
        </div>

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              loading={loading}
            >
              执行调试
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default DebugExecutionModal;
