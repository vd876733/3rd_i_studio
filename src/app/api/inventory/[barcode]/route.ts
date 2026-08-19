import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { barcode },
      include: {
        packedItems: {
          include: {
            box: true,
          },
          orderBy: {
            scannedAt: "desc"
          },
          take: 1
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Extract current assigned box if any
    const latestPackedRelation = item.packedItems[0];
    const currentBox = latestPackedRelation?.box;

    return NextResponse.json({
      id: item.id,
      sku: item.sku,
      barcode: item.barcode,
      name: item.name,
      category: item.category,
      rackNumber: item.rackNumber,
      shelfNumber: item.shelfNumber,
      currentStatus: item.currentStatus,
      replacementCost: item.replacementCost,
      photos: item.photos,
      boxNumber: currentBox ? currentBox.boxNumber : null,
      boxId: currentBox ? currentBox.id : null,
    });
  } catch (error: any) {
    console.error("Error in barcode lookup API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
