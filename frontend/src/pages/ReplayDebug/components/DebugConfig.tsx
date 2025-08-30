import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Slider, 
  InputNumber, 
  Space, 
  Typography,
  Card,
  Divider,
  Button,
  message
} from 'antd';
import { 
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { APIService } from '../../../services/api';
import { ProviderInfo } from '../../../types';

const { Option } = Select;
const { Text } = Typography;

interface DebugConfigProps {
  config: any;
  onConfigChange: (config: any) => void;
}

const DebugConfig: React.FC<DebugConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const [form] = Form.useForm();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    form.setFieldsValue(config);
  }, [config, form]);

  // 获取可用的providers
  const fetchProviders = async () => {
    try {
      const response = await APIService.getProviders();
      if (response.success && response.data) {
        setProviders(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  // 处理配置变化
  const handleConfigChange = (changedValues: any, allValues: any) => {
    onConfigChange(allValues);
  };

  // 保存配置到本地存储
  const handleSaveConfig = () => {
    try {
      localStorage.setItem('llmtrace-debug-config', JSON.stringify(config));
      message.success('配置已保存到本地');
    } catch (error) {
      message.error('保存配置失败');
    }
  };

  // 加载默认配置
  const handleLoadDefaultConfig = () => {
    try {
      const savedConfig = localStorage.getItem('llmtrace-debug-config');
      if (savedConfig) {
        const defaultConfig = JSON.parse(savedConfig);
        form.setFieldsValue(defaultConfig);
        onConfigChange(defaultConfig);
        message.success('已加载默认配置');
      } else {
        message.info('未找到默认配置');
      }
    } catch (error) {
      message.error('加载默认配置失败');
    }
  };

  // 获取当前provider的模型列表
  const getCurrentProviderModels = () => {
    const currentProvider = providers.find(p => p.name === config.provider);
    return currentProvider?.models || [];
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            size="small"
            icon={<SaveOutlined />}
            onClick={handleSaveConfig}
          >
            保存配置
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleLoadDefaultConfig}
          >
            加载默认
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="small"
        onValuesChange={handleConfigChange}
        initialValues={config}
      >
        {/* Provider选择 */}
        <Form.Item
          label="Provider"
          name="provider"
          rules={[{ required: true, message: '请选择Provider' }]}
        >
          <Select placeholder="选择Provider">
            {providers.map(provider => (
              <Option key={provider.name} value={provider.name}>
                {provider.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 模型选择 */}
        <Form.Item
          label="模型"
          name="model"
          rules={[{ required: true, message: '请选择模型' }]}
        >
          <Select placeholder="选择模型">
            {getCurrentProviderModels().map(model => (
              <Option key={model.model} value={model.model}>
                {model.name} ({model.model})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        {/* 温度设置 */}
        <Form.Item
          label={
            <Space>
              <Text>温度 (Temperature)</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                控制输出的随机性，0-2
              </Text>
            </Space>
          }
          name="temperature"
        >
          <Slider
            min={0}
            max={2}
            step={0.1}
            marks={{
              0: '0',
              0.5: '0.5',
              1: '1',
              1.5: '1.5',
              2: '2'
            }}
          />
        </Form.Item>

        {/* 最大Token数 */}
        <Form.Item
          label={
            <Space>
              <Text>最大Token数</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                控制响应的最大长度
              </Text>
            </Space>
          }
          name="max_tokens"
        >
          <InputNumber
            min={1}
            max={4096}
            style={{ width: '100%' }}
            placeholder="输入最大Token数"
          />
        </Form.Item>

        {/* Top-P */}
        <Form.Item
          label={
            <Space>
              <Text>Top-P</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                控制词汇选择的多样性，0-1
              </Text>
            </Space>
          }
          name="top_p"
        >
          <Slider
            min={0}
            max={1}
            step={0.1}
            marks={{
              0: '0',
              0.5: '0.5',
              1: '1'
            }}
          />
        </Form.Item>

        {/* 频率惩罚 */}
        <Form.Item
          label={
            <Space>
              <Text>频率惩罚 (Frequency Penalty)</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                减少重复词汇的使用，-2到2
              </Text>
            </Space>
          }
          name="frequency_penalty"
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

        {/* 存在惩罚 */}
        <Form.Item
          label={
            <Space>
              <Text>存在惩罚 (Presence Penalty)</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                减少新话题的引入，-2到2
              </Text>
            </Space>
          }
          name="presence_penalty"
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
      </Form>

      {/* 配置说明 */}
      <Card size="small" style={{ marginTop: '16px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>配置说明：</strong><br />
          • 温度越高，输出越随机<br />
          • Top-P越低，词汇选择越保守<br />
          • 频率惩罚减少重复内容<br />
          • 存在惩罚减少新话题引入
        </Text>
      </Card>
    </div>
  );
};

export default DebugConfig;
