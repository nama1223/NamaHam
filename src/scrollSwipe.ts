export interface ScrollSwipeOptions {
  sensitivity: number;
  wheelSensitivity?: number;
  onStep: (direction: 1 | -1) => void;
  onTap?: (event: PointerEvent) => void;
  axis?: 'y' | 'x';
  tapThreshold?: number;
}

export function attachScrollSwipe(el: HTMLElement, opts: ScrollSwipeOptions): () => void {
  const sens = opts.sensitivity;
  const wheelSens = opts.wheelSensitivity ?? Math.max(40, sens);
  const tapThreshold = opts.tapThreshold ?? 6;
  const axis = opts.axis ?? 'y';

  let down = false;
  let startX = 0, startY = 0, lastX = 0, lastY = 0;
  let accumulator = 0;
  let swiping = false;
  let pointerId: number | null = null;
  let wheelAccumulator = 0;

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    accumulator = 0;
    swiping = false;
    pointerId = e.pointerId;
    try { el.setPointerCapture(e.pointerId); } catch {}
  }

  function onPointerMove(e: PointerEvent): void {
    if (!down || e.pointerId !== pointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const totalDx = Math.abs(e.clientX - startX);
    const totalDy = Math.abs(e.clientY - startY);
    if (!swiping) {
      if (axis === 'y' && totalDy > tapThreshold) swiping = true;
      else if (axis === 'x' && totalDx > tapThreshold) swiping = true;
    }
    if (!swiping) return;
    const delta = axis === 'y' ? -dy : dx;
    accumulator += delta;
    while (accumulator >= sens) {
      accumulator -= sens;
      opts.onStep(1);
    }
    while (accumulator <= -sens) {
      accumulator += sens;
      opts.onStep(-1);
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!down || e.pointerId !== pointerId) return;
    down = false;
    pointerId = null;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    if (!swiping && opts.onTap) opts.onTap(e);
  }

  function onPointerCancel(): void {
    down = false;
    pointerId = null;
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    wheelAccumulator -= e.deltaY;
    while (wheelAccumulator >= wheelSens) {
      wheelAccumulator -= wheelSens;
      opts.onStep(1);
    }
    while (wheelAccumulator <= -wheelSens) {
      wheelAccumulator += wheelSens;
      opts.onStep(-1);
    }
  }

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);
  el.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
    el.removeEventListener('wheel', onWheel);
  };
}
