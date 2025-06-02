"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface PwaContextType {
  isPwa: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isPwa: false,
  deferredPrompt: null,
  showInstallPrompt: () => {},
});

export function PwaProvider({ children }: { children: ReactNode }) {
  const [isPwa, setIsPwa] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if the app is running as a PWA
    const isRunningAsPwa = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsPwa(isRunningAsPwa);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const showInstallPrompt = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We no longer need the prompt. Clear it up
    setDeferredPrompt(null);

    // Optionally, send analytics event with outcome
    console.log(`User response to the install prompt: ${outcome}`);
  };

  return (
    <PwaContext.Provider value={{ isPwa, deferredPrompt, showInstallPrompt }}>
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
} 