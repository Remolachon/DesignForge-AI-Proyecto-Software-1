class AudioService {
  private loginBell: HTMLAudioElement | null = null;
  private successOrder: HTMLAudioElement | null = null;
  private initialized = false;

  private createSound(src: string, volume: number) {
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

  public playLoginBell() {
    this.init();
    if (this.loginBell) {
      this.loginBell.currentTime = 0;
      void this.loginBell.play();
    }
  }

  public playSuccessOrder() {
    this.init();
    if (this.successOrder) {
      this.successOrder.currentTime = 0;
      void this.successOrder.play();
    }
  }
}

// Exportamos un singleton para usarlo en toda la app
export const audioService = new AudioService();