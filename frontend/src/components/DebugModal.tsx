import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { playgroundsAPI, recordsAPI } from "../services/api";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any; // 使用 any 类型避免类型冲突
}

const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose, record }) => {
  const navigate = useNavigate();
  const { playgrounds, setPlaygrounds, addPlayground } = useAppStore();

  const [selectedPlaygroundId, setSelectedPlaygroundId] = useState<
    number | null
  >(null);
  const [newPlaygroundName, setNewPlaygroundName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchPlaygrounds = useCallback(async () => {
    try {
      setLoading(true);
      const data: any = await playgroundsAPI.getPlaygrounds();

      console.log("DebugModal: API返回的原始数据:", data); // 添加调试信息

      // 处理嵌套的数据结构
      let playgroundsArray: any[] = [];
      if (data && typeof data === "object") {
        if (data.data && Array.isArray(data.data)) {
          // 直接结构：{ data: [...], total: 1, page: 1, size: 20, total_pages: 1 }
          playgroundsArray = data.data;
          console.log(
            "DebugModal: 使用直接结构，找到数据:",
            playgroundsArray.length,
            "条"
          );
        } else if (
          data.data &&
          typeof data.data === "object" &&
          "data" in data.data
        ) {
          // 嵌套结构：{ data: { data: [...], total: 1, page: 1, size: 20, total_pages: 1 } }
          playgroundsArray = data.data.data || [];
          console.log(
            "DebugModal: 使用嵌套结构，找到数据:",
            playgroundsArray.length,
            "条"
          );
        } else if (Array.isArray(data)) {
          // 数组结构：直接是数据数组
          playgroundsArray = data;
          console.log(
            "DebugModal: 使用数组结构，找到数据:",
            playgroundsArray.length,
            "条"
          );
        } else {
          console.warn("DebugModal: 未知的数据结构:", data);
        }
      }

      if (Array.isArray(playgroundsArray)) {
        console.log("DebugModal: 设置playgrounds数据:", playgroundsArray);
        setPlaygrounds(playgroundsArray);
      } else {
        console.error("DebugModal: API 返回的数据格式不正确:", data);
        setPlaygrounds([]);
      }
    } catch (err) {
      console.error("DebugModal: 获取 Playground 列表失败:", err);
      setError("获取 Playground 列表失败");
    } finally {
      setLoading(false);
    }
  }, [setPlaygrounds]);

  useEffect(() => {
    if (isOpen) {
      fetchPlaygrounds();
      // 自动生成 Playground 名称
      setNewPlaygroundName(
        `调试_${record.session_id}_轮次${record.turn_number}`
      );
    }
  }, [isOpen, record, fetchPlaygrounds]);

  const handleStartDebug = async () => {
    if (!selectedPlaygroundId) return;

    try {
      setLoading(true);
      setError("");

      // 获取 Playground 详情，查看是否已有调试会话
      const res = await playgroundsAPI.getPlaygroundSessions(
        selectedPlaygroundId
      );

      console.log(res);

      // const sessions = res.data.sessions;

      let sessionId = res.data?.playground?.id;
      if (!sessionId) {
        // 创建新的调试会话
        const debugSession = await recordsAPI.createDebugSessionFromRecord(
          record.id.toString(),
          {
            playground_id: selectedPlaygroundId,
            name: `调试会话_${record.turn_number}`,
          }
        );
        sessionId = debugSession.id;
      }

      if (sessionId) {
        onClose();
        // 跳转到选中的 Playground 的调试会话
        navigate(`/playground/${selectedPlaygroundId}`);
      }
    } catch (err) {
      console.error("开始调试失败:", err);
      setError("开始调试失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndStart = async () => {
    try {
      setLoading(true);
      setError("");

      // 创建新的 Playground
      const newPlayground = await playgroundsAPI.createPlayground({ 
        name: newPlaygroundName,
        description: `基于会话 ${record.session_id} 轮次 ${record.turn_number} 创建的调试环境`,
      });

      // 添加到本地状态
      addPlayground(newPlayground);

      // 从记录创建调试会话
      const debugSession = await recordsAPI.createDebugSessionFromRecord(
        record.id.toString(),
        {
          playground_id: newPlayground.id,
          name: `调试会话_${record.turn_number}`,
        }
      );

      onClose();
      // 跳转到新创建的 Playground 的调试会话
      navigate(`/playground/${newPlayground.id}`);
    } catch (err) {
      console.error("创建 Playground 失败:", err);
      setError("创建 Playground 失败");
    } finally {
      setLoading(false);
    }
  };

  // 过滤可用的 Playground（现在不需要按会话过滤，因为 Playground 是通用的）
  const availablePlaygrounds = playgrounds.filter((p) => p.status === "active");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="选择调试环境" size="lg">
      <div className="space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 选择现有 Playground */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            选择现有 Playground
          </h4>

          {/* 添加调试信息 */}
          <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <div>调试信息:</div>
            <div>Store中playgrounds数量: {playgrounds.length}</div>
            <div>可用playgrounds数量: {availablePlaygrounds.length}</div>
            <div>Loading状态: {loading ? "是" : "否"}</div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : availablePlaygrounds.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {availablePlaygrounds.map((playground) => (
                <label
                  key={playground.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name="playground"
                    value={playground.id}
                    checked={selectedPlaygroundId === playground.id}
                    onChange={(e) =>
                      setSelectedPlaygroundId(parseInt(e.target.value))
                    }
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {playground.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {playground.description && `${playground.description} | `}
                      状态: {playground.status} | 创建时间:{" "}
                      {new Date(playground.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
              暂无可用的 Playground
            </div>
          )}

          {availablePlaygrounds.length > 0 && (
            <Button
              onClick={handleStartDebug}
              disabled={!selectedPlaygroundId || loading}
              className="mt-3 w-full"
            >
              在选中 Playground 中开始调试
            </Button>
          )}
        </div>

        {/* 分割线 */}
        <div className="border-t border-gray-200"></div>

        {/* 创建新 Playground */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            或创建新的 Playground
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Playground 名称
              </label>
              <input
                type="text"
                value={newPlaygroundName}
                onChange={(e) => setNewPlaygroundName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入 Playground 名称"
              />
            </div>

            <div className="text-sm text-gray-500">
              将基于当前记录创建新的调试环境
            </div>

            <Button
              onClick={handleCreateAndStart}
              disabled={!newPlaygroundName.trim() || loading}
              className="w-full"
            >
              创建新 Playground 并开始调试
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DebugModal;
