import { NextRequest, NextResponse } from 'next/server';
// Comments functionality temporarily disabled - would need PostgreSQL implementation

// POST - Add comment to complaint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Comments feature is temporarily disabled' },
    { status: 501 }
  );
}

// GET - Get comments for complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Comments feature is temporarily disabled' },
    { status: 501 }
  );
}

