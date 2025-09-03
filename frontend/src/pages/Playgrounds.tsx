import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ArrowRight, Plus, Search, Trash2 } from 'lucide-react';  // 添加Trash2图标
import { useAppStore } from '../store';
import { playgroundsAPI } from '../services/api';
import { Playground } from '../types';  // 改为Playground类型
import Button from '../components/ui/Button';

const Playgrounds: React.FC = () => {
  const { playgrounds, setPlaygrounds, loading, setLoading, removePlayground } = useAppStore();  // 添加removePlayground
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlaygrounds, setFilteredPlaygrounds] = useState<Playground[]>([]);  // 改为Playground类型
  const [deletingPlaygroundId, setDeletingPlaygroundId] = useState<number | null>(null);  // 添加删除状态

  const fetchPlaygrounds = useCallback(async () => {
    try {
      setLoading('playgrounds', true);
      const data: any = await playgroundsAPI.getPlaygrounds();
      
      console.log('API返回的原始数据:', data); // 添加调试信息
      
      // 处理嵌套的数据结构
      let playgroundsArray: Playground[] = [];
      if (data && typeof data === 'object') {
        if (data.data && Array.isArray(data.data)) {
          // 直接结构：{ data: [...], total: 1, page: 1, size: 20, total_pages: 1 }
          playgroundsArray = data.data;
          console.log('使用直接结构，找到数据:', playgroundsArray.length, '条');
        } else if (data.data && typeof data.data === 'object' && 'data' in data.data) {
          // 嵌套结构：{ data: { data: [...], total: 1, page: 1, size: 20, total_pages: 1 } }
          playgroundsArray = data.data.data || [];
          console.log('使用嵌套结构，找到数据:', playgroundsArray.length, '条');
        } else if (Array.isArray(data)) {
          // 数组结构：直接是数据数组
          playgroundsArray = data;
          console.log('使用数组结构，找到数据:', playgroundsArray.length, '条');
        } else {
          console.warn('未知的数据结构:', data);
        }
      }
      
      if (Array.isArray(playgroundsArray)) {
        console.log('设置playgrounds数据:', playgroundsArray);
        setPlaygrounds(playgroundsArray);
      } else {
        console.error('API 返回的数据格式不正确:', data);
        setPlaygrounds([]);
      }
    } catch (error) {
      console.error('获取 Playground 列表失败:', error);
      setPlaygrounds([]);
    } finally {
      setLoading('playgrounds', false);
    }
  }, []); // 移除依赖，避免无限循环

  useEffect(() => {
    fetchPlaygrounds();
  }, []); // 只在组件挂载时调用一次

  useEffect(() => {
    // 确保 playgrounds 是数组，然后进行过滤
    if (Array.isArray(playgrounds)) {
      const filtered = playgrounds.filter(playground =>
        playground.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (playground.description && playground.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPlaygrounds(filtered);
    } else {
      // 如果 playgrounds 不是数组，设置为空数组
      console.warn('playgrounds 不是数组:', playgrounds);
      setFilteredPlaygrounds([]);
    }
  }, [playgrounds, searchTerm]);

  // 添加删除playground的函数
  const handleDeletePlayground = async (playgroundId: number) => {
    if (!window.confirm('确定要删除这个调试环境吗？删除后无法恢复。')) {
      return;
    }

    try {
      setDeletingPlaygroundId(playgroundId);
      await playgroundsAPI.deletePlayground(playgroundId);
      
      // 从本地状态中移除
      removePlayground(playgroundId);
      
      // 显示成功消息（可以添加一个toast通知）
      console.log('Playground删除成功');
    } catch (error) {
      console.error('删除Playground失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingPlaygroundId(null);
    }
  };

  const PlaygroundCard: React.FC<{ playground: Playground }> = ({ playground }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bug className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{playground.name}</h3>
              <p className="text-sm text-gray-500">
                {playground.description || '无描述'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">状态:</span>
              <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${
                playground.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {playground.status === 'active' ? '活跃' : '已完成'}
              </span>
            </div>
            <div>
              <span className="font-medium">创建时间:</span>
              <br />
              {new Date(playground.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">更新时间:</span>
              <br />
              {new Date(playground.updated_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">ID:</span>
              <br />
              {playground.id}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Link
            to={`/playground/${playground.id}`}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span>查看详情</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          
          <Link
            to={`/playground/${playground.id}`}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Bug className="w-4 h-4 mr-2" />
            开始调试
          </Link>
          
          {/* 添加删除按钮 */}
          <button
            onClick={() => handleDeletePlayground(playground.id)}
            disabled={deletingPlaygroundId === playground.id}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
              deletingPlaygroundId === playground.id
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {deletingPlaygroundId === playground.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">调试环境</h1>
        <p className="mt-2 text-sm text-gray-600">
          管理基于生产记录创建的调试环境
        </p>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">搜索调试环境</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="搜索调试环境名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              共 {filteredPlaygrounds.length} 个调试环境
            </span>
            <Button
              onClick={() => {/* 这里可以添加创建新 Playground 的功能 */}}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建调试环境
            </Button>
          </div>
        </div>
      </div>

      {/* 调试环境列表 */}
      <div>
        {loading.playgrounds ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载调试环境中...</p>
          </div>
        ) : filteredPlaygrounds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredPlaygrounds.map((playground) => (
              <PlaygroundCard key={playground.id} playground={playground} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bug className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? '没有找到匹配的调试环境' : '暂无调试环境'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '尝试调整搜索条件' : '从生产记录创建第一个调试环境'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  to="/sessions"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  浏览会话记录
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Playgrounds;
