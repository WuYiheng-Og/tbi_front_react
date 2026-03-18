import { useMemo } from "react";

export type DataPoint = {
  value: number;
  timestamp: number;
};

export function useDataBuffer(): Map<string, DataPoint[]> {
  return useMemo(() => new Map<string, DataPoint[]>(), []);
}
