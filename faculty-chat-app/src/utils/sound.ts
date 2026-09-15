import { Platform } from "react-native";

export async function playNotificationSound() {
  try {
    const AudioCtx =
      typeof window !== "undefined"
        ? (window as any).AudioContext || (window as any).webkitAudioContext
        : null;

    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: C5 (523.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: G5 (783.99Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);

      setTimeout(() => ctx.close(), 500);
      return;
    }

    // Audio element fallback for web environments
    if (typeof Audio !== "undefined") {
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/sounds_library/notifications/ding.ogg"
      );
      audio.volume = 0.7;
      audio.play().catch(() => {});
    }
  } catch (err) {
    console.log("Notification sound playback error:", err);
  }
}
