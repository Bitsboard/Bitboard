import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/cf";

export async function GET(request: NextRequest) {
  try {
    const db = await getD1();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }
    
    // Get total users
    const totalUsersResult = await db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();
    const totalUsers = totalUsersResult?.count || 0;

    // Get total listings
    const totalListingsResult = await db.prepare(`
      SELECT COUNT(*) as count FROM listings
    `).first();
    const totalListings = totalListingsResult?.count || 0;

    // Get active users (users who have been active in the last 7 days)
    const activeUsersResult = await db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM listings 
      WHERE created_at > datetime('now', '-7 days')
    `).first();
    const activeUsers = activeUsersResult?.count || 0;

    // Get new listings (created in the last 7 days)
    const newListingsResult = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM listings 
      WHERE created_at > datetime('now', '-7 days')
    `).first();
    const newListings = newListingsResult?.count || 0;

    return NextResponse.json({
      totalUsers: Number(totalUsers),
      totalListings: Number(totalListings),
      activeUsers: Number(activeUsers),
      newListings: Number(newListings)
    });

  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics stats" },
      { status: 500 }
    );
  }
}
