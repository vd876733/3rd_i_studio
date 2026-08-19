"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createInventoryItem(data: {
  name: string;
  category: string;
  rackNumber: string;
  shelfNumber: string;
  replacementCost: number;
  sku: string;
  barcode: string;
  photos: string[];
}) {
  try {
    // Write item directly to Neon
    await prisma.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category,
        rackNumber: data.rackNumber || "Rack A1",
        shelfNumber: data.shelfNumber || "Shelf 1",
        currentStatus: "AVAILABLE",
        replacementCost: Number(data.replacementCost) || 0,
        sku: data.sku,
        barcode: data.barcode,
        photos: data.photos,
      },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create inventory item:", error);
    return { success: false, error: error.message || "Failed to create item." };
  }
}

export async function updateInventoryItem(
  id: string,
  data: {
    name: string;
    category: string;
    rackNumber: string;
    shelfNumber: string;
    replacementCost: number;
    sku: string;
    barcode: string;
    photos: string[];
    currentStatus?: string;
  }
) {
  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        rackNumber: data.rackNumber,
        shelfNumber: data.shelfNumber,
        replacementCost: Number(data.replacementCost) || 0,
        sku: data.sku,
        barcode: data.barcode,
        photos: data.photos,
        currentStatus: (data.currentStatus as any) || undefined,
      },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update inventory item:", error);
    return { success: false, error: error.message || "Failed to update item." };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await prisma.inventoryItem.delete({
      where: { id },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete inventory item:", error);
    return { success: false, error: error.message || "Failed to delete item." };
  }
}
