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
    const { boxNumber } = body;

    if (!boxNumber) {
      return NextResponse.json({ error: "boxNumber is required" }, { status: 400 });
    }

    const box = await prisma.box.create({
      data: {
        boxNumber,
        projectId,
      },
    });

    return NextResponse.json(box);
  } catch (error: any) {
    console.error("Error in Box creation API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
