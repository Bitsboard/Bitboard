var r={},T=(_,t,c)=>(r.__chunk_8084=(l,s,n)=>{"use strict";async function i(){try{let e=await Promise.resolve().then(n.t.bind(n,3808,23)).catch(()=>null);if(e&&typeof e.getRequestContext=="function"){let a=e.getRequestContext();if(a?.env?.DB)return console.log("\u2705 Database found via @cloudflare/next-on-pages"),a.env}return typeof t<"u"&&t.__env__?(console.log("\u2705 Database found via globalThis.__env__"),t.__env__):typeof process<"u"&&process.env?(console.log("\u26A0\uFE0F Using process.env fallback"),process.env):(console.log("\u274C No database binding found via any method"),{})}catch(e){return console.error("Error in getCfEnv:",e),{}}}async function o(){try{console.log("\u{1F50D} Attempting to get database binding...");let e=await i();if(e.DB){console.log("\u2705 Database binding found:",typeof e.DB);try{let a=e.DB;return await a.prepare("PRAGMA journal_mode = WAL").run(),await a.prepare("PRAGMA page_size = 4096").run(),await a.prepare("PRAGMA mmap_size = 268435456").run(),await a.prepare("PRAGMA cache_size = -64000").run(),await a.prepare("PRAGMA synchronous = NORMAL").run(),console.log("\u2705 Database optimizations applied"),a}catch(a){return console.log("\u26A0\uFE0F Database optimizations failed, continuing with default settings:",a),e.DB}}return console.log("\u274C No DB binding in environment"),console.log("Available env keys:",Object.keys(e)),null}catch(e){return console.error("Error in getD1:",e),null}}async function E(e){await e.prepare(`CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      listing_id INTEGER NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      last_message_at INTEGER DEFAULT (strftime('%s','now'))
    )`).run(),await e.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      from_id TEXT NOT NULL,
      text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      read_at INTEGER
    )`).run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_chats_listing_id ON chats(listing_id)").run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id)").run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id)").run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC)").run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)").run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id)").run(),await e.prepare("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)").run()}n.d(s,{Fo:()=>E,ZA:()=>o})},r);export{T as __getNamedExports};
