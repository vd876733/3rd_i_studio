import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const startStr = url.searchParams.get("start");
    const endStr = url.searchParams.get("end");

    // Fetch all staff users (Stylist, Packer, Driver, Admin)
    const staff = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Build date filter if provided
    let whereClause = {};
    if (startStr && endStr) {
      whereClause = {
        date: {
          gte: new Date(startStr),
          lte: new Date(endStr),
        },
      };
    }

    const availabilities = await prisma.staffAvailability.findMany({
      where: whereClause,
      orderBy: {
        date: "asc",
      },
    });

    // Query projects to automatically infer "ON_SITE" status for crew members assigned to active projects
    const activeProjects = await prisma.project.findMany({
      where: {
        status: "ON_SITE",
      },
      select: {
        id: true,
        name: true,
        projectCode: true,
        shootDate: true,
        leadStylistId: true,
        leadPackerId: true,
        leadDriverId: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      staff, 
      availabilities,
      activeProjects 
    });
  } catch (error: any) {
    console.error("Error fetching staff availabilities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, status, notes } = body;

    if (!userId || !date || !status) {
      return NextResponse.json({ error: "Missing required fields: userId, date, and status" }, { status: 400 });
    }

    // Set time to midnight UTC to ensure date comparisons match correctly
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const availability = await prisma.staffAvailability.upsert({
      where: {
        userId_date: {
          userId,
          date: parsedDate,
        },
      },
      update: {
        status,
        notes: notes || null,
      },
      create: {
        userId,
        date: parsedDate,
        status,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, availability });
  } catch (error: any) {
    console.error("Error updating staff availability:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
