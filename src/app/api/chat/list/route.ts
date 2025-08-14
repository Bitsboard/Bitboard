import { NextResponse } from "next/server";
export async function GET() {
  // TODO: fetch messages
  return NextResponse.json({ messages: [] });
}
