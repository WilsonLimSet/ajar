"use client";

import { useState, useEffect } from 'react';
import { usePwa } from '../context/PwaContext';

export default function InstallPrompt() {
  const { isPwa, deferredPrompt, showInstallPrompt } = usePwa();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the prompt if we have a deferred prompt and we're not in PWA mode
    if (deferredPrompt && !isPwa) {
      setIsVisible(true);
    }
  }, [deferredPrompt, isPwa]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">Install Ajar</h2>
        
        <div className="mb-6 text-black">
          <p className="mb-4">Install Ajar on your device for the best experience:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Access your flashcards offline</li>
            <li>Faster loading times</li>
            <li>Better performance</li>
            <li>Native app-like experience</li>
          </ul>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Not Now
          </button>
          <button
            onClick={() => {
              showInstallPrompt();
              setIsVisible(false);
            }}
            className="px-4 py-2 bg-ajar-blue text-white rounded-md hover:bg-ajar-dark-blue"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
} 