import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/cf";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    // Get all users
    const usersResult = await db.prepare(`SELECT * FROM users ORDER BY created_at ASC`).all();
    const users = usersResult.results || [];
    
    // Get all listings
    const listingsResult = await db.prepare(`SELECT * FROM listings ORDER BY created_at ASC`).all();
    const listings = listingsResult.results || [];
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        listings
      }
    });

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
