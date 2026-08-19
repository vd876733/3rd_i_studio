import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      projectCode, 
      clientId, 
      shootDate, 
      reportingTime, 
      status, 
      leadStylistId, 
      leadPackerId, 
      leadDriverId 
    } = body;

    if (!name || !projectCode || !clientId || !shootDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if projectCode is unique
    const existing = await prisma.project.findUnique({
      where: { projectCode }
    });
    if (existing) {
      return NextResponse.json({ error: `Project code '${projectCode}' is already in use` }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        projectCode,
        status: status || "INQUIRY",
        shootDate: new Date(shootDate),
        reportingTime: reportingTime || null,
        clientId,
        leadStylistId: leadStylistId || null,
        leadPackerId: leadPackerId || null,
        leadDriverId: leadDriverId || null,
      },
    });

    // Write audit log using the first admin/stylist user
    let logUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!logUser) logUser = await prisma.user.findFirst();

    if (logUser) {
      await prisma.auditLog.create({
        data: {
          userId: logUser.id,
          action: "PROJECT_CREATED",
          entityType: "Project",
          newValue: `Created project '${name}' (${projectCode}) with shoot date ${new Date(shootDate).toLocaleDateString()}`,
        },
      });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
