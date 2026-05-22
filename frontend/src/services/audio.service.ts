import { Howl } from 'howler';

// Fallback base64 sounds (tiny beeps) in case real MP3 files are not yet in the /public/sounds folder.
// These are simple minimal sounds so the system works out of the box.
const FALLBACK_BELL = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'; // Simple placeholder
const FALLBACK_SUCCESS = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'; // Simple placeholder

class AudioService {
  private loginBell: Howl | null = null;
  private successOrder: Howl | null = null;
  private initialized = false;

  private init() {
    if (this.initialized || typeof window === 'undefined') return;

    // Configurado para cargar archivos reales desde public/sounds/
    // Si no existen, howler fallará silenciosamente o usaremos fallbacks después, 
    // pero idealmente deberías colocar tus propios archivos MP3 en public/sounds/

    this.loginBell = new Howl({
      src: ['/sounds/happy-bell-alert.ogg'], // Ruta real al archivo de la campanita
      volume: 0.5,
      // fallback en caso de error (opcional)
      onloaderror: (id, err) => {
        console.warn('AudioService: No se encontró /sounds/happy-bell-alert.ogg. Asegúrate de añadir el archivo en la carpeta public/sounds/.');
      }
    });

    this.successOrder = new Howl({
      src: ['/sounds/happy-bell-alert.ogg'], // Ruta real al archivo de éxito de pedido
      volume: 0.6,
      onloaderror: (id, err) => {
        console.warn('AudioService: No se encontró /sounds/success-order.mp3. Asegúrate de añadir el archivo en la carpeta public/sounds/.');
      }
    });

    this.initialized = true;
  }

  public playLoginBell() {
    this.init();
    if (this.loginBell) {
      this.loginBell.play();
    }
  }

  public playSuccessOrder() {
    this.init();
    if (this.successOrder) {
      this.successOrder.play();
    }
  }
}

// Exportamos un singleton para usarlo en toda la app
export const audioService = new AudioService();
