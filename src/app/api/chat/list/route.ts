import { NextResponse } from "next/server";
export const runtime = "edge";
export async function GET() {
  // TODO: fetch messages
  return NextResponse.json({ messages: [] });
}
