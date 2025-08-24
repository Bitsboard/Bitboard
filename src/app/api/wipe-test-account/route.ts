export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST() {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const email = 'georged1997@gmail.com';
    
    // Delete the user and all associated data
    await db.prepare('DELETE FROM listings WHERE posted_by IN (SELECT id FROM users WHERE email = ?)').bind(email).run();
    await db.prepare('DELETE FROM users WHERE email = ?').bind(email).run();

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} and all associated data have been wiped from the database` 
    });

  } catch (error) {
    console.error('Error wiping user:', error);
    return NextResponse.json({ error: 'Failed to wipe user' }, { status: 500 });
  }
}
