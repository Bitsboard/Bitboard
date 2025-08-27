import '../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getSessionFromRequest } from '@/lib/auth';
import { isAdmin } from '@/lib/auth';

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminStatus = await isAdmin(session.user.email);
    
    return NextResponse.json({ 
      isAdmin: adminStatus 
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
