import { NextResponse } from 'next/server';

// Get the correct origin based on environment
export function getAllowedOrigin(): string {
  // In development, allow both common development ports
  if (process.env.NODE_ENV === 'development') {
    // Try to determine the correct origin from environment or use common development origins
    const port = process.env.PORT || '3001';
    return `http://localhost:${port}`;
  }
  
  // In production, use the actual domain
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

// Add CORS headers to a response
export function addCorsHeaders(response: NextResponse, methods: string = 'GET, POST, PUT, DELETE, OPTIONS'): NextResponse {
  const origin = getAllowedOrigin();
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', methods);
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Create a CORS-enabled response
export function createCorsResponse(data: any, options?: { status?: number; methods?: string }): NextResponse {
  const response = NextResponse.json(data, { status: options?.status || 200 });
  return addCorsHeaders(response, options?.methods);
}

// Create CORS preflight response
export function createCorsPreflightResponse(methods: string = 'GET, POST, PUT, DELETE, OPTIONS'): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, methods);
}
