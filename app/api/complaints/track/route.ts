import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT * FROM complaints WHERE tracking_id = $1',
      [trackingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Complaint not found with this tracking ID' },
        { status: 404 }
      );
    }

    const complaint = result.rows[0];

    return NextResponse.json({ 
      success: true,
      complaint 
    });
  } catch (error: any) {
    console.error('Error tracking complaint:', error);
    return NextResponse.json(
      { error: 'Failed to track complaint' },
      { status: 500 }
    );
  }
}



