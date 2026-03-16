/**
 * WebSocket Server for /ws/beike and /ws/rbp
 * Simulates the monitor data stream (EEG, DLK, YLDL) at 60Hz
 * Simulates RBP data at 15s interval
 * 
 * Run with: npx tsx scripts/ws-beike-server.ts
 */

import { WebSocketServer, WebSocket } from "ws";

// ============== Beike (Monitor) Data ==============
const SAMPLE_RATE = 60;
const INTERVAL = 1000 / SAMPLE_RATE;

function generateMockData() {
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

// ============== RBP Data ==============
function generateMockRBPData() {
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

// ============== Early Warning (Scores) Data ==============
function generateMockScoresData() {
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

// ============== Beike Clients ==============
const beikeClients = new Set<WebSocket>();
let beikeIntervalId: NodeJS.Timeout | null = null;

function startBeikeBroadcasting() {
  if (beikeIntervalId) return;
  
  beikeIntervalId = setInterval(() => {
    const data = generateMockData();
    const message = JSON.stringify(data);
    
    beikeClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, INTERVAL);
  
  console.log(`[WS Beike] Broadcasting at ${SAMPLE_RATE}Hz`);
}

function stopBeikeBroadcasting() {
  if (beikeIntervalId) {
    clearInterval(beikeIntervalId);
    beikeIntervalId = null;
    console.log("[WS Beike] Stopped broadcasting");
  }
}

// ============== RBP Clients ==============
const rbpClients = new Set<WebSocket>();
let rbpIntervalId: NodeJS.Timeout | null = null;
let rbpTimeoutId: NodeJS.Timeout | null = null;

function startRbpBroadcasting() {
  if (rbpIntervalId) return;

  // Initial delay 15s, then send every 15s
  rbpTimeoutId = setTimeout(() => {
    const sendRBP = () => {
      const data = generateMockRBPData();
      const message = JSON.stringify(data);
      
      rbpClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    };

    // Send first data after 15s
    sendRBP();

    // Then send every 15s
    rbpIntervalId = setInterval(sendRBP, 15000);
    console.log("[WS RBP] Broadcasting at 15s interval");
  }, 15000);
}

function stopRbpBroadcasting() {
  if (rbpTimeoutId) {
    clearTimeout(rbpTimeoutId);
    rbpTimeoutId = null;
  }
  if (rbpIntervalId) {
    clearInterval(rbpIntervalId);
    rbpIntervalId = null;
    console.log("[WS RBP] Stopped broadcasting");
  }
}

// ============== Early Warning Clients ==============
const earlyWarningClients = new Set<WebSocket>();
let earlyWarningIntervalId: NodeJS.Timeout | null = null;
let earlyWarningTimeoutId: NodeJS.Timeout | null = null;

function startEarlyWarningBroadcasting() {
  if (earlyWarningIntervalId) return;

  // Initial delay 15s, then send every 15s
  earlyWarningTimeoutId = setTimeout(() => {
    const sendScores = () => {
      const data = generateMockScoresData();
      const message = JSON.stringify(data);
      
      earlyWarningClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    };

    // Send first data after 15s
    sendScores();

    // Then send every 15s
    earlyWarningIntervalId = setInterval(sendScores, 15000);
    console.log("[WS Early Warning] Broadcasting at 15s interval");
  }, 15000);
}

function stopEarlyWarningBroadcasting() {
  if (earlyWarningTimeoutId) {
    clearTimeout(earlyWarningTimeoutId);
    earlyWarningTimeoutId = null;
  }
  if (earlyWarningIntervalId) {
    clearInterval(earlyWarningIntervalId);
    earlyWarningIntervalId = null;
    console.log("[WS Early Warning] Stopped broadcasting");
  }
}

// ============== WebSocket Server ==============
const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", (ws: WebSocket, req) => {
  const path = req.url;

  if (path === "/ws/beike") {
    console.log("[WS Beike] Client connected");
    beikeClients.add(ws);
    
    if (beikeClients.size === 1) {
      startBeikeBroadcasting();
    }

    ws.on("close", () => {
      console.log("[WS Beike] Client disconnected");
      beikeClients.delete(ws);
      if (beikeClients.size === 0) {
        stopBeikeBroadcasting();
      }
    });
  } else if (path === "/ws/rbp") {
    console.log("[WS RBP] Client connected");
    rbpClients.add(ws);
    
    if (rbpClients.size === 1) {
      startRbpBroadcasting();
    }

    ws.on("close", () => {
      console.log("[WS RBP] Client disconnected");
      rbpClients.delete(ws);
      if (rbpClients.size === 0) {
        stopRbpBroadcasting();
      }
    });
  } else if (path === "/ws/early_warning") {
    console.log("[WS Early Warning] Client connected");
    earlyWarningClients.add(ws);
    
    if (earlyWarningClients.size === 1) {
      startEarlyWarningBroadcasting();
    }

    ws.on("close", () => {
      console.log("[WS Early Warning] Client disconnected");
      earlyWarningClients.delete(ws);
      if (earlyWarningClients.size === 0) {
        stopEarlyWarningBroadcasting();
      }
    });
  } else {
    console.log(`[WS] Unknown path: ${path}, closing`);
    ws.close();
  }

  ws.on("error", (error) => {
    console.error("[WS] WebSocket error:", error);
  });
});

console.log("[WS] Server running on ws://localhost:8081");
console.log("[WS] Endpoints: /ws/beike, /ws/rbp, /ws/early_warning");