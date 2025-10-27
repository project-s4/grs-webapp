import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Get AI service URL from environment variable
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    console.log('Calling AI service at:', `${aiServiceUrl}/chat`);

    // Call the AI service chat endpoint
    const response = await fetch(`${aiServiceUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_input: message,
        session_id: sessionId,
        user: userId ? { phone: userId } : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.message || 'I apologize, but I am unable to process your request at the moment.';

    return NextResponse.json({
      success: true,
      response: assistantMessage,
      sessionId,
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Session history is managed by the AI service, not needed here
    return NextResponse.json({
      success: true,
      message: 'Chatbot API is running',
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
