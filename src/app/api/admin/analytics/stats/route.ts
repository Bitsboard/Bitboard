import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/cf";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await getD1();
    if (!db) {
      console.error("Database not available");
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }
    
    // Get total users
    let totalUsers = 0;
    try {
      const totalUsersResult = await db.prepare(`
        SELECT COUNT(*) as count FROM users
      `).first();
      totalUsers = totalUsersResult?.count || 0;
    } catch (error) {
      console.error("Error getting total users:", error);
    }

    // Get total listings
    let totalListings = 0;
    try {
      const totalListingsResult = await db.prepare(`
        SELECT COUNT(*) as count FROM listings
      `).first();
      totalListings = totalListingsResult?.count || 0;
    } catch (error) {
      console.error("Error getting total listings:", error);
    }

    // Get active users (users who have been active in the last 7 days)
    let activeUsers = 0;
    try {
      const activeUsersResult = await db.prepare(`
        SELECT COUNT(DISTINCT seller_id) as count 
        FROM listings 
        WHERE created_at > datetime('now', '-7 days')
      `).first();
      activeUsers = activeUsersResult?.count || 0;
    } catch (error) {
      console.error("Error getting active users:", error);
    }

    // Get new listings (created in the last 7 days)
    let newListings = 0;
    try {
      const newListingsResult = await db.prepare(`
        SELECT COUNT(*) as count 
        FROM listings 
        WHERE created_at > datetime('now', '-7 days')
      `).first();
      newListings = newListingsResult?.count || 0;
    } catch (error) {
      console.error("Error getting new listings:", error);
    }

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
