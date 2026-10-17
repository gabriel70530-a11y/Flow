"use client";

import { useSyncExternalStore } from "react";

// Um relógio compartilhado que só repinta a tela. O tempo do timer vem de startedAt, não destes ticks.
let now = 0;
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    interval = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 250);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(interval);
  };
}

const subscribeNever = () => () => {};
const getNow = () => now;
const getServerNow = () => 0;

export function useNow(active: boolean): number {
  return useSyncExternalStore(active ? subscribe : subscribeNever, getNow, getServerNow);
}
