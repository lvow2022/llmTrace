import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Space, 
  Typography,
  Tooltip
} from 'antd';
import { 
  SendOutlined,
  EnterOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface DebugInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  currentTurnNumber: number;
}

const DebugInput: React.FC<DebugInputProps> = ({
  onSend,
  loading,
  currentTurnNumber,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      return;
    }
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          轮次 {currentTurnNumber} • 输入调试消息
        </Text>
      </div>
      
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="请输入调试消息..."
          autoSize={{ minRows: 2, maxRows: 6 }}
          disabled={loading}
          style={{ resize: 'none' }}
        />
        <Tooltip title="发送消息 (Enter)">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!message.trim()}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </Tooltip>
      </Space.Compact>
      
      <div style={{ marginTop: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <EnterOutlined /> Enter 发送 • Shift + Enter 换行
        </Text>
      </div>
    </div>
  );
};

export default DebugInput;
