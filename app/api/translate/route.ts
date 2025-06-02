import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Using MyMemory Translation API (free, no API key required)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=id|en`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();

    if (!response.ok || data.responseStatus !== 200) {
      throw new Error(data.error?.message || 'Translation failed');
    }

    return NextResponse.json({
      translation: data.responseData.translatedText
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 