import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping existing data...");
  await prisma.escrowTransaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const chinedu = await prisma.user.create({
    data: {
      name: "Chinedu Okafor",
      email: "chinedu@unn.edu.ng",
      passwordHash,
      regNo: "2021/244001",
      hostel: "Franco Hostel, UNN",
      phone: "08011112222",
      phoneVerified: true,
      emailVerified: true,
      studentIdVerified: true,
      selfieVerified: true,
      ninVerified: true,
      wallet: { create: { balance: 50000 } },
    },
  });

  const amara = await prisma.user.create({
    data: {
      name: "Amara Nwosu",
      email: "amara@unn.edu.ng",
      passwordHash,
      regNo: "2020/198234",
      hostel: "Bello Hostel, UNN",
      phone: "08033334444",
      phoneVerified: true,
      emailVerified: true,
      studentIdVerified: true,
      selfieVerified: true,
      ninVerified: true,
      bvnVerified: true,
      wallet: { create: { balance: 120000 } },
    },
  });

  const emeka = await prisma.user.create({
    data: {
      name: "Emeka Eze",
      email: "emeka@unn.edu.ng",
      passwordHash,
      regNo: "2022/301122",
      hostel: "Alvan Hostel, UNN",
      phoneVerified: false,
      emailVerified: true,
      wallet: { create: { balance: 15000 } },
    },
  });

  const blessing = await prisma.user.create({
    data: {
      name: "Blessing Obi",
      email: "blessing@unn.edu.ng",
      passwordHash,
      regNo: "2023/149819",
      hostel: "Franco Hostel, UNN",
      phone: "08055556666",
      phoneVerified: true,
      emailVerified: true,
      studentIdVerified: true,
      wallet: { create: { balance: 400000 } },
    },
  });

  await prisma.product.create({
    data: {
      title: "iPhone 12 Pro Max (128GB, Pacific Blue)",
      description:
        "Clean UK-used. Battery health 88%. True Tone active, Face ID functional. Selling because I need to buy textbooks and pay hostel fees.",
      price: 380000,
      category: "Electronics",
      condition: "Used (Excellent)",
      location: "Franco Hostel, UNN",
      imageUrl: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=600",
      inspectionRequired: true,
      inspectionReportJson: JSON.stringify({
        imei: "357289110482937",
        serialNumber: "G0NFC17BN7FD",
        batteryHealth: "88%",
        screenCondition: "Original - No scratches",
        repairsDetected: "None",
        authenticity: "Verified Original Apple",
        inspectionScore: 94,
        inspectedBy: "CampusVerse Hub (Franco, UNN)",
      }),
      sellerId: chinedu.id,
    },
  });

  await prisma.product.create({
    data: {
      title: "Modern Study Desk & Ergonomic Chair",
      description:
        "Very sturdy wooden desk with a metal frame. Comes with a comfortable mesh office chair. Perfect for studying at night.",
      price: 65000,
      category: "Hostel Furniture",
      condition: "Used (Like New)",
      location: "Odim Gate area, Nsukka",
      imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
      inspectionRequired: false,
      sellerId: amara.id,
    },
  });

  await prisma.product.create({
    data: {
      title: "Dell Latitude 7490 Core i7",
      description:
        "16GB RAM, 512GB SSD. Perfect for programming, graphic design, and assignments. Battery lasts 4 hours on heavy use.",
      price: 245000,
      category: "Electronics",
      condition: "Used (Good)",
      location: "Alvan Hostel, UNN",
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600",
      inspectionRequired: true,
      inspectionReportJson: JSON.stringify({
        imei: "98274092749028",
        serialNumber: "9J8XW42",
        batteryHealth: "82%",
        screenCondition: "Minor bezel scratch, panel original",
        repairsDetected: "SSD Upgraded",
        authenticity: "Verified Dell OEM",
        inspectionScore: 88,
        inspectedBy: "CampusVerse Hub (Sub-Dome, UNN)",
      }),
      sellerId: emeka.id,
    },
  });

  console.log("Seeded users (password123 for all):");
  console.log(`  ${chinedu.email}, ${amara.email}, ${emeka.email}, ${blessing.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
