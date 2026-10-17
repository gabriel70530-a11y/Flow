import { hasProAccess, currentEntitlement } from "@/lib/plan";

// Marca recursos do Pro. Durante o teste eles ficam liberados e o selo diz isso.
export function ProBadge() {
  const entitlement = currentEntitlement();
  if (!hasProAccess(entitlement)) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
      {entitlement.source === "teste" ? "Pro · liberado no teste" : "Pro"}
    </span>
  );
}
