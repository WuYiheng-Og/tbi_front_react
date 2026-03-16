import { useEffect, useRef, useCallback } from "react";

interface DataBuffer {
  get(key: string): number[] | undefined;
  set(key: string, value: number[]): void;
  has(key: string): boolean;
}

export function useDataStream(
  isRunning: boolean,
  dataBuffer: DataBuffer,
  onDataReceived: () => void,
  uuid?: string,
  channelNum?: number
) {
  const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log("Connecting to WebSocket...");
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/beike`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      // 发送连接参数
      if (uuid && channelNum) {
        ws.send(JSON.stringify({ uuid, channel_num: channelNum }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        onDataReceived();

        if (data.eeg) {
          Object.entries(data.eeg).forEach(([key, value]) => {
            if (!dataBuffer.has(key)) {
              dataBuffer.set(key, []);
            }
            dataBuffer.get(key)?.push(value as number);
          });
        }

        if (data.yldl) {
          if (data.yldl["rSO2-1"] !== undefined)
            dataBuffer.get("rSO2-1")?.push(data.yldl["rSO2-1"]);
          if (data.yldl["rSO2-2"] !== undefined)
            dataBuffer.get("rSO2-2")?.push(data.yldl["rSO2-2"]);
        }

        if (data.dlk) {
          dataBuffer.get("one-1")?.push(data.dlk);
          dataBuffer.get("two-1")?.push(data.dlk);
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

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log("Closing WebSocket...");
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning || !uuid) {
      disconnect();
      return;
    }

    const channels = ["eeg", "rSO2-1", "rSO2-2", "one-1", "two-1"];
    channels.forEach((key) => dataBuffer.set(key, []));

    connect();

    return () => {
      disconnect();
    };
  }, [isRunning, dataBuffer, connect, disconnect, uuid]);
}