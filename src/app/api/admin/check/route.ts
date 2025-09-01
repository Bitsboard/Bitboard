import '@/shims/async_hooks';
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    // For now, return true to allow access - this will be replaced with proper session checking
    // The main admin page already handles authentication via localStorage
    return NextResponse.json({ 
      isAdmin: true 
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // For now, return true to allow access - this will be replaced with proper session checking
    // The main admin page already handles authentication via localStorage
    return NextResponse.json({ 
      isAdmin: true 
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
