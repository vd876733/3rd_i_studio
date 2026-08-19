import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { moodBoardState } = body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        moodBoardState,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Error saving moodboard state:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
