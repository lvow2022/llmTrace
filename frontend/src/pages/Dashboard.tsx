import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  FileText,
  Bug,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useAppStore } from "../store";
import { getSessions, getPlaygrounds } from "../services/api";

const Dashboard: React.FC = () => {
  const {
    sessions,
    playgrounds,
    setSessions,
    setPlaygrounds,
    loading,
    setLoading,
  } = useAppStore();

  const [stats, setStats] = useState({
    totalSessions: 0,
    totalRecords: 0,
    totalPlaygrounds: 0,
    activePlaygrounds: 0,
    recentErrors: 0,
    successRate: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading("sessions", true);
      setLoading("playgrounds", true);

      const [sessionsResponse, playgroundsResponse] = await Promise.all([
        getSessions(),
        getPlaygrounds(),
      ]);

      const sessionsArray = sessionsResponse?.data || [];
      const playgroundsArray = playgroundsResponse?.data || [];

      setSessions(sessionsArray);
      setPlaygrounds(playgroundsArray);

      // 计算统计数据
      const activePlaygrounds = playgroundsArray.filter(
        (p) => p.status === "active"
      ).length;
      setStats({
        totalSessions: sessionsArray.length,
        totalRecords: 0, // 这里需要从后端获取总记录数
        totalPlaygrounds: playgroundsArray.length,
        activePlaygrounds,
        recentErrors: 0, // 这里需要从后端获取错误统计
        successRate: 95, // 这里需要从后端获取成功率
      });
    } catch (error) {
      console.error("获取仪表盘数据失败:", error);
      // 设置默认值
      setSessions([]);
      setPlaygrounds([]);
    } finally {
      setLoading("sessions", false);
      setLoading("playgrounds", false);
    }
  }, [setLoading, setSessions, setPlaygrounds]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon: Icon, color, link }: any) => (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {link && (
        <Link
          to={link}
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          查看详情 →
        </Link>
      )}
    </div>
  );

  const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    link,
    color,
  }: any) => (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-300">
        <div className={`p-3 rounded-lg ${color} w-fit`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
        <p className="mt-2 text-sm text-gray-600">
          监控 LLM 调用状态，管理调试环境
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3   gap-8">
        <StatCard
          title="总会话数"
          value={stats.totalSessions}
          icon={MessageSquare}
          color="bg-blue-500"
          link="/sessions"
        />

        <StatCard
          title="调试环境"
          value={stats.totalPlaygrounds}
          icon={Bug}
          color="bg-purple-500"
          link="/playgrounds"
        />
        <StatCard
          title="成功率"
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <QuickActionCard
            title="查看会话"
            description="浏览所有生产环境会话和记录"
            icon={MessageSquare}
            link="/sessions"
            color="bg-blue-500"
          />
          <QuickActionCard
            title="创建调试"
            description="基于现有记录创建新的调试环境"
            icon={Bug}
            link="/playgrounds"
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近会话 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">最近会話</h3>
          </div>
          <div className="p-6">
            {loading.sessions ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : Array.isArray(sessions) && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    to={`/sessions/${session.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">暂无会话数据</p>
            )}
            {Array.isArray(sessions) && sessions.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to="/sessions"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  查看全部会话 →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 最近 Playground */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">最近调试环境</h3>
          </div>
          <div className="p-6">
            {loading.playgrounds ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : Array.isArray(playgrounds) && playgrounds.length > 0 ? (
              <div className="space-y-3">
                {playgrounds.slice(0, 5).map((playground) => (
                  <Link
                    key={playground.id}
                    to={`/playground/${playground.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {playground.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {playground.description
                          ? playground.description.substring(0, 50) + "..."
                          : "无描述"}{" "}
                        |{new Date(playground.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Bug className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">暂无调试环境</p>
            )}
            {Array.isArray(playgrounds) && playgrounds.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to="/playgrounds"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  查看全部调试环境 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
