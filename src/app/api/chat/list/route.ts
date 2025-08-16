import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET() {
  const db = await getD1();
  if (!db) return NextResponse.json({ messages: [], error: 'no_db_binding' }, { status: 200 });
  await ensureChatSchema(db);
  const res = await db.prepare(`SELECT id, chat_id AS chatId, from_id AS fromId, text, created_at AS createdAt FROM messages ORDER BY created_at DESC LIMIT 50`).all();
  return NextResponse.json({ messages: res.results ?? [] });
}
