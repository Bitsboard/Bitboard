import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const listings = await prisma.listing.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: auth; validate input with zod
  const listing = await prisma.listing.create({ data: body });
  return NextResponse.json({ listing });
}
