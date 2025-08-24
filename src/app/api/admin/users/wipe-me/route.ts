export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';

interface WipeMeRequest {
  email: string;
}

export async function POST(req: Request) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { 
        status: 500, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Get the email from the request body
    const { email } = await req.json() as WipeMeRequest;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Delete the user and all associated data
    await db.prepare('DELETE FROM listings WHERE posted_by IN (SELECT id FROM users WHERE email = ?)').bind(email).run();
    await db.prepare('DELETE FROM users WHERE email = ?').bind(email).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `User ${email} and all associated data have been wiped from the database` 
    }), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error wiping user:', error);
    return new Response(JSON.stringify({ error: 'Failed to wipe user' }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
}
