let context: AudioContext | undefined;
export function chime(enabled: boolean, complete = false) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    (complete ? [523, 659, 784, 1046] : [784, 1046]).forEach((frequency, i) => {
      const oscillator = context!.createOscillator(),
        gain = context!.createGain();
      const start = context!.currentTime + i * 0.1;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.6);
    });
  } catch {
    /* Sound is optional on browsers without Web Audio. */
  }
}
