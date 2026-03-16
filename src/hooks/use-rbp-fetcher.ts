import { useEffect, useState } from "react";

export function useRBPFetcher(isRunning: boolean) {
  const [rbpData, setRbpData] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const fetchRBP = async () => {
      try {
        const res = await fetch("/api/rbp");
        const json = await res.json();
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
        console.error("Failed to fetch RBP data:", err);
      }
    };

    const timeoutId = setTimeout(fetchRBP, 15000);
    const interval = setInterval(fetchRBP, 15000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [isRunning]);

  return rbpData;
}
