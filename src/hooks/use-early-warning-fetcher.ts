import { useEffect, useRef, useState, useCallback } from "react";

export interface Scores {
  ngl: number;
  dlk: number;
  yldl: number;
  total_score_new: number;
  time?: [number, number];
  deep_learning_num1?: number;
  deep_learning_num0?: number;
  xgb_num1?: number;
  xgb_num0?: number;
}

interface UseEarlyWarningResult {
  scores: Scores;
  hasFirstData: boolean;
  setOnDataReceived: (callback: (() => void) | null) => void;
}

interface EarlyWarningParams {
  uuid?: string;
  EEGWeight?: number;
  CBFWeight?: number;
  BOWeight?: number;
}

export function useEarlyWarningFetcher(isRunning: boolean, params?: EarlyWarningParams) {
  const [scores, setScores] = useState<Scores>({
    ngl: 0,
    dlk: 0,
    yldl: 0,
    total_score_new: 0,
    time: undefined,
    deep_learning_num1: 0,
    deep_learning_num0: 0,
    xgb_num1: 0,
    xgb_num0: 0,
  });

  const [hasFirstData, setHasFirstData] = useState(false);
  const onDataReceivedRef = useRef<(() => void) | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasFirstDataRef = useRef(false);

  const setOnDataReceived = useCallback((callback: (() => void) | null) => {
    onDataReceivedRef.current = callback;
  }, []);

  useEffect(() => {
    if (!isRunning || !params?.uuid) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      hasFirstDataRef.current = false;
      return;
    }

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      console.log("[EarlyWarning] Connecting to WebSocket...");
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/early_warning/`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[EarlyWarning] WebSocket connected");
        // 发送连接参数
        if (params?.uuid) {
          ws.send(JSON.stringify({
            uuid: params.uuid,
            EEGWeight: params.EEGWeight ?? 5,
            CBFWeight: params.CBFWeight ?? 3,
            BOWeight: params.BOWeight ?? 2,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          if (json.time) {
            if (!hasFirstDataRef.current) {
              hasFirstDataRef.current = true;
              setHasFirstData(true);
              onDataReceivedRef.current?.();
            }

            const newScores: Scores = {
              ngl: typeof json.ngl === "number" ? json.ngl : 0,
              dlk: typeof json.dlk === "number" ? json.dlk : 0,
              yldl: typeof json.yldl === "number" ? json.yldl : 0,
              total_score_new: typeof json.total_score_new === "number" ? json.total_score_new : 0,
              time: json.time,
              deep_learning_num1: json.deep_learning_num1 ?? 0,
              deep_learning_num0: json.deep_learning_num0 ?? 0,
              xgb_num1: json.xgb_num1 ?? 0,
              xgb_num0: json.xgb_num0 ?? 0,
            };
            setScores(newScores);
          }
        } catch (err) {
          console.error("Failed to parse EarlyWarning WebSocket data:", err);
        }
      };

      ws.onerror = () => {
        console.log("[EarlyWarning] WebSocket error");
      };

      ws.onclose = () => {
        console.log("[EarlyWarning] WebSocket disconnected");
        wsRef.current = null;
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isRunning, setOnDataReceived, params]);

  return { scores, hasFirstData, setOnDataReceived };
}
