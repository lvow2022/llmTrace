import React, { useState } from 'react';
import { 
  Descriptions, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Button,
  Tabs,
  Alert,
  Divider
} from 'antd';
import { 
  CopyOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { Record } from '../../../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface RecordDetailProps {
  record: Record;
}

const RecordDetail: React.FC<RecordDetailProps> = ({ record }) => {
  const [copied, setCopied] = useState<string>('');

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 格式化JSON
  const formatJSON = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const config = {
      success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
      error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '错误' },
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: '处理中' },
    };
    return config[status as keyof typeof config];
  };

  const statusConfig = getStatusConfig(record.status);

  // 解析请求数据
  const parseRequest = () => {
    try {
      return JSON.parse(record.request);
    } catch {
      return null;
    }
  };

  // 解析响应数据
  const parseResponse = () => {
    try {
      return JSON.parse(record.response);
    } catch {
      return null;
    }
  };

  const requestData = parseRequest();
  const responseData = parseResponse();

  return (
    <div>
      {/* 基本信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="记录ID">
            <Text code>{record.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="会话ID">
            <Text code>{record.session_id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="轮次">
            <Tag color="blue">#{record.turn_number}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Space>
              {statusConfig.icon}
              <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(record.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
          {record.error_msg && (
            <Descriptions.Item label="错误信息" span={2}>
              <Alert
                message={record.error_msg}
                type="error"
                showIcon
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 详细内容 */}
      <Tabs defaultActiveKey="request" type="card">
        <TabPane tab="请求信息" key="request">
          <Card size="small">
            <Space style={{ marginBottom: 16 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(record.request, 'request')}
              >
                {copied === 'request' ? '已复制' : '复制'}
              </Button>
              <Button
                size="small"
                icon={<CodeOutlined />}
                onClick={() => copyToClipboard(formatJSON(record.request), 'request')}
              >
                复制格式化
              </Button>
            </Space>
            
            {requestData ? (
              <div>
                <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="模型">
                    <Text code>{requestData.model || '未知'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="温度">
                    {requestData.temperature || '默认'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最大Token">
                    {requestData.max_tokens || '默认'}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider orientation="left">消息内容</Divider>
                {requestData.messages?.map((msg: any, index: number) => (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ marginBottom: 8 }}
                    title={`${msg.role} (${index + 1})`}
                  >
                    <pre style={{ 
                      fontSize: '12px', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {msg.content}
                    </pre>
                  </Card>
                ))}
              </div>
            ) : (
              <pre style={{ 
                fontSize: '12px', 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {record.request}
              </pre>
            )}
          </Card>
        </TabPane>

        <TabPane tab="响应信息" key="response">
          <Card size="small">
            <Space style={{ marginBottom: 16 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(record.response, 'response')}
              >
                {copied === 'response' ? '已复制' : '复制'}
              </Button>
              <Button
                size="small"
                icon={<CodeOutlined />}
                onClick={() => copyToClipboard(formatJSON(record.response), 'response')}
              >
                复制格式化
              </Button>
            </Space>
            
            {responseData ? (
              <div>
                <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="模型">
                    <Text code>{responseData.model || '未知'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="使用Token">
                    {responseData.usage?.total_tokens || '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="完成原因">
                    {responseData.choices?.[0]?.finish_reason || '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="响应时间">
                    {responseData.choices?.[0]?.index || '0'}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider orientation="left">响应内容</Divider>
                {responseData.choices?.map((choice: any, index: number) => (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ marginBottom: 8 }}
                    title={`选择 ${index + 1}`}
                  >
                    <pre style={{ 
                      fontSize: '12px', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      {choice.message?.content}
                    </pre>
                  </Card>
                ))}
              </div>
            ) : (
              <pre style={{ 
                fontSize: '12px', 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {record.response || '无响应数据'}
              </pre>
            )}
          </Card>
        </TabPane>

        {record.metadata && (
          <TabPane tab="元数据" key="metadata">
            <Card size="small">
              <Space style={{ marginBottom: 16 }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(record.metadata, 'metadata')}
                >
                  {copied === 'metadata' ? '已复制' : '复制'}
                </Button>
                <Button
                  size="small"
                  icon={<CodeOutlined />}
                  onClick={() => copyToClipboard(formatJSON(record.metadata), 'metadata')}
                >
                  复制格式化
                </Button>
              </Space>
              
              <pre style={{ 
                fontSize: '12px', 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {formatJSON(record.metadata)}
              </pre>
            </Card>
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default RecordDetail;
