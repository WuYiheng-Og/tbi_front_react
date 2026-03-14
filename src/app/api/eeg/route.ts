import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function generateMockEEGData() {
  const time = Date.now() / 1000;
  return {
    eeg: {
      EEGData_F3_Ref: Math.sin(time * 2) * 50 + Math.random() * 10,
      EEGData_F4_Ref: Math.sin(time * 2.5 + 0.5) * 50 + Math.random() * 10,
      EEGData_P3_Ref: Math.sin(time * 1.8 + 1) * 40 + Math.random() * 8,
      EEGData_P4_Ref: Math.sin(time * 2.2 + 1.5) * 40 + Math.random() * 8,
    },
  };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const interval = 1000 / 60;

      const sendData = () => {
        const data = generateMockEEGData();
        const sseData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
      };

      sendData();

      const timer = setInterval(sendData, interval);

      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
