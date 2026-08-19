import React from "react";
import { PrismaClient } from "@prisma/client";
import InventoryClient from "./InventoryClient";
import { Package } from "lucide-react";

const prisma = new PrismaClient();

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: {
      sku: "asc",
    },
  });

  // Convert schema properties to match client component interfaces safely
  const formattedItems = items.map((item) => ({
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
  }));

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-cyan-500" />
          <span>Inventory DB</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Browse, lookup and filter your visual props repository by SKU code and location indices.
        </p>
      </div>

      <InventoryClient initialItems={formattedItems} />
    </div>
  );
}
