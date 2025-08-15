import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { generateTrackingId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email, department, category, description } = body;

    // Validation
    if (!name || !email || !department || !category || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Generate unique tracking ID
    let trackingId;
    let isUnique = false;
    while (!isUnique) {
      trackingId = generateTrackingId();
      const existing = await Complaint.findOne({ trackingId });
      if (!existing) {
        isUnique = true;
      }
    }

    const complaint = new Complaint({
      trackingId,
      name,
      email,
      department,
      category,
      description,
      status: 'Pending',
      dateFiled: new Date(),
    });

    await complaint.save();

    return NextResponse.json({
      success: true,
      trackingId,
      message: 'Complaint submitted successfully',
      complaint,
    });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .sort({ dateFiled: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(filter);

    return NextResponse.json({
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}



