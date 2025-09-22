import { NextRequest, NextResponse } from 'next/server';
// Analytics functionality temporarily disabled - would need PostgreSQL implementation

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Analytics feature is temporarily disabled' },
    { status: 501 }
  );
}
