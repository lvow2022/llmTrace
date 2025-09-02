import React from 'react';
import { Modal, Form, Input, message } from 'antd';

interface CreateDebugSessionModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: { name: string }) => void;
}

const CreateDebugSessionModal: React.FC<CreateDebugSessionModalProps> = ({
  visible,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
    } catch (error) {
      message.error('请检查输入信息');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="创建调试会话"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入调试会话名称' }]}
        >
          <Input placeholder="请输入调试会话名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDebugSessionModal;
