import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/postgres';
import { EmailService } from '@/src/lib/email-service';

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

// PUT - Update complaint (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { 
      name,
      email,
      phone,
      department,
      category,
      subCategory,
      description,
      status, 
      priority, 
      assignedTo, 
      assignedToName,
      adminReply, 
      reply,
      estimatedResolution,
      escalationReason,
      followUpRequired,
      followUpDate,
      followUpNotes,
      satisfaction,
      resolution,
      location,
      tags
    } = body;

    const complaint = await Complaint.findById(id);
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (name) complaint.name = name;
    if (email) complaint.email = email;
    if (phone !== undefined) complaint.phone = phone;
    if (department) complaint.department = department;
    if (category) complaint.category = category;
    if (subCategory !== undefined) complaint.subCategory = subCategory;
    if (description) complaint.description = description;
    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (assignedToName) complaint.assignedToName = assignedToName;
    if (adminReply) complaint.adminReply = adminReply;
    if (reply) complaint.reply = reply;
    if (estimatedResolution) complaint.estimatedResolution = new Date(estimatedResolution);
    if (escalationReason) complaint.escalationReason = escalationReason;
    if (followUpRequired !== undefined) complaint.followUpRequired = followUpRequired;
    if (followUpDate) complaint.followUpDate = new Date(followUpDate);
    if (followUpNotes) complaint.followUpNotes = followUpNotes;
    if (satisfaction) complaint.satisfaction = satisfaction;
    if (resolution) complaint.resolution = resolution;
    if (location) complaint.location = location;
    if (tags) complaint.tags = tags;

    // Handle escalation
    if (status === 'Escalated') {
      complaint.escalationLevel = (complaint.escalationLevel || 0) + 1;
      complaint.escalatedAt = new Date();
    }

    await complaint.save();

    // Send email notification for status changes
    try {
      const emailService = EmailService.getInstance();
      await emailService.sendStatusUpdate({
        trackingId: complaint.trackingId,
        status: complaint.status,
        complainantName: complaint.name,
        complainantEmail: complaint.email,
        adminReply: complaint.adminReply,
        reply: complaint.reply,
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to update complaint' },
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
    const { status, adminReply, assigned_to } = body;

    // Validation
    if (!status && !adminReply && assigned_to === undefined) {
      return NextResponse.json(
        { error: 'At least status, adminReply, or assigned_to is required for update' },
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
      updateFields.push(`admin_reply = $${paramIndex}`);
      params_list.push(adminReply);
      paramIndex++;
    }

    if (assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex}`);
      params_list.push(assigned_to ? parseInt(assigned_to) : null);
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

// DELETE - Delete complaint (soft delete by changing status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const complaint = await Complaint.findById(id);
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Soft delete by changing status to 'Closed'
    complaint.status = 'Closed';
    complaint.adminReply = 'This complaint has been closed and archived.';
    
    await complaint.save();

    return NextResponse.json({
      success: true,
      message: 'Complaint closed successfully'
    });
  } catch (error: any) {
    console.error('Error closing complaint:', error);
    return NextResponse.json(
      { error: 'Failed to close complaint' },
      { status: 500 }
    );
  }
}