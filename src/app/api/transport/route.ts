import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        licensePlate: "asc",
      },
    });

    // We can resolve drivers and projects names dynamically to avoid prisma relation complexities
    const drivers = await prisma.user.findMany({
      where: { role: "DRIVER" },
      select: { id: true, name: true }
    });

    const projects = await prisma.project.findMany({
      select: { id: true, name: true, projectCode: true }
    });

    const enrichedVehicles = vehicles.map((v) => {
      const driver = drivers.find((d) => d.id === v.driverId);
      const project = projects.find((p) => p.id === v.projectId);

      return {
        ...v,
        driverName: driver ? driver.name : null,
        projectName: project ? project.name : null,
        projectCode: project ? project.projectCode : null,
      };
    });

    return NextResponse.json({ success: true, vehicles: enrichedVehicles });
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, licensePlate, status, driverId, projectId, departureTime, returnTime } = body;

    if (!name || !licensePlate) {
      return NextResponse.json({ error: "Missing required fields: name and licensePlate" }, { status: 400 });
    }

    // Check if license plate is unique
    const existing = await prisma.vehicle.findUnique({
      where: { licensePlate }
    });
    if (existing) {
      return NextResponse.json({ error: `License plate '${licensePlate}' is already registered` }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        licensePlate,
        status: status || "AVAILABLE",
        driverId: driverId || null,
        projectId: projectId || null,
        departureTime: departureTime ? new Date(departureTime) : null,
        returnTime: returnTime ? new Date(returnTime) : null,
      },
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
