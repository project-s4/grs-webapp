import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService } from '@/lib/chatbot-service';

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

    const chatbotService = ChatbotService.getInstance();
    const response = await chatbotService.processMessage(sessionId, message, userId);

    return NextResponse.json({
      success: true,
      response,
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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    const chatbotService = ChatbotService.getInstance();
    const history = chatbotService.getSessionHistory(sessionId);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Chatbot history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}
