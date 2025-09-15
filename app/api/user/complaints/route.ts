import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

// GET - Get user's complaints
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Build filter for user's complaints
    const filter: any = { email };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .sort({ dateFiled: -1 })
      .skip(skip)
      .limit(limit)
      .select('-comments.isInternal'); // Exclude internal comments

    const total = await Complaint.countDocuments(filter);

    return NextResponse.json({
      success: true,
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

// POST - Create new complaint (user)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      name, 
      email, 
      phone,
      department, 
      category, 
      subCategory,
      description, 
      images, 
      documents,
      audioFiles,
      location,
      tags
    } = body;

    // Validation
    if (!name || !email || !department || !category || !description) {
      return NextResponse.json(
        { error: 'Name, email, department, category, and description are required' },
        { status: 400 }
      );
    }

    // Generate unique tracking ID
    const { generateTrackingId } = await import('@/lib/utils');
    let trackingId;
    let isUnique = false;
    while (!isUnique) {
      trackingId = generateTrackingId();
      const existing = await Complaint.findOne({ trackingId });
      if (!existing) {
        isUnique = true;
      }
    }

    // NLP Analysis
    const { NLPService } = await import('@/lib/nlp-service');
    const nlpService = NLPService.getInstance();
    const nlpAnalysis = nlpService.analyzeComplaint(description);

    // Create complaint
    const complaint = new Complaint({
      trackingId,
      name,
      email,
      phone,
      department: nlpAnalysis.suggestedDepartment || department,
      category,
      subCategory,
      description,
      status: 'Pending',
      priority: nlpAnalysis.priority,
      dateFiled: new Date(),
      
      // NLP Analysis
      sentiment: nlpAnalysis.sentiment,
      keywords: nlpAnalysis.keywords,
      urgency: nlpAnalysis.urgency,
      complexity: nlpAnalysis.complexity,
      tags: [...(tags || []), ...(nlpAnalysis.tags || [])],
      
      // Media
      images: images || [],
      documents: documents || [],
      audioFiles: audioFiles || [],
      
      // Location
      location: location || undefined,
      
      // Analytics
      viewCount: 0,
      responseTime: null,
      satisfaction: null,
      
      // Routing
      assignedTo: null,
      assignedToName: null,
      estimatedResolution: null,
      
      // Escalation
      escalationLevel: 0,
      escalationReason: null,
      escalatedAt: null,
      
      // Tracking & History
      statusHistory: [{
        status: 'Pending',
        updatedAt: new Date(),
        updatedBy: 'system',
        notes: 'Complaint created'
      }],
      comments: [],
      attachments: [],
      
      // Follow-up
      followUpRequired: false,
    });

    await complaint.save();

    // Send email notification
    try {
      const { EmailService } = await import('@/lib/email-service');
      const emailService = EmailService.getInstance();
      await emailService.sendComplaintConfirmation({
        trackingId: trackingId!,
        status: complaint.status,
        department: complaint.department,
        category: complaint.category,
        complainantName: complaint.name,
        complainantEmail: complaint.email,
        description: complaint.description,
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      trackingId,
      message: 'Complaint submitted successfully',
      complaint,
      nlpAnalysis: {
        sentiment: nlpAnalysis.sentiment,
        priority: nlpAnalysis.priority,
        urgency: nlpAnalysis.urgency,
        complexity: nlpAnalysis.complexity,
        suggestedDepartment: nlpAnalysis.suggestedDepartment,
        keywords: nlpAnalysis.keywords,
        tags: nlpAnalysis.tags,
      },
    });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

