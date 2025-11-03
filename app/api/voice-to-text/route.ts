import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid audio format. Allowed: WAV, MP3, M4A, WebM' },
        { status: 400 }
      );
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum 25MB allowed.' },
        { status: 400 }
      );
    }

    // Convert audio to buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create new FormData for AI service
    const aiFormData = new FormData();
    const blob = new Blob([buffer], { type: audioFile.type });
    aiFormData.append('file', blob, audioFile.name);
    
    // Call backend AI audio transcription endpoint
    const response = await fetch(`${BACKEND_URL}/api/ai/audio/transcribe`, {
      method: 'POST',
      body: aiFormData,
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Voice-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    );
  }
}
