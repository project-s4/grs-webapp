import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { EmailService } from '@/lib/email-service';

// GET - Fetch single complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const complaint = await Complaint.findById(id)
      .select('-comments.isInternal'); // Exclude internal comments from user view
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Increment view count
    complaint.viewCount = (complaint.viewCount || 0) + 1;
    await complaint.save();

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
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { 
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
      resolution
    } = body;

    // Validation
    if (!status && !adminReply && !reply && !priority && !assignedTo) {
      return NextResponse.json(
        { error: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (assignedToName) updateData.assignedToName = assignedToName;
    if (adminReply) updateData.adminReply = adminReply;
    if (reply) updateData.reply = reply;
    if (estimatedResolution) updateData.estimatedResolution = new Date(estimatedResolution);
    if (escalationReason) updateData.escalationReason = escalationReason;
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (followUpDate) updateData.followUpDate = new Date(followUpDate);
    if (followUpNotes) updateData.followUpNotes = followUpNotes;
    if (satisfaction) updateData.satisfaction = satisfaction;
    if (resolution) updateData.resolution = resolution;

    // Handle escalation
    if (status === 'Escalated') {
      updateData.escalationLevel = 1; // Will be incremented by pre-save hook
      updateData.escalatedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Send email notification for status changes
    if (status) {
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