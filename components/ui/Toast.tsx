"use client";

import { create } from "zustand";

const useToastStore = create<{ message: string; visible: boolean }>(() => ({ message: "", visible: false }));

let hideTimeout: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string) {
  clearTimeout(hideTimeout);
  useToastStore.setState({ message, visible: true });
  hideTimeout = setTimeout(() => useToastStore.setState({ visible: false }), 2500);
}

export function Toast() {
  const { message, visible } = useToastStore();
  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-40 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[10px] bg-toast px-[18px] py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition duration-200 ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
    >
      {message}
    </div>
  );
}
