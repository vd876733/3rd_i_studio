import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    // Simply read the request stream to simulate receiving the binary stream payload
    await request.arrayBuffer();
    return NextResponse.json({ success: true, message: "Sandbox file upload simulation successful." });
  } catch (err: any) {
    console.error("Sandbox upload error:", err);
    return NextResponse.json({ error: "Failed to parse simulation upload" }, { status: 500 });
  }
}
