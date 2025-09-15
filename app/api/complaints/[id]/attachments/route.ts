import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

// POST - Add attachment to complaint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { 
      filename, 
      originalName, 
      url, 
      fileType, 
      fileSize, 
      uploadedBy 
    } = body;

    if (!filename || !originalName || !url || !fileType || !uploadedBy) {
      return NextResponse.json(
        { error: 'All attachment fields are required' },
        { status: 400 }
      );
    }

    const complaint = await Complaint.findById(id);
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Add attachment
    const attachment = {
      filename,
      originalName,
      url,
      fileType,
      fileSize,
      uploadedAt: new Date(),
      uploadedBy
    };

    if (!complaint.attachments) {
      complaint.attachments = [];
    }
    
    complaint.attachments.push(attachment);
    await complaint.save();

    return NextResponse.json({
      success: true,
      message: 'Attachment added successfully',
      attachment: complaint.attachments[complaint.attachments.length - 1]
    });
  } catch (error: any) {
    console.error('Error adding attachment:', error);
    return NextResponse.json(
      { error: 'Failed to add attachment' },
      { status: 500 }
    );
  }
}

// GET - Get attachments for complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const complaint = await Complaint.findById(id)
      .select('attachments');
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attachments: complaint.attachments || []
    });
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

