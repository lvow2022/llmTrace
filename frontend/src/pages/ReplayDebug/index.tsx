import React, { useEffect, useState } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Space, 
  Button, 
  message, 
  Spin,
  Row,
  Col,
  Divider,
  Alert,
  Breadcrumb
} from 'antd';
import { 
  ArrowLeftOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useReplaySessionStore } from '../../stores';
import { ReplaySession, ReplayRecord } from '../../types';
import DebugChat from './components/DebugChat';
import DebugInput from './components/DebugInput';
import DebugConfig from './components/DebugConfig';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const ReplayDebug: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentReplaySession,
    replayRecords,
    loading,
    fetchReplaySessionRecords,
    setCurrentReplaySession,
    replayDebug,
  } = useReplaySessionStore();

  const [currentTurnNumber, setCurrentTurnNumber] = useState(1);
  const [debugConfig, setDebugConfig] = useState({
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });

  useEffect(() => {
    if (id) {
      // 获取调试会话信息和记录
      fetchReplaySessionRecords(id);
      // 设置当前调试会话
      setCurrentReplaySession({
        id: id,
        name: '调试会话',
        original_session_id: '',
        start_turn_number: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }, [id, fetchReplaySessionRecords, setCurrentReplaySession]);

  // 处理发送调试消息
  const handleSendMessage = async (messageText: string) => {
    if (!id || !currentReplaySession) {
      message.error('调试会话信息不完整');
      return;
    }

    try {
      // 构建请求数据
      const requestData = {
        model: debugConfig.model,
        messages: [
          {
            role: 'user',
            content: messageText,
          },
        ],
        temperature: debugConfig.temperature,
        max_tokens: debugConfig.max_tokens,
        top_p: debugConfig.top_p,
        frequency_penalty: debugConfig.frequency_penalty,
        presence_penalty: debugConfig.presence_penalty,
      };

      // 发送调试请求
      await replayDebug({
        replay_session_id: id,
        turn_number: currentTurnNumber,
        request: requestData,
        provider: debugConfig.provider,
        model: debugConfig.model,
        config: debugConfig,
      });

      // 增加轮次号
      setCurrentTurnNumber(currentTurnNumber + 1);
      
      message.success('调试消息发送成功');
    } catch (error) {
      console.error('Debug message error:', error);
      message.error('发送调试消息失败');
    }
  };

  // 处理配置变化
  const handleConfigChange = (newConfig: any) => {
    setDebugConfig(newConfig);
  };

  // 返回调试会话列表
  const handleBack = () => {
    navigate('/replay-sessions');
  };

  if (loading && !currentReplaySession) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载调试会话...</Text>
        </div>
      </div>
    );
  }

  if (!currentReplaySession) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert
          message="调试会话不存在"
          description="请检查调试会话ID是否正确"
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={handleBack}>
              返回调试会话列表
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <Layout style={{ height: 'calc(100vh - 120px)', margin: '-24px' }}>
      {/* 头部信息 */}
      <div style={{ 
        padding: '16px 24px', 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Breadcrumb style={{ marginBottom: 8 }}>
            <Breadcrumb.Item>
              <Button type="link" onClick={handleBack} style={{ padding: 0 }}>
                <ArrowLeftOutlined /> 调试会话
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{currentReplaySession.name}</Breadcrumb.Item>
          </Breadcrumb>
          <Title level={4} style={{ margin: 0 }}>
            <PlayCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {currentReplaySession.name}
          </Title>
        </div>
        <Space>
          <Text type="secondary">
            基于会话: {currentReplaySession.original_session_id}
          </Text>
          <Text type="secondary">
            开始轮次: {currentReplaySession.start_turn_number}
          </Text>
          <Text type="secondary">
            状态: {currentReplaySession.status === 'active' ? '进行中' : '已完成'}
          </Text>
        </Space>
      </div>

      <Layout>
        {/* 左侧：调试聊天区域 */}
        <Content style={{ padding: '16px', background: '#f5f5f5' }}>
          <Card
            title={
              <Space>
                <MessageOutlined />
                <span>调试对话</span>
              </Space>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            {/* 聊天记录区域 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <DebugChat 
                records={replayRecords} 
                loading={loading}
                currentTurnNumber={currentTurnNumber}
              />
            </div>
            
            <Divider style={{ margin: '0 16px' }} />
            
            {/* 输入区域 */}
            <div style={{ padding: '16px' }}>
              <DebugInput 
                onSend={handleSendMessage}
                loading={loading}
                currentTurnNumber={currentTurnNumber}
              />
            </div>
          </Card>
        </Content>

        {/* 右侧：调试配置区域 */}
        <Sider width={300} style={{ background: '#fff', padding: '16px' }}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                <span>调试配置</span>
              </Space>
            }
            size="small"
          >
            <DebugConfig 
              config={debugConfig}
              onConfigChange={handleConfigChange}
            />
          </Card>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default ReplayDebug;
