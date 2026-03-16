import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function generateMockRBPData() {
  const now = Date.now();
  const startTimestamp = now;
  const endTimestamp = now + 15000;

  const generateArray = () => {
    return Array.from({ length: 6 }, () => Math.random() * 100);
  };

  return {
    data: {
      date: [startTimestamp, endTimestamp],
      RBPData_F3_Ref: generateArray(),
      RBPData_P3_Ref: generateArray(),
      RBPData_F4_Ref: generateArray(),
      RBPData_P4_Ref: generateArray(),
    },
  };
}

export async function GET(req: NextRequest) {
  const data = generateMockRBPData();
  return Response.json(data);
}
