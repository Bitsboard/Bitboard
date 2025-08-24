export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST() {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { 
        status: 500, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    const email = 'georged1997@gmail.com';
    
    // Delete the user and all associated data
    await db.prepare('DELETE FROM listings WHERE posted_by IN (SELECT id FROM users WHERE email = ?)').bind(email).run();
    await db.prepare('DELETE FROM users WHERE email = ?').bind(email).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Test account ${email} has been wiped from the database` 
    }), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error wiping test account:', error);
    return new Response(JSON.stringify({ error: 'Failed to wipe test account' }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
}
