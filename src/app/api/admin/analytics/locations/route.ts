// src/app/api/admin/analytics/locations/route.ts
import '@/shims/async_hooks';
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

/**
 * This route returns rows like:
 * { location: "Houston, TX", userCount: 5, listingCount: 0, lat: 29.76, lng: -95.37 }
 *
 * Supports:
 *   - ?type=users|listings   (default: users)
 *   - ?timeRange=24h|7d|30d|90d|all   (default: all)
 *
 * DB: Cloudflare D1 (SQLite). We normalize UNIX timestamps:
 * created_at may be seconds or milliseconds; we robustly normalize in-SQL.
 */

type D1Result<T = any> = { results: T[] };

async function getDB(): Promise<any> {
  const { env } = getRequestContext();
  const db = (env as any).DB as D1Database | undefined;
  
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

function windowSeconds(range: string | null): number | null {
  switch ((range || "all").toLowerCase()) {
    case "24h":
      return 24 * 3600;
    case "7d":
      return 7 * 24 * 3600;
    case "30d":
      return 30 * 24 * 3600;
    case "90d":
      return 90 * 24 * 3600;
    case "all":
    default:
      return null;
  }
}

/** Normalize a UNIX timestamp which might be in seconds or milliseconds */
const NORMALIZED_TS_EXPR =
  "CASE WHEN created_at > 2000000000 THEN CAST(created_at/1000 AS INTEGER) ELSE created_at END";

/** Does a table exist? */
async function tableExists(db: any, name: string): Promise<boolean> {
  const q =
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1";
  const out: D1Result = await db.prepare(q).bind(name).all();
  return out.results.length > 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "users").toLowerCase(); // users | listings
    const timeRange = searchParams.get("timeRange") || "all";

    const win = windowSeconds(timeRange);
    const nowSec = Math.floor(Date.now() / 1000);
    const cutoffSec = win == null ? null : nowSec - win;

    const db = await getDB();

    // Build WHERE clause with normalized timestamp
    const where = cutoffSec == null ? "" : `WHERE ${NORMALIZED_TS_EXPR} >= ?`;

    let rows: any[] = [];

    if (type === "listings") {
      // Listings within window
      const sql = `
        SELECT
          COALESCE(location, '') AS location,
          COUNT(*) AS listingCount,
          0 AS userCount,
          MIN(lat) AS lat,
          MIN(lng) AS lng
        FROM listings
        ${where}
        GROUP BY location
      `;
      const out: D1Result = cutoffSec
        ? await db.prepare(sql).bind(cutoffSec).all()
        : await db.prepare(sql).all();
      rows = out.results;
    } else {
      // USERS view
      // Prefer a real 'users' table with last_active or created_at; else approximate by distinct posted_by in listings.
      const hasUsers = await tableExists(db, "users");

      if (hasUsers) {
        // Try last_active then fallback to created_at if last_active missing
        const hasLastActive =
          (
            await db
              .prepare(
                "PRAGMA table_info('users')" // columns: name, type, notnull...
              )
              .all()
          ).results.find((c: any) => c.name === "last_active") !== undefined;

        const usersTsCol = hasLastActive ? "last_active" : "created_at";
        const normUsersTsExpr =
          usersTsCol === "created_at"
            ? NORMALIZED_TS_EXPR
            : `CASE WHEN ${usersTsCol} > 2000000000 THEN CAST(${usersTsCol}/1000 AS INTEGER) ELSE ${usersTsCol} END`;

        const sql = `
          SELECT
            COALESCE(location, '') AS location,
            COUNT(*) AS userCount,
            0 AS listingCount,
            MIN(lat) AS lat,
            MIN(lng) AS lng
          FROM users
          ${cutoffSec == null ? "" : `WHERE ${normUsersTsExpr} >= ?`}
          GROUP BY location
        `;
        const out: D1Result = cutoffSec
          ? await db.prepare(sql).bind(cutoffSec).all()
          : await db.prepare(sql).all();
        rows = out.results;
      } else {
        // Approximate "active users" by distinct posters within window from listings
        const sql = `
          SELECT
            COALESCE(location, '') AS location,
            COUNT(DISTINCT posted_by) AS userCount,
            0 AS listingCount,
            MIN(lat) AS lat,
            MIN(lng) AS lng
          FROM listings
          ${where}
          GROUP BY location
        `;
        const out: D1Result = cutoffSec
          ? await db.prepare(sql).bind(cutoffSec).all()
          : await db.prepare(sql).all();
        rows = out.results;
      }
    }

    // Ensure numeric types
    const data = rows.map((r) => ({
      location: r.location || "",
      userCount: Number(r.userCount || 0),
      listingCount: Number(r.listingCount || 0),
      lat: r.lat != null ? Number(r.lat) : null,
      lng: r.lng != null ? Number(r.lng) : null,
    }));

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}