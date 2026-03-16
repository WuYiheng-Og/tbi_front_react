import { useEffect, useRef, useState } from "react";

export function useRBPFetcher(isRunning: boolean) {
  const [rbpData, setRbpData] = useState<Record<string, number[]>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      console.log("[RBP] Connecting to WebSocket...");
      const ws = new WebSocket("ws://localhost:8081/ws/rbp");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[RBP] WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          if (json.data && json.data.hasData) {
            const mapping: Record<string, string> = {
              "RBPData_F3_Ref": "EEGData_F3_Ref",
              "RBPData_P3_Ref": "EEGData_P3_Ref",
              "RBPData_F4_Ref": "EEGData_F4_Ref",
              "RBPData_P4_Ref": "EEGData_P4_Ref",
            };

            const mappedData: Record<string, number[]> = {};
            Object.entries(mapping).forEach(([rbpKey, eegKey]) => {
              if (json.data[rbpKey]) {
                mappedData[eegKey] = json.data[rbpKey].slice(0, 4);
              }
            });
            setRbpData(mappedData);
          }
        } catch (err) {
          console.error("Failed to parse RBP WebSocket data:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[RBP] WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("[RBP] WebSocket disconnected");
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
  }, [isRunning]);

  return rbpData;
}