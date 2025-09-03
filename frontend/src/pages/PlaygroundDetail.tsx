import React from 'react';
import { useParams } from 'react-router-dom';

const PlaygroundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">调试环境详情</h1>
        <p className="mt-2 text-sm text-gray-600">Playground ID: {id}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Playground 详情页面开发中...</p>
      </div>
    </div>
  );
};

export default PlaygroundDetail;
