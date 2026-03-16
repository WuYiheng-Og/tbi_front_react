/**
 * Mock Data Generators for WebSocket Servers
 * Shared utilities for generating simulated medical monitoring data
 */

export function generateBeikeData() {
  const time = Date.now() / 1000;

  return {
    eeg: {
      EEGData_F3_Ref: Math.sin(time * 2) * 50 + Math.random() * 10 - 5,
      EEGData_F4_Ref: Math.sin(time * 2.5 + 0.5) * 50 + Math.random() * 10 - 5,
      EEGData_P3_Ref: Math.sin(time * 1.8 + 1) * 40 + Math.random() * 8 - 4,
      EEGData_P4_Ref: Math.sin(time * 2.2 + 1.5) * 40 + Math.random() * 8 - 4,
    },
    dlk: {
      "one-1_Peak_U": 60 + Math.sin(time * 1.5) * 10 + Math.random() * 5,
      "one-1_Dias_U": 20 + Math.sin(time * 1.2) * 5 + Math.random() * 3,
      "one-1_Mean_U": 40 + Math.sin(time * 1.4) * 8 + Math.random() * 4,
      "one-1_Env_U": 55 + Math.sin(time * 1.6) * 10 + Math.random() * 5,
      "one-1_PI_U": 0.8 + Math.sin(time * 0.8) * 0.2 + Math.random() * 0.1,
      "one-1_RI_U": 0.6 + Math.sin(time * 0.9) * 0.15 + Math.random() * 0.08,
      "one-1_S/D_U": 2.5 + Math.sin(time * 1.1) * 0.3 + Math.random() * 0.15,
      "two-1_Peak_U": 58 + Math.sin(time * 1.4 + 0.3) * 10 + Math.random() * 5,
      "two-1_Dias_U": 19 + Math.sin(time * 1.3 + 0.2) * 5 + Math.random() * 3,
      "two-1_Mean_U": 38 + Math.sin(time * 1.5 + 0.4) * 8 + Math.random() * 4,
      "two-1_Env_U": 52 + Math.sin(time * 1.7 + 0.5) * 10 + Math.random() * 5,
      "two-1_PI_U": 0.75 + Math.sin(time * 0.85 + 0.1) * 0.2 + Math.random() * 0.1,
      "two-1_RI_U": 0.55 + Math.sin(time * 0.95 + 0.15) * 0.15 + Math.random() * 0.08,
      "two-1_S/D_U": 2.4 + Math.sin(time * 1.05 + 0.2) * 0.3 + Math.random() * 0.15,
    },
    yldl: {
      "rSO2-1": 65 + Math.sin(time * 0.5) * 10 + Math.random() * 3,
      "rSO2-2": 63 + Math.sin(time * 0.6 + 0.2) * 10 + Math.random() * 3,
    },
  };
}

export function generateRBPData() {
  const now = Date.now();
  const startTimestamp = now - 15000;
  const endTimestamp = now;

  const generateArray = () => {
    return Array.from({ length: 6 }, () => Math.random() * 100);
  };

  return {
    data: {
      hasData: true,
      date: [startTimestamp, endTimestamp],
      RBPData_F3_Ref: generateArray(),
      RBPData_P3_Ref: generateArray(),
      RBPData_F4_Ref: generateArray(),
      RBPData_P4_Ref: generateArray(),
    },
  };
}

export function generateScoresData() {
  const now = Date.now();

  return {
    data: {
      time: [now - 15000, now] as [number, number],
      ngl: parseFloat((Math.random() * 40 + 60).toFixed(2)),
      dlk: parseFloat((Math.random() * 40 + 60).toFixed(2)),
      yldl: parseFloat((Math.random() * 40 + 60).toFixed(2)),
      sum: parseFloat((Math.random() * 40 + 60).toFixed(2)),
      deep_learning_num1: Math.floor(Math.random() * 100),
      deep_learning_num0: Math.floor(Math.random() * 100),
      xgb_num1: Math.floor(Math.random() * 100),
      xgb_num0: Math.floor(Math.random() * 100),
      total_score_new: parseFloat((Math.random() * 40 + 60).toFixed(2)),
    },
  };
}