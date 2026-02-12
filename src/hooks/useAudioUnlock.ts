import { useEffect, useRef, useCallback } from 'react';

// Mobile browsers require user interaction to unlock audio
// This hook handles unlocking speech synthesis on first user interaction
export function useAudioUnlock() {
  const isUnlockedRef = useRef(false);

  const unlockAudio = useCallback(() => {
    if (isUnlockedRef.current) return;
    
    // Try to unlock speech synthesis
    if ('speechSynthesis' in window) {
      // Create a silent utterance to unlock
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      utterance.rate = 10; // Fast to be quick
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();
    }
    
    isUnlockedRef.current = true;
    
    // Remove listeners after unlock
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
    // Add listeners for first user interaction
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    // Also preload voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, [unlockAudio]);

  return { isUnlocked: isUnlockedRef.current };
}
