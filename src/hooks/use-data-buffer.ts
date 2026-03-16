import { useMemo } from "react";

export function useDataBuffer() {
  return useMemo(() => new Map<string, any[]>(), []);
}
