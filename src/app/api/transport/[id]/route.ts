import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, licensePlate, status, driverId, projectId, departureTime, returnTime } = body;

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!existingVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Check license plate uniqueness if it's changing
    if (licensePlate && licensePlate !== existingVehicle.licensePlate) {
      const plateConflict = await prisma.vehicle.findUnique({
        where: { licensePlate }
      });
      if (plateConflict) {
        return NextResponse.json({ error: `License plate '${licensePlate}' is already registered` }, { status: 400 });
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        licensePlate: licensePlate !== undefined ? licensePlate : undefined,
        status: status !== undefined ? status : undefined,
        driverId: driverId !== undefined ? (driverId || null) : undefined,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
        departureTime: departureTime !== undefined ? (departureTime ? new Date(departureTime) : null) : undefined,
        returnTime: returnTime !== undefined ? (returnTime ? new Date(returnTime) : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, vehicle: updatedVehicle });
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!existingVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
