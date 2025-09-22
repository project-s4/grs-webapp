import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// GET - Fetch single complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get complaint by ID
    const result = await query(
      'SELECT * FROM complaints WHERE id = $1',
      [parseInt(id)]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    const complaint = result.rows[0];

    return NextResponse.json({ 
      success: true,
      complaint 
    });
  } catch (error: any) {
    console.error('Error fetching complaint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaint' },
      { status: 500 }
    );
  }
}

// PATCH - Partial update complaint
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, adminReply } = body;

    // Validation
    if (!status && !adminReply) {
      return NextResponse.json(
        { error: 'At least status or adminReply is required for update' },
        { status: 400 }
      );
    }

    // Build update query
    let updateFields = [];
    let params_list = [parseInt(id)];
    let paramIndex = 2;

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      params_list.push(status);
      paramIndex++;
    }

    if (adminReply) {
      updateFields.push(`notes = $${paramIndex}`);
      params_list.push(adminReply);
      paramIndex++;
    }

    // Handle resolved_at timestamp
    if (status === 'resolved') {
      updateFields.push(`resolved_at = $${paramIndex}`);
      params_list.push(new Date().toISOString());
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramIndex}`);
    params_list.push(new Date().toISOString());

    const updateQuery = `
      UPDATE complaints 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(updateQuery, params_list);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    const complaint = result.rows[0];

    // Send email notification for status changes (simplified)
    if (status && complaint.email) {
      try {
        console.log(`Status updated to ${status} for complaint ${complaint.tracking_id}`);
        // Email service implementation would go here
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint,
    });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to update complaint' },
      { status: 500 }
    );
  }
}
