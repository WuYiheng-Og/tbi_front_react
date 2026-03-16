import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout | null = null;
      let isFirst = true;

      const sendData = () => {
        try {
          const now = Date.now();
          const mockData = {
            hasData: !isFirst,
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
          };

          const message = `data: ${JSON.stringify({ data: mockData })}\n\n`;
          controller.enqueue(encoder.encode(message));

          if (isFirst) {
            isFirst = false;
          }
        } catch {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      };

      // 首次立即发送数据
      sendData();

      // 之后每15秒推送一次
      intervalId = setInterval(sendData, 15000);

      // 清理函数
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    },
    cancel() {
      // 客户端断开连接时清理
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
