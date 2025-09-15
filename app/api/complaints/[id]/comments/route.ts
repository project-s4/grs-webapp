import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

// POST - Add comment to complaint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { text, author, authorType = 'user', isInternal = false } = body;

    if (!text || !author) {
      return NextResponse.json(
        { error: 'Comment text and author are required' },
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

    // Add comment
    const comment = {
      text,
      author,
      authorType,
      createdAt: new Date(),
      isInternal
    };

    if (!complaint.comments) {
      complaint.comments = [];
    }
    
    complaint.comments.push(comment);
    await complaint.save();

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: complaint.comments[complaint.comments.length - 1]
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// GET - Get comments for complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeInternal = searchParams.get('includeInternal') === 'true';

    const complaint = await Complaint.findById(id)
      .select('comments');
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    let comments = complaint.comments || [];
    
    // Filter out internal comments unless specifically requested
    if (!includeInternal) {
      comments = comments.filter(comment => !comment.isInternal);
    }

    return NextResponse.json({
      success: true,
      comments
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

