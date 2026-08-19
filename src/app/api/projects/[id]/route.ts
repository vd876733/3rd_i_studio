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
    const { 
      name, 
      projectCode, 
      clientId, 
      shootDate, 
      reportingTime, 
      status, 
      leadStylistId, 
      leadPackerId, 
      leadDriverId,
      warehouseChecklist,
      siteChecklist
    } = body;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        projectCode: projectCode !== undefined ? projectCode : undefined,
        clientId: clientId !== undefined ? clientId : undefined,
        status: status !== undefined ? status : undefined,
        shootDate: shootDate !== undefined ? new Date(shootDate) : undefined,
        reportingTime: reportingTime !== undefined ? (reportingTime || null) : undefined,
        leadStylistId: leadStylistId !== undefined ? (leadStylistId || null) : undefined,
        leadPackerId: leadPackerId !== undefined ? (leadPackerId || null) : undefined,
        leadDriverId: leadDriverId !== undefined ? (leadDriverId || null) : undefined,
        warehouseChecklist: warehouseChecklist !== undefined ? warehouseChecklist : undefined,
        siteChecklist: siteChecklist !== undefined ? siteChecklist : undefined,
      } as any,
    });

    // Write audit log
    let logUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!logUser) logUser = await prisma.user.findFirst();

    if (logUser) {
      await prisma.auditLog.create({
        data: {
          userId: logUser.id,
          action: "PROJECT_UPDATED",
          entityType: "Project",
          newValue: `Updated details for project '${updatedProject.name}' (${updatedProject.projectCode})`,
        },
      });
    }

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
