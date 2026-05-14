import { resolveAssetPath } from "./assets";

export type SoundEffectName = "correct" | "wrong" | "wheel" | "reward";

const SOUND_FILES: Record<SoundEffectName, string> = {
  correct: "/sounds/correct.wav",
  wrong: "/sounds/wrong.wav",
  wheel: "/sounds/wheel.wav",
  reward: "/sounds/reward.wav"
};

export function playSoundEffect(effect: SoundEffectName, enabled: boolean) {
  if (!enabled) {
    return;
  }

  const audio = new Audio(resolveAssetPath(SOUND_FILES[effect]));
  audio.volume = effect === "wheel" ? 0.25 : 0.4;
  void audio.play().catch(() => undefined);
}

export function startLoopingSoundEffect(effect: SoundEffectName, enabled: boolean) {
  if (!enabled) {
    return null;
  }

  const audio = new Audio(resolveAssetPath(SOUND_FILES[effect]));
  audio.loop = true;
  audio.volume = effect === "wheel" ? 0.22 : 0.4;
  void audio.play().catch(() => undefined);
  return audio;
}

export function stopAudioPlayback(audio: HTMLAudioElement | null) {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
