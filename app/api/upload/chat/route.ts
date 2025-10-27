import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService } from '@/lib/chatbot-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get chatbot service instance
    const chatbotService = ChatbotService.getInstance();

    // Process the message
    const response = await chatbotService.processMessage(sessionId, message, userId);

    // Return the response
    return NextResponse.json({
      response,
      sessionId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return a generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Sorry, I encountered an issue processing your request. Please try again.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Chat API is running. Use POST method to send messages.' },
    { status: 200 }
  );
}
