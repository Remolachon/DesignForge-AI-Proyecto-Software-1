import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioService } from '@/services/audio.service';

describe('Audio Service', () => {
  const originalAudio = (window as any).Audio;
  const originalAudioContext = (window as any).AudioContext;
  const originalWebkitAudioContext = (window as any).webkitAudioContext;

  const mockPlay = vi.fn();
  const mockAddEventListener = vi.fn();
  const mockAudioConstructor = vi.fn();
  
  class MockAudio {
    preload = '';
    volume = 1;
    addEventListener = mockAddEventListener;
    play = () => mockPlay();
    constructor(public src: string) {
      mockAudioConstructor(src);
    }
  }
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlay.mockResolvedValue(undefined);
    
    // resetear estado interno de singleton
    (audioService as any).initialized = false;
    (audioService as any).loginBell = null;
    (audioService as any).successOrder = null;
    (audioService as any).newNotification = null;

    (window as any).Audio = MockAudio;
  });

  afterEach(() => {
    (window as any).Audio = originalAudio;
    (window as any).AudioContext = originalAudioContext;
    (window as any).webkitAudioContext = originalWebkitAudioContext;
  });

  describe('Audio API soportada', () => {
    test('playLoginBell reproduce audio configurado', () => {
      audioService.playLoginBell();
      expect(mockAudioConstructor).toHaveBeenCalledWith('/sounds/happy-bell-alert.ogg');
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    test('playSuccessOrder reproduce audio configurado', () => {
      audioService.playSuccessOrder();
      expect(mockAudioConstructor).toHaveBeenCalledWith('/sounds/elevator-bell.ogg');
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    test('playNewNotification reproduce audio configurado', () => {
      audioService.playNewNotification();
      expect(mockAudioConstructor).toHaveBeenCalledWith('/sounds/new-notification.ogg');
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

  });

  describe('Fallback Tone', () => {
    test('usa fallback de oscillator si Audio es undefined', () => {
      delete (window as any).Audio;

      const mockCreateOscillator = vi.fn();
      const mockCreateGain = vi.fn();
      const mockConnect = vi.fn();
      const mockStart = vi.fn();
      const mockStop = vi.fn();

      const oscillatorMock = {
        type: '',
        frequency: { value: 0 },
        connect: mockConnect,
        start: mockStart,
        stop: mockStop,
      };

      const gainMock = {
        gain: { value: 0 },
        connect: mockConnect,
      };

      mockCreateOscillator.mockReturnValue(oscillatorMock);
      mockCreateGain.mockReturnValue(gainMock);

      class MockAudioContext {
        createOscillator = mockCreateOscillator;
        createGain = mockCreateGain;
        destination = {};
        currentTime = 0;
        close = vi.fn().mockResolvedValue(undefined);
      }

      (window as any).AudioContext = MockAudioContext;

      audioService.playLoginBell();

      expect(mockCreateOscillator).toHaveBeenCalledTimes(1);
      expect(mockCreateGain).toHaveBeenCalledTimes(1);
      expect(oscillatorMock.type).toBe('sine');
      expect(oscillatorMock.frequency.value).toBe(880);
      expect(gainMock.gain.value).toBeCloseTo(0.03);
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(mockStart).toHaveBeenCalledTimes(1);
      expect(mockStop).toHaveBeenCalledWith(0.12);
    });

    test('no falla si AudioContext tampoco existe', () => {
      delete (window as any).Audio;
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      expect(() => {
        audioService.playSuccessOrder();
      }).not.toThrow();
    });
  });
});
