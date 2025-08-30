export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function GET(req: Request) {
  try {
    console.log('🔍 Debug API: Request started');
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      requestUrl: req.url,
      requestMethod: req.method,
      environment: process.env.NODE_ENV || 'unknown',
      cfEnvironment: 'edge'
    };
    
    // Test database connection
    console.log('🔍 Debug API: Testing database connection...');
    try {
      const db = await getD1();
      debugInfo.databaseBinding = {
        exists: !!db,
        type: typeof db,
        keys: db ? Object.keys(db) : [],
        hasPrepare: db ? typeof db.prepare === 'function' : false
      };
      
      if (db) {
        console.log('🔍 Debug API: Database binding found, testing basic functionality...');
        
        try {
          const testResult = await db.prepare('SELECT 1 as test').all();
          debugInfo.basicQuery = {
            success: true,
            result: testResult,
            hasResults: !!testResult.results,
            resultsLength: testResult.results?.length || 0
          };
        } catch (queryError: any) {
          debugInfo.basicQuery = {
            success: false,
            error: queryError?.message || String(queryError),
            errorType: queryError?.constructor?.name
          };
        }
        
        // Test table existence
        try {
          const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
          debugInfo.tables = {
            success: true,
            count: tableCheck.results?.length || 0,
            names: tableCheck.results?.map((r: any) => r.name) || []
          };
        } catch (tableError: any) {
          debugInfo.tables = {
            success: false,
            error: tableError?.message || String(tableError)
          };
        }
        
        // Test listings table specifically
        try {
          const listingsCheck = await db.prepare("SELECT COUNT(*) as count FROM listings").all();
          debugInfo.listingsTable = {
            success: true,
            count: listingsCheck.results?.[0]?.count || 0
          };
        } catch (listingsError: any) {
          debugInfo.listingsTable = {
            success: false,
            error: listingsError?.message || String(listingsError)
          };
        }
        
      } else {
        debugInfo.databaseBinding = {
          exists: false,
          error: 'No database binding returned from getD1()'
        };
      }
      
    } catch (dbError: any) {
      debugInfo.databaseError = {
        message: dbError?.message || String(dbError),
        type: dbError?.constructor?.name,
        stack: dbError?.stack
      };
    }
    
    console.log('🔍 Debug API: Debug info collected:', debugInfo);
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (e: any) {
    console.error('🔍 Debug API: Error occurred:', e);
    
    return NextResponse.json({
      success: false,
      error: e?.message || String(e) || 'Unknown error',
      errorType: e?.constructor?.name || 'Unknown'
    }, { status: 500 });
  }
}
