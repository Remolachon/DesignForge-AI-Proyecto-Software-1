class AudioService {
  private loginBell: HTMLAudioElement | null = null;
  private successOrder: HTMLAudioElement | null = null;
  private initialized = false;

  private init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.loginBell = this.createAudio('/sounds/happy-bell-alert.ogg');
    this.successOrder = this.createAudio('/sounds/success-order.mp3');

    this.initialized = true;
  }

  private createAudio(src: string) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0.6;
    return audio;
  }

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

    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

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
