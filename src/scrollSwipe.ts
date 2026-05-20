export interface ScrollSwipeOptions {
  sensitivity: number;
  wheelSensitivity?: number;
  onStep: (direction: 1 | -1) => void;
  axis?: 'y' | 'x';
  tapThreshold?: number;
}

export function attachScrollSwipe(el: HTMLElement, opts: ScrollSwipeOptions): () => void {
  const sens = opts.sensitivity;
  const wheelSens = opts.wheelSensitivity ?? 100;
  const tapThreshold = opts.tapThreshold ?? 12;
  const axis = opts.axis ?? 'y';

  let down = false;
  let startX = 0, startY = 0, lastX = 0, lastY = 0;
  let accumulator = 0;
  let swiping = false;
  let hasCaptured = false;
  let pointerId: number | null = null;
  let wheelAccumulator = 0;

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    accumulator = 0;
    swiping = false;
    hasCaptured = false;
    pointerId = e.pointerId;
    // Do NOT capture yet — wait until swipe is confirmed so clicks fire normally
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
      const movedInAxis = axis === 'y' ? totalDy : totalDx;
      if (movedInAxis > tapThreshold) {
        swiping = true;
        try { el.setPointerCapture(e.pointerId); hasCaptured = true; } catch {}
      }
      return; // Don't accumulate until swipe is confirmed
    }

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
    if (hasCaptured) {
      try { el.releasePointerCapture(e.pointerId); } catch {}
      hasCaptured = false;
    }
  }

  function onPointerCancel(): void {
    down = false;
    pointerId = null;
    hasCaptured = false;
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const pixels = e.deltaMode === 0 ? e.deltaY : e.deltaY * 40;
    wheelAccumulator -= pixels;

    if (wheelAccumulator >= wheelSens) {
      while (wheelAccumulator >= wheelSens) {
        wheelAccumulator -= wheelSens;
        opts.onStep(1);
      }
      wheelAccumulator = 0; // Reset remainder to avoid cross-event carryover
    } else if (wheelAccumulator <= -wheelSens) {
      while (wheelAccumulator <= -wheelSens) {
        wheelAccumulator += wheelSens;
        opts.onStep(-1);
      }
      wheelAccumulator = 0;
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
