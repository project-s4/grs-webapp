export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class ChatbotService {
  private static instance: ChatbotService;
  private sessions: Map<string, ChatSession> = new Map();
  private aiServiceUrl: string;

  private constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  public async processMessage(sessionId: string, userMessage: string, userId?: string): Promise<string> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = this.createSession(sessionId, userId);
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    try {
      // Call the AI service chat endpoint
      const response = await fetch(`${this.aiServiceUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userMessage,
          session_id: sessionId,
          user: userId ? { phone: userId } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.message || 'I apologize, but I am unable to process your request at the moment.';
      
      // Add assistant response to session
      session.messages.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      });

      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);

      return assistantMessage;
    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private createSession(sessionId: string, userId?: string): ChatSession {
    const session: ChatSession = {
      id: sessionId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m here to help you with the grievance redressal portal. How can I assist you today?';
    }
    
    if (lowerMessage.includes('complaint') || lowerMessage.includes('file')) {
      return 'To file a complaint, please visit our complaint form page. You can find it by clicking "File Complaint" on the homepage. The form will guide you through the process step by step.';
    }
    
    if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return 'To track your complaint status, you can use the tracking form on our homepage. Just enter your tracking ID and you\'ll see the current status and any updates.';
    }
    
    if (lowerMessage.includes('department')) {
      return 'We have several departments including Education, Healthcare, Transportation, Municipal Services, Police, Revenue, Agriculture, and Environment. The system will automatically suggest the appropriate department based on your complaint.';
    }
    
    if (lowerMessage.includes('time') || lowerMessage.includes('duration')) {
      return 'Response times vary by department and complexity. Generally, simple complaints are resolved within 3-5 working days, while complex issues may take 10-15 working days. You can track the progress using your tracking ID.';
    }
    
    return 'I\'m here to help you with the grievance redressal portal. You can file complaints, track their status, and get updates. What specific assistance do you need?';
  }

  public getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public getSessionHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }
}
