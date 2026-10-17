let audio: AudioContext | undefined;

// Navegadores só liberam som depois de um clique, então o contexto nasce no botão Iniciar.
export function unlockAudio() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
  } catch {
    audio = undefined;
  }
}

export function chime() {
  if (!audio) return;
  for (const offset of [0, 0.25, 0.5]) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const startAt = audio.currentTime + offset;
    oscillator.frequency.value = 880;
    oscillator.connect(gain).connect(audio.destination);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.22);
  }
}
