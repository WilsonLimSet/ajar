"use client";

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakIndonesian, cancelSpeech } from '@/utils/audioUtils';

interface AudioButtonProps {
  text: string;
  className?: string;
}

export default function AudioButton({ text, className = '' }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async () => {
    if (isPlaying) {
      cancelSpeech();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      await speakIndonesian(text, 1);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
    >
      {isPlaying ? (
        <VolumeX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
} 