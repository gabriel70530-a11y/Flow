"use client";

import { proTrialOpen } from "@/lib/plan";
import { usePro, useProAccess } from "@/store/pro";

// Marca recursos do Pro. Durante o teste eles ficam liberados e o selo diz isso.
export function ProBadge() {
  const access = useProAccess();
  const subscribed = usePro((state) => state.record !== null);
  const label = access && proTrialOpen() && !subscribed ? "Pro · liberado no teste" : "Pro";
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
      {label}
    </span>
  );
}
