import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { CreatePlaygroundRequest } from '../../../types';

interface CreatePlaygroundModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CreatePlaygroundRequest) => void;
}

const CreatePlaygroundModal: React.FC<CreatePlaygroundModalProps> = ({
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
      title="创建Playground"
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
          rules={[{ required: true, message: '请输入Playground名称' }]}
        >
          <Input placeholder="请输入Playground名称" />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea
            placeholder="请输入Playground描述（可选）"
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreatePlaygroundModal;
