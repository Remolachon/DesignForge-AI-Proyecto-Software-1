class AudioService {
  private loginBell: HTMLAudioElement | null = null;
  private successOrder: HTMLAudioElement | null = null;
  private initialized = false;

  private createSound(src: string, volume: number) {
    // Guard: evitar usar API de navegador en SSR o entornos sin soporte
    if (typeof window === 'undefined' || typeof (window as any).Audio === 'undefined') {
      return null;
    }

    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    audio.addEventListener('error', () => {
      console.warn(`AudioService: No se pudo cargar ${src}.`);
    });
    return audio;
  }

  private init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.loginBell = this.createSound('/sounds/happy-bell-alert.ogg', 0.5);
    this.successOrder = this.createSound('/sounds/elevator-bell.ogg', 0.6);

    this.initialized = true;
  }

  // keep only createSound (used above) and centralized playAudio

  private playAudio(audio: HTMLAudioElement | null, fallbackFrequency: number) {
    if (!audio) {
      this.playFallbackTone(fallbackFrequency);
      return;
    }

    audio.currentTime = 0;

    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        this.playFallbackTone(fallbackFrequency);
      });
    }
  }

  private playFallbackTone(frequency: number) {
    if (typeof window === 'undefined') return;

    const AudioContextCtor = (window as any).AudioContext ?? (window as any).webkitAudioContext;

    if (!AudioContextCtor) return;

    try {
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.03;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);

      oscillator.onended = () => {
        context.close().catch(() => {});
      };
    } catch {
      // Silently ignore audio failures so auth and marketplace flows never break.
    }
  }

  public playLoginBell() {
    this.init();
    this.playAudio(this.loginBell, 880);
  }

  public playSuccessOrder() {
    this.init();
    this.playAudio(this.successOrder, 660);
  }
}

// Exportamos un singleton para usarlo en toda la app
export const audioService = new AudioService();