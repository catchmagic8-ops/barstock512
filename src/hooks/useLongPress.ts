import { useCallback, useRef } from "react";

export interface LongPressBind {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

interface Options {
  /** ms the user has to hold before the menu fires */
  delay?: number;
  /** movement in px that cancels the press (scrolling) */
  moveTolerance?: number;
  disabled?: boolean;
  /** allow the press to start on the element itself even if it is a button/link */
  allowInteractive?: boolean;
}

/**
 * Press-and-hold detection that works for touch, pen and mouse.
 * Cancels on scroll/drag, and also maps right-click to the same action
 * so the flow is identical on desktop.
 */
export function useLongPress(onLongPress: () => void, options: Options = {}): LongPressBind {
  const { delay = 480, moveTolerance = 10, disabled = false, allowInteractive = false } = options;
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    origin.current = null;
  }, []);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      // ignore presses that start on an interactive control
      const target = allowInteractive ? null : (e.target as HTMLElement | null);
      if (target?.closest("button, a, input, textarea, select, [role='button'], [data-no-longpress]")) return;
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        timer.current = null;
        if (navigator.vibrate) {
          try { navigator.vibrate(12); } catch { /* ignore */ }
        }
        onLongPress();
      }, delay);
    },
    [allowInteractive, delay, disabled, onLongPress]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      const dx = Math.abs(e.clientX - origin.current.x);
      const dy = Math.abs(e.clientY - origin.current.y);
      if (dx > moveTolerance || dy > moveTolerance) clear();
    },
    [clear, moveTolerance]
  );

  const end = useCallback(
    (e: React.PointerEvent) => {
      clear();
      if (fired.current) {
        // swallow the click that follows the long press
        e.preventDefault();
        e.stopPropagation();
        fired.current = false;
      }
    },
    [clear]
  );

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e) => {
      if (disabled) return;
      e.preventDefault();
      onLongPress();
    },
    style: disabled ? undefined : { WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" },
  };
}
