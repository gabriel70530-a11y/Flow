import type { Metadata } from "next";
import { TimerScreen } from "@/components/timer/TimerScreen";

export const metadata: Metadata = { title: "Timer" };

export default function TimerPage() {
  return <TimerScreen />;
}
