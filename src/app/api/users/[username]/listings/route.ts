import { NextResponse } from "next/server";

// Edge runtime for production, standard for local development
// export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    console.log('User listings API called for username:', params.username);
    
    // For local development, always return no_db_binding to trigger fallback
    console.log('Local development mode, returning no_db_binding error');
    return NextResponse.json({ error: "no_db_binding" }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json({ 
      error: "internal_error",
      message: "Failed to fetch user listings" 
    }, { status: 500 });
  }
}
