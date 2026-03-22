/**
 * WebSocket Server - Unified entry point
 * Serves /ws/beike/, /ws/rbp/, /ws/beikeEW/   on port 8081
 *
 * Run with: npx tsx scripts/ws-beike-server.ts
 */

import { WebSocketServer, WebSocket } from "ws";
import { generateBeikeData, generateRBPData, generateScoresData } from "./ws-mock-data";

// ============== Beike (Monitor) Data ==============
const BEIKE_SAMPLE_RATE = 60;
const BEIKE_INTERVAL = 1000 / BEIKE_SAMPLE_RATE;

interface BeikeClient {
  ws: WebSocket;
  uuid?: string;
  channelNum?: number;
}

const beikeClients = new Map<WebSocket, BeikeClient>();
let beikeIntervalId: NodeJS.Timeout | null = null;

function startBeikeBroadcasting() {
  if (beikeIntervalId) return;

  beikeIntervalId = setInterval(() => {
    const data = generateBeikeData();
    const message = JSON.stringify(data);

    beikeClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }, BEIKE_INTERVAL);

  console.log(`[WS Beike] Broadcasting at ${BEIKE_SAMPLE_RATE}Hz`);
}

function stopBeikeBroadcasting() {
  if (beikeIntervalId) {
    clearInterval(beikeIntervalId);
    beikeIntervalId = null;
    console.log("[WS Beike] Stopped broadcasting");
  }
}

// ============== RBP Data ==============
interface RBPClient {
  ws: WebSocket;
  uuid?: string;
}

const rbpClients = new Map<WebSocket, RBPClient>();
let rbpIntervalId: NodeJS.Timeout | null = null;
let rbpTimeoutId: NodeJS.Timeout | null = null;

function startRbpBroadcasting() {
  if (rbpIntervalId) return;

  rbpTimeoutId = setTimeout(() => {
    const sendRBP = () => {
      const data = generateRBPData();
      const message = JSON.stringify(data);

      rbpClients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      });
    };

    sendRBP();
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

// ============== Early Warning Data ==============
interface EarlyWarningClient {
  ws: WebSocket;
  uuid?: string;
  EEGWeight?: number;
  CBFWeight?: number;
  BOWeight?: number;
}

const earlyWarningClients = new Map<WebSocket, EarlyWarningClient>();
let earlyWarningIntervalId: NodeJS.Timeout | null = null;
let earlyWarningTimeoutId: NodeJS.Timeout | null = null;

function startEarlyWarningBroadcasting() {
  if (earlyWarningIntervalId) return;

  earlyWarningTimeoutId = setTimeout(() => {
    const sendScores = () => {
      const data = generateScoresData();
      const message = JSON.stringify(data);

      earlyWarningClients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      });
    };

    sendScores();
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
const PORT = 8081;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws: WebSocket, req) => {
  const path = req.url;

  if (path === "/ws/beike/") {
    console.log("[WS Beike] Client connected");
    beikeClients.set(ws, { ws });

    if (beikeClients.size === 1) {
      startBeikeBroadcasting();
    }

    ws.on("message", (data) => {
      try {
        const params = JSON.parse(data.toString());
        const client = beikeClients.get(ws);
        if (client) {
          client.uuid = params.uuid;
          client.channelNum = params.channel_num;
          console.log("[WS Beike] Received params:", params);
        }
      } catch (e) {
        console.error("[WS Beike] Failed to parse message:", e);
      }
    });

    ws.on("close", () => {
      console.log("[WS Beike] Client disconnected");
      beikeClients.delete(ws);
      if (beikeClients.size === 0) {
        stopBeikeBroadcasting();
      }
    });
  } else if (path === "/ws/rbp/") {
    console.log("[WS RBP] Client connected");
    rbpClients.set(ws, { ws });

    if (rbpClients.size === 1) {
      startRbpBroadcasting();
    }

    ws.on("message", (data) => {
      try {
        const params = JSON.parse(data.toString());
        const client = rbpClients.get(ws);
        if (client) {
          client.uuid = params.uuid;
          console.log("[WS RBP] Received params:", params);
        }
      } catch (e) {
        console.error("[WS RBP] Failed to parse message:", e);
      }
    });

    ws.on("close", () => {
      console.log("[WS RBP] Client disconnected");
      rbpClients.delete(ws);
      if (rbpClients.size === 0) {
        stopRbpBroadcasting();
      }
    });
  } else if (path === "/ws/beikeEW/") {
    console.log("[WS Early Warning] Client connected");
    earlyWarningClients.set(ws, { ws });

    if (earlyWarningClients.size === 1) {
      startEarlyWarningBroadcasting();
    }

    ws.on("message", (data) => {
      try {
        const params = JSON.parse(data.toString());
        const client = earlyWarningClients.get(ws);
        if (client) {
          client.uuid = params.uuid;
          client.EEGWeight = params.EEGWeight;
          client.CBFWeight = params.CBFWeight;
          client.BOWeight = params.BOWeight;
          console.log("[WS Early Warning] Received params:", params);
        }
      } catch (e) {
        console.error("[WS Early Warning] Failed to parse message:", e);
      }
    });

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

console.log(`[WS] Server running on ws://localhost:${PORT}`);
console.log("[WS] Endpoints: /ws/beike/, /ws/rbp/, /ws/beikeEW/ ");