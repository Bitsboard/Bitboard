import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/cf";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    // Get total users
    const totalUsersResult = await db.prepare(`SELECT COUNT(*) as count FROM users`).first();
    const totalUsers = Number(totalUsersResult?.count || 0);

    // Get total listings
    const totalListingsResult = await db.prepare(`SELECT COUNT(*) as count FROM listings`).first();
    const totalListings = Number(totalListingsResult?.count || 0);

    // Get active users (users who created listings in last 7 days)
    const activeUsersResult = await db.prepare(`
      SELECT COUNT(DISTINCT seller_id) as count 
      FROM listings 
      WHERE created_at > datetime('now', '-7 days')
    `).first();
    const activeUsers = Number(activeUsersResult?.count || 0);

    // Get new listings (created in last 7 days)
    const newListingsResult = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM listings 
      WHERE created_at > datetime('now', '-7 days')
    `).first();
    const newListings = Number(newListingsResult?.count || 0);

    return NextResponse.json({
      totalUsers,
      totalListings,
      activeUsers,
      newListings
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}