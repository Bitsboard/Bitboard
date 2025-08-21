var E={},o=(r,i,N)=>(E.__chunk_8084=(c,T,e)=>{"use strict";async function a(){let t=await Promise.resolve().then(e.t.bind(e,3808,23)).catch(()=>null);return t&&typeof t.getRequestContext=="function"?t.getRequestContext().env??{}:{}}async function s(){return(await a()).DB??null}async function n(t){await t.prepare(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER,
      buyer_id TEXT,
      seller_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )`).run(),await t.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      from_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`).run(),await t.prepare("CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC)").run()}e.d(T,{Fo:()=>n,ZA:()=>s}),e(7889)},E);export{o as __getNamedExports};
