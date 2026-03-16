/**
 * WebSocket Server for /ws/beike
 * Simulates the monitor data stream (EEG, DLK, YLDL) at 60Hz
 * 
 * Run with: npx tsx scripts/ws-beike-server.ts
 */

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

const clients = new Set<any>();
let intervalId: NodeJS.Timeout | null = null;

function startBroadcasting() {
  if (intervalId) return;
  
  intervalId = setInterval(() => {
    const data = generateMockData();
    const message = JSON.stringify(data);
    
    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }, INTERVAL);
  
  console.log(`[WS Beike] Broadcasting at ${SAMPLE_RATE}Hz`);
}

function stopBroadcasting() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[WS Beike] Stopped broadcasting");
  }
}

import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", (ws: WebSocket) => {
  console.log("[WS Beike] Client connected");
  clients.add(ws);
  
  // Start broadcasting when first client connects
  if (clients.size === 1) {
    startBroadcasting();
  }

  ws.on("close", () => {
    console.log("[WS Beike] Client disconnected");
    clients.delete(ws);
    
    // Stop broadcasting when no clients remain
    if (clients.size === 0) {
      stopBroadcasting();
    }
  });

  ws.on("error", (error) => {
    console.error("[WS Beike] WebSocket error:", error);
  });
});

console.log("[WS Beike] Server running on ws://localhost:8081/ws/beike");