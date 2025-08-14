import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", handle: "@alice" }
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", handle: "@bob" }
  });
  await prisma.listing.create({
    data: {
      title: "Antminer S19 Pro (110TH)",
      description: "Well‑maintained, pickup preferred. Includes PSU.",
      priceSats: 14500000,
      category: "Mining Gear",
      adType: "sell",
      location: "Markham, ON",
      lat: 43.8561, lng: -79.337,
      images: ["https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop"],
      sellerId: alice.id
    }
  });
  await prisma.listing.create({
    data: {
      title: "Looking for: Ryzen 7 / 3070 build",
      description: "WTB a clean 1440p gaming PC. Prefer pickup downtown. Paying in sats.",
      priceSats: 5200000,
      category: "Electronics",
      adType: "want",
      location: "Toronto, ON (Downtown)",
      lat: 43.651, lng: -79.381,
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop"],
      sellerId: bob.id
    }
  });
}
main().then(() => prisma.$disconnect());
