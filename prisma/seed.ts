import { PrismaClient, Role, ProjectStatus, InventoryStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing database records...");
  await prisma.auditLog.deleteMany({});
  await prisma.projectPackedItem.deleteMany({});
  await prisma.box.deleteMany({});
  await prisma.siteDetails.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding Users...");
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@stylingos.com",
      role: Role.ADMIN,
      passwordHash: "$2b$10$xyzAdminHashedPasswordGoesHere",
    },
  });

  const stylist = await prisma.user.create({
    data: {
      name: "Sarah Stylist",
      email: "sarah@stylingos.com",
      role: Role.STYLIST,
      passwordHash: "$2b$10$xyzStylistHashedPasswordGoesHere",
    },
  });

  const packer = await prisma.user.create({
    data: {
      name: "Paul Packer",
      email: "packer@stylingos.com",
      role: Role.PACKER,
      passwordHash: "$2b$10$xyzPackerHashedPasswordGoesHere",
    },
  });

  const driver = await prisma.user.create({
    data: {
      name: "Dan Driver",
      email: "driver@stylingos.com",
      role: Role.DRIVER,
      passwordHash: "$2b$10$xyzDriverHashedPasswordGoesHere",
    },
  });

  console.log("Seeding Clients...");
  const client1 = await prisma.client.create({
    data: {
      name: "Acme Studio Corp",
      email: "contact@acmestudios.com",
      contactNumbers: "+1-555-0199",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Vogue Interior Design",
      email: "design@vogueinteriors.com",
      contactNumbers: "+1-555-0244",
    },
  });

  console.log("Seeding 20 Inventory Items...");
  const categories = ["Furniture", "Lighting", "Decor", "Tableware", "Textiles"];
  const racks = ["A1", "A2", "B1", "B2", "C1"];
  const shelves = ["Shelf 1", "Shelf 2", "Shelf 3"];
  
  const itemsData = [
    { name: "Velvet Emerald Armchair", category: "Furniture", cost: 450.0 },
    { name: "Minimalist Brass Floor Lamp", category: "Lighting", cost: 180.0 },
    { name: "Ceramic Speckled Vase Set", category: "Decor", cost: 65.0 },
    { name: "Linen Beige Throw Pillow", category: "Textiles", cost: 40.0 },
    { name: "Marble Serving Platter", category: "Tableware", cost: 85.0 },
    { name: "Teak Wood Coffee Table", category: "Furniture", cost: 350.0 },
    { name: "Rattan Pendant Light", category: "Lighting", cost: 120.0 },
    { name: "Abstract Canvas Wall Art", category: "Decor", cost: 220.0 },
    { name: "Woolen Textured Rug 8x10", category: "Textiles", cost: 600.0 },
    { name: "Gold Plated Cutlery 24pc", category: "Tableware", cost: 150.0 },
    { name: "Leather Sling Accent Chair", category: "Furniture", cost: 550.0 },
    { name: "Industrial Edison Desk Lamp", category: "Lighting", cost: 95.0 },
    { name: "Terracotta Planter Trio", category: "Decor", cost: 45.0 },
    { name: "Silk Mustard Bedspread", category: "Textiles", cost: 190.0 },
    { name: "Handblown Glass Tumblers", category: "Tableware", cost: 75.0 },
    { name: "Mid-Century Walnut Credenza", category: "Furniture", cost: 890.0 },
    { name: "Arch Metal Table Lamp", category: "Lighting", cost: 110.0 },
    { name: "Brass Sculptural Object", category: "Decor", cost: 80.0 },
    { name: "Macrame Hanging Tapestry", category: "Textiles", cost: 55.0 },
    { name: "Slate Coasters (Set of 6)", category: "Tableware", cost: 25.0 },
  ];

  const inventoryItems = [];
  for (let i = 0; i < itemsData.length; i++) {
    const itemInfo = itemsData[i];
    const item = await prisma.inventoryItem.create({
      data: {
        sku: `SKU-${itemInfo.category.substring(0, 3).toUpperCase()}-${1000 + i}`,
        barcode: `BARCODE-${99000 + i}`,
        name: itemInfo.name,
        category: itemInfo.category,
        rackNumber: racks[i % racks.length],
        shelfNumber: shelves[i % shelves.length],
        currentStatus: i < 15 ? InventoryStatus.AVAILABLE : InventoryStatus.RESERVED,
        replacementCost: itemInfo.cost,
        photos: [
          `https://picsum.photos/seed/${itemInfo.name.replace(/\s+/g, "")}/400/300`,
        ],
      },
    });
    inventoryItems.push(item);
  }

  console.log("Seeding 2 Projects with SiteDetails...");
  const project1 = await prisma.project.create({
    data: {
      projectCode: "PRJ-2026-001",
      name: "Modern Loft Editorial Shoot",
      status: ProjectStatus.BOOKED,
      shootDate: new Date("2026-09-05T09:00:00Z"),
      reportingTime: "08:30 AM",
      clientId: client1.id,
      leadStylistId: stylist.id,
      leadPackerId: packer.id,
      leadDriverId: driver.id,
      siteDetails: {
        create: {
          address: "Flat 4B, 12 Industrial Way, Arts District",
          googleMapsUrl: "https://maps.google.com/?q=12+Industrial+Way+Arts+District",
          parkingNotes: "Free visitor parking available behind the building. Buzz dial 402 for gate entry.",
          contactNumbers: "+1-555-9001 (Site Manager)",
        },
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectCode: "PRJ-2026-002",
      name: "Contemporary Kitchen Catalog Shoot",
      status: ProjectStatus.PACKING,
      shootDate: new Date("2026-09-12T10:00:00Z"),
      reportingTime: "09:30 AM",
      clientId: client2.id,
      leadStylistId: stylist.id,
      leadPackerId: packer.id,
      leadDriverId: driver.id,
      siteDetails: {
        create: {
          address: "88 Hearthstone Rd, Suburbia Heights",
          googleMapsUrl: "https://maps.google.com/?q=88+Hearthstone+Rd",
          parkingNotes: "Street parking only. Please do not block the driveway. Load-in through the side kitchen door.",
          contactNumbers: "+1-555-9002 (Property Owner)",
        },
      },
    },
  });

  console.log("Seeding Packing Boxes for Project 2...");
  const box1 = await prisma.box.create({
    data: {
      boxNumber: "BOX-001",
      projectId: project2.id,
    },
  });

  const box2 = await prisma.box.create({
    data: {
      boxNumber: "BOX-002",
      projectId: project2.id,
    },
  });

  console.log("Packing Items into Boxes for Project 2...");
  // Pack items 15, 16 into Box 1
  const packedItem1 = await prisma.projectPackedItem.create({
    data: {
      projectId: project2.id,
      inventoryItemId: inventoryItems[15].id,
      boxId: box1.id,
      packedById: packer.id,
    },
  });

  const packedItem2 = await prisma.projectPackedItem.create({
    data: {
      projectId: project2.id,
      inventoryItemId: inventoryItems[16].id,
      boxId: box1.id,
      packedById: packer.id,
    },
  });

  // Pack item 17 into Box 2
  const packedItem3 = await prisma.projectPackedItem.create({
    data: {
      projectId: project2.id,
      inventoryItemId: inventoryItems[17].id,
      boxId: box2.id,
      packedById: packer.id,
    },
  });

  // Update their status in the inventory
  await prisma.inventoryItem.updateMany({
    where: {
      id: {
        in: [inventoryItems[15].id, inventoryItems[16].id, inventoryItems[17].id],
      },
    },
    data: {
      currentStatus: InventoryStatus.PACKED,
    },
  });

  console.log("Creating Seeding AuditLogs...");
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "INITIAL_DATABASE_SEED",
      entityType: "System",
      newValue: "Successfully populated database with Users, Clients, 20 Inventory Items, 2 Projects, 2 Boxes, and 3 Packed Items.",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: stylist.id,
      action: "PROJECT_CREATED",
      entityType: "Project",
      newValue: `Created Project ${project2.projectCode} - ${project2.name}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: packer.id,
      action: "ITEMS_PACKED",
      entityType: "Box",
      newValue: `Packed items ${inventoryItems[15].name}, ${inventoryItems[16].name} into ${box1.boxNumber} and item ${inventoryItems[17].name} into ${box2.boxNumber}`,
    },
  });

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seed execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
