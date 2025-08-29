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
  Col,
  InputNumber,
  Slider,
  Collapse
} from 'antd';
import { 
  ReloadOutlined, 
  CodeOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Record, ReplayRequest, ProviderInfo, ReplayConfig } from '../../../types';
import { APIService } from '../../../services/api';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface ReplayModalProps {
  visible: boolean;
  record: Record | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ReplayModal: React.FC<ReplayModalProps> = ({
  visible,
  record,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [originalRequest, setOriginalRequest] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<{ name: string; model: string; enabled: boolean }[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<ReplayConfig | null>(null);

  useEffect(() => {
    if (record && visible) {
      try {
        const parsed = JSON.parse(record.request);
        setOriginalRequest(parsed);
        
        // 加载默认配置
        const savedConfig = localStorage.getItem('llmtrace-replay-config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setDefaultConfig(config);
          form.setFieldsValue({
            request: JSON.stringify(parsed, null, 2),
            provider: config.provider || 'openai',
            model: config.model || '',
            temperature: config.temperature || 0.7,
            max_tokens: config.max_tokens || 2048,
            top_p: config.top_p || 1.0,
            frequency_penalty: config.frequency_penalty || 0.0,
            presence_penalty: config.presence_penalty || 0.0,
          });
          setSelectedProvider(config.provider || 'openai');
        } else {
          form.setFieldsValue({
            request: JSON.stringify(parsed, null, 2),
            provider: 'openai',
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
          });
          setSelectedProvider('openai');
        }
      } catch (error) {
        console.error('Failed to parse request:', error);
        form.setFieldsValue({
          request: record.request,
          provider: 'openai',
        });
        setSelectedProvider('openai');
      }
    }
  }, [record, visible, form]);

  // 获取可用的providers
  useEffect(() => {
    if (visible) {
      APIService.getProviders().then(response => {
        if (response.success && response.data) {
          setProviders(response.data);
        }
      }).catch(error => {
        console.error('Failed to get providers:', error);
      });
    }
  }, [visible]);

  // 当选择provider时更新可用模型列表
  useEffect(() => {
    if (selectedProvider && providers.length > 0) {
      const provider = providers.find(p => p.type === selectedProvider);
      if (provider && provider.models) {
        setAvailableModels(provider.models.filter(m => m.enabled));
      } else {
        setAvailableModels([]);
      }
    } else {
      setAvailableModels([]);
    }
  }, [selectedProvider, providers]);

  // 复制原始请求
  const copyOriginalRequest = async () => {
    if (originalRequest) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(originalRequest, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        message.success('已复制到剪贴板');
      } catch (error) {
        message.error('复制失败');
      }
    }
  };

  // 重置为原始请求
  const resetToOriginal = () => {
    if (originalRequest) {
      form.setFieldsValue({
        request: JSON.stringify(originalRequest, null, 2),
      });
      message.info('已重置为原始请求');
    }
  };

  // 格式化JSON
  const formatJSON = () => {
    try {
      const currentValue = form.getFieldValue('request');
      const parsed = JSON.parse(currentValue);
      form.setFieldsValue({
        request: JSON.stringify(parsed, null, 2),
      });
      message.success('JSON格式化完成');
    } catch (error) {
      message.error('JSON格式错误，无法格式化');
    }
  };

  // 应用默认配置
  const applyDefaultConfig = () => {
    if (defaultConfig) {
      form.setFieldsValue({
        provider: defaultConfig.provider,
        model: defaultConfig.model,
        temperature: defaultConfig.temperature,
        max_tokens: defaultConfig.max_tokens,
        top_p: defaultConfig.top_p,
        frequency_penalty: defaultConfig.frequency_penalty,
        presence_penalty: defaultConfig.presence_penalty,
      });
      setSelectedProvider(defaultConfig.provider);
      message.success('已应用默认配置');
    } else {
      message.info('未找到默认配置');
    }
  };

  // 提交重放请求
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 解析请求数据
      let requestData;
      try {
        requestData = JSON.parse(values.request);
      } catch (error) {
        message.error('请求数据格式错误');
        return;
      }

      if (!record) {
        message.error('记录信息缺失');
        return;
      }

      // 更新请求数据中的模型参数
      if (requestData.messages && values.model) {
        requestData.model = values.model;
      }
      if (values.temperature !== undefined) {
        requestData.temperature = values.temperature;
      }
      if (values.max_tokens !== undefined) {
        requestData.max_tokens = values.max_tokens;
      }
      if (values.top_p !== undefined) {
        requestData.top_p = values.top_p;
      }
      if (values.frequency_penalty !== undefined) {
        requestData.frequency_penalty = values.frequency_penalty;
      }
      if (values.presence_penalty !== undefined) {
        requestData.presence_penalty = values.presence_penalty;
      }

      // 构建重放请求
      const replayRequest: ReplayRequest = {
        session_id: record.session_id,
        turn_number: record.turn_number,
        request: requestData,
        provider: values.provider,
        model: values.model,
        temperature: values.temperature,
        max_tokens: values.max_tokens,
        top_p: values.top_p,
        frequency_penalty: values.frequency_penalty,
        presence_penalty: values.presence_penalty,
      };

      // 调用重放API
      const response = await APIService.replayRecord(record.id, replayRequest);
      
      if (response.success) {
        message.success('重放请求执行成功');
        onSuccess();
      } else {
        message.error(response.message || '重放失败');
      }
    } catch (error) {
      console.error('Replay error:', error);
      message.error('重放请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ReloadOutlined />
          <span>重放请求</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          icon={<ReloadOutlined />}
        >
          执行重放
        </Button>,
      ]}
    >
      {record && (
        <div>
          {/* 原始记录信息 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>原始记录信息：</Text>
              </div>
              <div>
                <Text type="secondary">会话ID: </Text>
                <Text code>{record.session_id}</Text>
              </div>
              <div>
                <Text type="secondary">轮次: </Text>
                <Text code>#{record.turn_number}</Text>
              </div>
              <div>
                <Text type="secondary">状态: </Text>
                <Text code>{record.status}</Text>
              </div>
              {record.error_msg && (
                <Alert
                  message="原始请求包含错误"
                  description={record.error_msg}
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>

          <Divider />

          {/* 重放配置 */}
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="选择Provider"
                  name="provider"
                  rules={[{ required: true, message: '请选择Provider' }]}
                >
                  <Select 
                    placeholder="选择要使用的Provider"
                    onChange={(value) => setSelectedProvider(value)}
                  >
                    {providers && providers.length > 0
                      ? providers
                          .filter(p => p.enabled)
                          .map(provider => (
                            <Option key={provider.type} value={provider.type}>
                              {provider.name}
                            </Option>
                          ))
                      : null}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="选择模型"
                  name="model"
                  rules={[{ required: true, message: '请选择模型' }]}
                >
                  <Select
                    placeholder="选择模型"
                    disabled={!selectedProvider}
                    allowClear
                  >
                    {availableModels.map(model => (
                      <Option key={model.model} value={model.model}>
                        {model.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 模型参数配置 */}
            <Collapse 
              ghost 
              size="small" 
              style={{ marginBottom: 16 }}
              defaultActiveKey={['1']}
            >
              <Panel 
                header={
                  <Space>
                    <SettingOutlined />
                    <span>模型参数配置</span>
                  </Space>
                } 
                key="1"
                extra={
                  <Button 
                    size="small" 
                    type="link" 
                    onClick={(e) => {
                      e.stopPropagation();
                      applyDefaultConfig();
                    }}
                  >
                    应用默认配置
                  </Button>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="温度 (Temperature)"
                      name="temperature"
                      tooltip="控制输出的随机性，值越高越随机，值越低越确定"
                    >
                      <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        marks={{
                          0: '0',
                          0.5: '0.5',
                          1: '1.0',
                          1.5: '1.5',
                          2: '2.0'
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="最大Token数"
                      name="max_tokens"
                      tooltip="限制生成的最大token数量"
                    >
                      <InputNumber
                        min={1}
                        max={8192}
                        style={{ width: '100%' }}
                        placeholder="2048"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Top P"
                      name="top_p"
                      tooltip="控制词汇选择的多样性"
                    >
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        marks={{
                          0: '0',
                          0.3: '0.3',
                          0.7: '0.7',
                          1: '1.0'
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="频率惩罚"
                      name="frequency_penalty"
                      tooltip="减少重复内容的生成"
                    >
                      <Slider
                        min={-2}
                        max={2}
                        step={0.1}
                        marks={{
                          '-2': '-2',
                          '-1': '-1',
                          0: '0',
                          1: '1',
                          2: '2'
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="存在惩罚"
                      name="presence_penalty"
                      tooltip="鼓励模型谈论新话题"
                    >
                      <Slider
                        min={-2}
                        max={2}
                        step={0.1}
                        marks={{
                          '-2': '-2',
                          '-1': '-1',
                          0: '0',
                          1: '1',
                          2: '2'
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>
            </Collapse>

            <Form.Item
              label={
                <Space>
                  <span>请求数据</span>
                  <Space size="small">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={copyOriginalRequest}
                    >
                      {copied ? <CheckCircleOutlined /> : '复制原始'}
                    </Button>
                    <Button
                      size="small"
                      onClick={resetToOriginal}
                    >
                      重置
                    </Button>
                    <Button
                      size="small"
                      icon={<CodeOutlined />}
                      onClick={formatJSON}
                    >
                      格式化
                    </Button>
                  </Space>
                </Space>
              }
              name="request"
              rules={[
                { required: true, message: '请输入请求数据' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    try {
                      JSON.parse(value);
                      return Promise.resolve();
                    } catch (error) {
                      return Promise.reject(new Error('JSON格式错误'));
                    }
                  },
                },
              ]}
            >
              <TextArea
                rows={12}
                placeholder="请输入JSON格式的请求数据..."
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          </Form>

          {/* 提示信息 */}
          <Alert
            message="重放说明"
            description={
              <div>
                <p>• 重放功能会使用您修改后的请求数据重新调用指定的Provider API</p>
                <p>• 新的响应结果会被保存为新的记录</p>
                <p>• 请确保请求数据格式正确，包含必要的字段（如messages等）</p>
                <p>• 模型参数会自动应用到请求中，覆盖原始请求中的参数</p>
                <p>• 建议在修改前先复制原始请求作为参考</p>
                <p>• 请确保选择的Provider已正确配置API密钥</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在执行重放请求...</Text>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReplayModal;
