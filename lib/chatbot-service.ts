import OpenAI from 'openai';

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
  private openai: OpenAI;
  private sessions: Map<string, ChatSession> = new Map();

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    });
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

    // Generate system prompt based on context
    const systemPrompt = this.generateSystemPrompt(userMessage);
    
    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I am unable to process your request at the moment.';
      
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

  private generateSystemPrompt(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('complaint') || lowerMessage.includes('grievance')) {
      return `You are a helpful AI assistant for a government grievance redressal portal. Help users understand how to file complaints, track their status, and provide general guidance. Be polite, professional, and informative. Keep responses concise and helpful.`;
    }
    
    if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return `You are helping users track their complaint status. Explain how to use tracking IDs and what different statuses mean. Be helpful and guide them to the tracking page.`;
    }
    
    if (lowerMessage.includes('department') || lowerMessage.includes('category')) {
      return `You are helping users understand which department their complaint belongs to. Explain the different departments and categories available in the grievance portal.`;
    }
    
    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency')) {
      return `You are dealing with an urgent complaint. Provide immediate guidance and emphasize the importance of filing the complaint properly. Be reassuring but professional.`;
    }
    
    return `You are a helpful AI assistant for a government grievance redressal portal. Provide friendly, professional assistance to users. Help them navigate the portal, understand processes, and get their issues resolved. Keep responses concise and actionable.`;
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
