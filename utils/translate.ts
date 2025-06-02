interface TranslationResponse {
  text: string;
  translation: string;
}

export async function translateText(text: string): Promise<TranslationResponse> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    return {
      text,
      translation: data.translation
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      text,
      translation: 'Translation failed'
    };
  }
} 