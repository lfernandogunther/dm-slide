// Every motion in the player goes through here: one easing, every running motion finished at once
// by the next key (motion never makes a key wait), and a plain fade when the system asks for less motion.
export const EASE = 'cubic-bezier(.2,.8,.2,1)';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const running = new Set<Animation>();

const FADE = { in: [{ opacity: 0 }, { opacity: 1 }], out: [{ opacity: 1 }, { opacity: 0 }] };
const FADE_MS = 180;

export interface MotionOptions extends KeyframeAnimationOptions {
  /** What this motion becomes under reduced motion: fading the element in (the default) or out. */
  fade?: 'in' | 'out';
}

export const reduceMotion = (): boolean => reduced.matches;

export function animate(el: Element, keyframes: Keyframe[], options: MotionOptions = {}): Animation {
  const { fade = 'in', ...timing } = options;
  const a = reduced.matches
    ? el.animate(FADE[fade], { ...timing, easing: 'linear', duration: Math.min(Number(timing.duration ?? FADE_MS), FADE_MS) })
    : el.animate(keyframes, { easing: EASE, ...timing });
  running.add(a);
  const drop = () => running.delete(a);
  a.addEventListener('finish', drop);
  a.addEventListener('cancel', drop);
  return a;
}

/** Jumps every running motion to its last frame, so a key acts on a settled player. */
export function finishAll(): void {
  for (const a of [...running]) a.finish();
}
