import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { chatId, text } = await req.json();
  if (!chatId || !text) return NextResponse.json({ error: "chatId & text required" }, { status: 400 });
  // TODO: persist via prisma.message.create
  return NextResponse.json({ ok: true });
}
