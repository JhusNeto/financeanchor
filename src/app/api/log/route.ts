import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // Log no terminal do servidor
    const timestamp = new Date().toISOString();
    const context = logData.context || 'CLIENT';
    const level = logData.level?.toUpperCase() || 'INFO';
    
    console.log(`[${timestamp}] [${level}] [${context}] ${logData.message}`);
    
    if (logData.error) {
      console.error('Error details:', logData.error);
    }
    
    if (logData.userAgent) {
      console.log('User Agent:', logData.userAgent);
    }
    
    if (logData.url) {
      console.log('URL:', logData.url);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar log:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar log' }, { status: 500 });
  }
} 