import { useCallback, useRef } from 'react';

export function useVoiceAlert() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const playVoiceAlert = useCallback(async (text: string) => {
    // Check if sound alerts are enabled
    const settings = localStorage.getItem('userSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (!parsed.soundAlerts) return;
    }

    // Don't overlap alerts
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text,
            voice: 'alloy' 
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Voice alert error:', error);
      isPlayingRef.current = false;
    }
  }, []);

  return { playVoiceAlert };
}
