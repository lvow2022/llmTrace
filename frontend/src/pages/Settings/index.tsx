import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Space,
  Divider,
  Alert,
  message,
  Row,
  Col,
  InputNumber,
  Slider
} from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined,
  ReloadOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SkinOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../stores';
import { APIService } from '../../services/api';
import { ProviderInfo, ReplayConfig } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const { theme } = useAppStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<{ name: string; model: string; enabled: boolean }[]>([]);

  // 获取providers列表
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await APIService.getProviders();
        if (response.success && response.data) {
          setProviders(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
        message.error('获取Provider列表失败');
      }
    };

    fetchProviders();
  }, []);

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

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // 保存设置到localStorage
      localStorage.setItem('llmtrace-settings', JSON.stringify(values));
      
      // 保存重放配置
      const replayConfig: ReplayConfig = {
        provider: values.replayProvider || '',
        model: values.replayModel || '',
        temperature: values.temperature || 0.7,
        max_tokens: values.max_tokens || 2048,
        top_p: values.top_p || 1.0,
        frequency_penalty: values.frequency_penalty || 0.0,
        presence_penalty: values.presence_penalty || 0.0,
      };
      localStorage.setItem('llmtrace-replay-config', JSON.stringify(replayConfig));
      
      message.success('设置保存成功');
    } catch (error) {
      message.error('设置保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedProvider('');
    message.info('设置已重置');
  };

  // 加载保存的设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('llmtrace-settings');
      const savedReplayConfig = localStorage.getItem('llmtrace-replay-config');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        form.setFieldsValue(settings);
        setSelectedProvider(settings.replayProvider || '');
      }
      
      if (savedReplayConfig) {
        const replayConfig = JSON.parse(savedReplayConfig);
        form.setFieldsValue(replayConfig);
        setSelectedProvider(replayConfig.provider || '');
      }
    } catch (error) {
      console.error('Failed to load saved settings:', error);
    }
  }, [form]);

  return (
    <div>
      <Title level={2}>
        <SettingOutlined /> 系统设置
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
          theme: theme,
          pageSize: 20,
          autoRefresh: false,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        }}
      >
        {/* API配置 */}
        <Card title={<><ApiOutlined /> API配置</>} style={{ marginBottom: 16 }}>
          <Form.Item
            label="API基础URL"
            name="apiBaseUrl"
            rules={[{ required: true, message: '请输入API基础URL' }]}
          >
            <Input placeholder="http://localhost:8080/api" />
          </Form.Item>
          
          <Alert
            message="API配置说明"
            description="请确保API服务器正在运行，并且URL配置正确。修改后需要重启应用才能生效。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* 重放配置 */}
        <Card title={<><RobotOutlined /> 重放配置</>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="默认Provider"
                name="replayProvider"
              >
                                 <Select
                   placeholder="选择Provider"
                   onChange={(value) => setSelectedProvider(value)}
                   allowClear
                 >
                   {providers && providers.length > 0
                     ? providers
                         .filter(provider => provider.enabled)
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
                label="默认模型"
                name="replayModel"
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

          <Divider orientation="left">模型参数</Divider>
          
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

          <Alert
            message="重放配置说明"
            description="这些设置将作为重放记录时的默认参数。您可以在重放时覆盖这些设置。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* 界面设置 */}
        <Card title={<><SkinOutlined /> 界面设置</>} style={{ marginBottom: 16 }}>
          <Form.Item
            label="主题模式"
            name="theme"
          >
            <Select>
              <Option value="light">浅色主题</Option>
              <Option value="dark">深色主题</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="默认分页大小"
            name="pageSize"
          >
            <Select>
              <Option value={10}>10条/页</Option>
              <Option value={20}>20条/页</Option>
              <Option value={50}>50条/页</Option>
              <Option value={100}>100条/页</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="自动刷新"
            name="autoRefresh"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        {/* 数据设置 */}
        <Card title={<><DatabaseOutlined /> 数据设置</>} style={{ marginBottom: 16 }}>
          <Form.Item
            label="数据保留时间"
            name="dataRetention"
          >
            <Select>
              <Option value={7}>7天</Option>
              <Option value={30}>30天</Option>
              <Option value={90}>90天</Option>
              <Option value={365}>1年</Option>
              <Option value={0}>永久保留</Option>
            </Select>
          </Form.Item>

          <Alert
            message="数据管理"
            description="定期清理过期数据可以节省存储空间。建议根据实际需求设置合适的保留时间。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* 操作按钮 */}
        <Card>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
            >
              保存设置
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置设置
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default Settings;
