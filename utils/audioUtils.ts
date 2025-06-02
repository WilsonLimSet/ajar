// Audio utilities for text-to-speech functionality

/**
 * Speaks the provided Indonesian text using the Web Speech API
 * @param text The Indonesian text to speak
 * @param rate The speech rate (0.1 to 10)
 * @param pitch The speech pitch (0 to 2)
 */
export function speakIndonesian(text: string, rate: number = 0.9, pitch: number = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try to use the best available Indonesian voice
    const bestVoice = getBestIndonesianVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event);

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Checks if text-to-speech is supported in the current browser
 * @returns boolean indicating if speech synthesis is available
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Gets available voices for speech synthesis
 * @returns Array of available SpeechSynthesisVoice objects
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  
  // Some browsers (like Chrome) load voices asynchronously
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // If no voices are available yet, try to force loading them
    window.speechSynthesis.cancel();
    return window.speechSynthesis.getVoices();
  }
  
  return voices;
}

/**
 * Gets Indonesian voices available for speech synthesis
 * @returns Array of Indonesian SpeechSynthesisVoice objects
 */
export function getIndonesianVoices(): SpeechSynthesisVoice[] {
  if (!window.speechSynthesis) return [];
  
  return window.speechSynthesis.getVoices().filter(voice => 
    voice.name.includes('Indonesian') ||
    voice.lang.includes('id')
  );
}

/**
 * Priority list of known good Indonesian voices
 * These are voices that are known to sound better for Indonesian
 */
const PREFERRED_INDONESIAN_VOICES = [
  'Google Indonesian Female',
  'Google Indonesian Male',
  'Microsoft Andika - Indonesian',
  'Microsoft Gadis - Indonesian',
  'Microsoft Haruka - Indonesian',
  'Microsoft Zira - Indonesian',
  'Microsoft David - Indonesian',
  'Microsoft Mark - Indonesian',
  'Microsoft Linda - Indonesian',
  'Microsoft Richard - Indonesian',
  'Microsoft Susan - Indonesian',
  'Microsoft Tom - Indonesian',
  'Microsoft Tracy - Indonesian',
  'Microsoft Danny - Indonesian',
  'Microsoft Hanhan - Indonesian',
  'Microsoft Yating - Indonesian',
  'Microsoft Zhiwei - Indonesian',
];

/**
 * Gets the best available Indonesian voice based on a priority list
 * @returns The best available Indonesian voice or null if none are available
 */
export function getBestIndonesianVoice(): SpeechSynthesisVoice | null {
  const indonesianVoices = getIndonesianVoices();
  if (indonesianVoices.length === 0) return null;

  // Try to find a voice from our preferred list
  for (const preferredVoiceName of PREFERRED_INDONESIAN_VOICES) {
    const voice = indonesianVoices.find(v =>
      v.name.toLowerCase() === preferredVoiceName.toLowerCase()
    );
    if (voice) return voice;
  }

  // If no preferred voice is found, return the first Indonesian voice
  return indonesianVoices[0];
}

/**
 * Cancels any ongoing speech
 */
export function cancelSpeech(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
} 