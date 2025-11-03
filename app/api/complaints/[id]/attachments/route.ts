import { NextRequest, NextResponse } from 'next/server';
// Attachments functionality temporarily disabled - would need PostgreSQL implementation

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Attachments feature is temporarily disabled' },
    { status: 501 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Attachments feature is temporarily disabled' },
    { status: 501 }
  );
}

