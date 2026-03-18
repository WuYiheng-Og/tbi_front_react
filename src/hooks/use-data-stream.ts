import { useEffect, useRef, useCallback } from "react";

// 数据点类型：包含值和时间戳
export type DataPoint = {
  value: number;
  timestamp: number;
};

interface DataBuffer {
  get(key: string): DataPoint[] | undefined;
  set(key: string, value: DataPoint[]): void;
  has(key: string): boolean;
}

export function useDataStream(
  isRunning: boolean,// 核心开关：是否启动数据接收（true=连，false=断）
  dataBuffer: DataBuffer,// 数据缓存容器：存 EEG/血氧/dlk 原始数据
  onDataReceived: () => void,// 回调函数：每次收到数据后触发（比如通知组件更新视图）
  uuid?: string,// 可选：设备/用户唯一标识（传给后端区分连接）
  channelNum?: number// 可选：通道数（传给后端指定数据通道）
) {

  // 用 useRef 保存 WebSocket 实例，原因：
  // 1. ref 的值变化不会触发组件重渲染；
  // 2. 组件重新渲染时，ref 能保留上一次的 WebSocket 实例（不会重复创建）；
  // 3. 可以在任意函数里访问/修改这个实例（比如 connect/disconnect 里）
  const wsRef = useRef<WebSocket | null>(null);

    // 2 连接函数
    const connect = useCallback(() => {
      // 第一步：判断是否已有活跃连接，有则直接返回（避免重复连接）
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    // 第二步：创建新连接
    console.log("Connecting to WebSocket...");
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/beike/`);
    wsRef.current = ws;
    // 第三步：设置连接成功回调
    ws.onopen = () => {
      console.log("WebSocket connected");
      // 发送连接参数
      if (uuid && channelNum) {
        ws.send(JSON.stringify({ uuid, channel_num: channelNum }));
      }
    };

    // 第四步：监听 WebSocket 消息事件（核心：处理后端推送的数据）
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data).data; 
        // 第五步：触发外部回调：通知组件「新数据到了」（比如更新图表）
        onDataReceived();

        // 第六步：处理 EEG 数据（WebSocket key -> buffer key 映射）
        const eegKeyMap: Record<string, string> = {
          'EEGData_F3_Ref': 'eeg_1',
          'EEGData_F4_Ref': 'eeg_2',
          'EEGData_P3_Ref': 'eeg_3',
          'EEGData_P4_Ref': 'eeg_4',
        };
        // 第七步：处理 EEG 数据（WebSocket key -> buffer key 映射）
        // 优先使用后端返回的 time 字段，否则降级使用前端时间
        const timestamp = data.eeg?.time || data.yldl?.time || data.dlk?.time || performance.now();
        if (data.eeg) {
          Object.entries(data.eeg).forEach(([wsKey, value]) => {
            if (wsKey === 'time') return; // 跳过 time 字段
            const bufferKey = eegKeyMap[wsKey] || wsKey;
            if (!dataBuffer.has(bufferKey)) {
              dataBuffer.set(bufferKey, []);
            }
            dataBuffer.get(bufferKey)?.push({ value: value as number, timestamp });
          });
        }

        if (data.yldl) {
          if (data.yldl["rSO2-1"] !== undefined)
            dataBuffer.get("rSO2-1")?.push({ value: data.yldl["rSO2-1"], timestamp });
          if (data.yldl["rSO2-2"] !== undefined)
            dataBuffer.get("rSO2-2")?.push({ value: data.yldl["rSO2-2"], timestamp });
        }

        if (data.dlk) {
          // dlk 数据是对象，包含多个字段 (Peak_U, Mean_U, Env_U 等)
          // 需要保留对象结构，只添加 timestamp
          const dlkData = { ...data.dlk, timestamp };
          dataBuffer.get("one-1")?.push(dlkData);
          dataBuffer.get("two-1")?.push(dlkData);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket data:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      wsRef.current = null;
    };
  }, [dataBuffer, onDataReceived, uuid, channelNum]);

  // 3 断开函数
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log("Closing WebSocket...");
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 4 副作用控制：根据 isRunning 自动连/断
  useEffect(() => {
    if (!isRunning || !uuid) {
      disconnect();
      return;
    }

    // 初始化数据缓存（清空之前的数据，避免脏数据）
    const channels = ["eeg", "rSO2-1", "rSO2-2", "one-1", "two-1"];
    channels.forEach((key) => dataBuffer.set(key, []));

    connect();

    return () => {
      disconnect();
    };
  }, [isRunning, dataBuffer, connect, disconnect, uuid]);
}