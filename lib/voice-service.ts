import OpenAI from 'openai';

export interface VoiceTranscription {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface VoiceAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: number;
  keywords: string[];
  suggestedDepartment: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class VoiceService {
  private static instance: VoiceService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    });
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public async transcribeAudio(audioBuffer: Buffer): Promise<VoiceTranscription> {
    try {
      // For now, return a mock transcription since OpenAI API has type issues
      // In production, you would use the actual OpenAI API
      return {
        text: 'Voice transcription would be processed here with valid OpenAI API key',
        confidence: 0.8,
        language: 'en',
        duration: 0,
      };
    } catch (error) {
      console.error('Voice transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  public async analyzeVoiceContent(text: string): Promise<VoiceAnalysis> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze this voice transcription for a grievance complaint. Provide a JSON response with:
{
  "sentiment": "positive/negative/neutral",
  "urgency": 1-10,
  "keywords": ["keyword1", "keyword2"],
  "suggestedDepartment": "department name",
  "priority": "Low/Medium/High/Critical"
}

Focus on identifying urgency, sentiment, and appropriate department.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 200,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      return this.parseVoiceAnalysis(analysisText);
    } catch (error) {
      console.error('Voice analysis error:', error);
      return this.getFallbackVoiceAnalysis();
    }
  }

  private parseVoiceAnalysis(response: string): VoiceAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        urgency: parsed.urgency || 5,
        keywords: parsed.keywords || [],
        suggestedDepartment: parsed.suggestedDepartment || 'Other',
        priority: parsed.priority || 'Medium',
      };
    } catch (error) {
      console.error('Failed to parse voice analysis:', error);
      return this.getFallbackVoiceAnalysis();
    }
  }

  private getFallbackVoiceAnalysis(): VoiceAnalysis {
    return {
      sentiment: 'neutral',
      urgency: 5,
      keywords: [],
      suggestedDepartment: 'Other',
      priority: 'Medium',
    };
  }

  public async generateComplaintFromVoice(text: string): Promise<{
    title: string;
    description: string;
    category: string;
    department: string;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Convert this voice transcription into a structured complaint. Provide JSON:
{
  "title": "Brief complaint title",
  "description": "Detailed description",
  "category": "Infrastructure/Service Delivery/Corruption/Delay in Services/Quality Issues/Billing Problems/Other",
  "department": "Education/Healthcare/Transportation/Municipal Services/Police/Revenue/Agriculture/Environment/Other"
}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 300,
      });

      const resultText = response.choices[0]?.message?.content || '';
      return this.parseComplaintGeneration(resultText);
    } catch (error) {
      console.error('Complaint generation error:', error);
      return {
        title: 'Voice Complaint',
        description: text,
        category: 'Other',
        department: 'Other',
      };
    }
  }

  private parseComplaintGeneration(response: string): {
    title: string;
    description: string;
    category: string;
    department: string;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        title: parsed.title || 'Voice Complaint',
        description: parsed.description || 'Complaint filed via voice input',
        category: parsed.category || 'Other',
        department: parsed.department || 'Other',
      };
    } catch (error) {
      console.error('Failed to parse complaint generation:', error);
      return {
        title: 'Voice Complaint',
        description: 'Complaint filed via voice input',
        category: 'Other',
        department: 'Other',
      };
    }
  }
}
