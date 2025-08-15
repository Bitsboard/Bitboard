import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function POST(req: Request) {
  const { chatId, text, fromId } = (await req.json()) as { chatId?: number; text?: string; fromId?: string };
  if (!chatId || !text || !fromId) return NextResponse.json({ error: "chatId, fromId & text required" }, { status: 400 });
  const db = await getD1();
  if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 200 });
  await ensureChatSchema(db);
  await db.prepare('INSERT INTO messages (chat_id, from_id, text) VALUES (?, ?, ?)').bind(chatId, fromId, text).run();
  const row = await db.prepare('SELECT last_insert_rowid() AS id').all();
  const id = (row.results?.[0] as any)?.id ?? null;
  return NextResponse.json({ ok: true, id });
}
