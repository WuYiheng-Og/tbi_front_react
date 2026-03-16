import { useEffect } from "react";

interface DataBuffer {
  get(key: string): number[] | undefined;
  set(key: string, value: number[]): void;
  has(key: string): boolean;
}

export function useDataStream(
  isRunning: boolean,
  dataBuffer: DataBuffer,
  onDataReceived: () => void
) {
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const channels = ["eeg", "rSO2-1", "rSO2-2", "one-1", "two-1"];
    channels.forEach((key) => dataBuffer.set(key, []));

    console.log("Starting data stream...");
    const es = new EventSource("/api/monitor");

    es.onmessage = (event) => {
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
        console.error("Failed to parse SSE data:", err);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      es.close();
    };

    return () => {
      console.log("Closing data stream...");
      es.close();
    };
  }, [isRunning, dataBuffer, onDataReceived]);
}
