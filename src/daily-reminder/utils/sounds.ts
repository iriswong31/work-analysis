// ==========================================
// 提醒音效管理
// ==========================================

import { ReminderUrgency } from '@/types/reminder';

/** 使用 Web Audio API 生成提醒音 */
function createTone(frequency: number, duration: number, volume: number = 0.3): Promise<void> {
  return new Promise((resolve) => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = 'sine';

    // 柔和的淡入淡出
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    oscillator.onended = () => {
      ctx.close();
      resolve();
    };
  });
}

/** 温柔的提醒音 - 轻柔的两声 */
async function gentleSound(): Promise<void> {
  await createTone(523, 0.4, 0.2); // C5
  await new Promise(r => setTimeout(r, 200));
  await createTone(659, 0.6, 0.2); // E5
}

/** 坚定的提醒音 - 清晰的三声 */
async function firmSound(): Promise<void> {
  await createTone(523, 0.3, 0.3); // C5
  await new Promise(r => setTimeout(r, 150));
  await createTone(659, 0.3, 0.3); // E5
  await new Promise(r => setTimeout(r, 150));
  await createTone(784, 0.5, 0.3); // G5
}

/** 紧急的提醒音 - 强烈的连续提示 */
async function urgentSound(): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await createTone(784, 0.2, 0.4); // G5
    await new Promise(r => setTimeout(r, 100));
    await createTone(880, 0.2, 0.4); // A5
    await new Promise(r => setTimeout(r, 100));
  }
}

/** 完成的愉悦音 */
export async function playCompleteSound(): Promise<void> {
  await createTone(523, 0.2, 0.25); // C5
  await new Promise(r => setTimeout(r, 100));
  await createTone(659, 0.2, 0.25); // E5
  await new Promise(r => setTimeout(r, 100));
  await createTone(784, 0.2, 0.25); // G5
  await new Promise(r => setTimeout(r, 100));
  await createTone(1047, 0.5, 0.25); // C6
}

/** 播放提醒音 */
export async function playReminderSound(urgency: ReminderUrgency): Promise<void> {
  try {
    switch (urgency) {
      case 'gentle':
        await gentleSound();
        break;
      case 'firm':
        await firmSound();
        break;
      case 'urgent':
        await urgentSound();
        break;
    }
  } catch {
    // Audio API 可能被浏览器限制，静默失败
    console.warn('Audio playback blocked by browser policy');
  }
}
