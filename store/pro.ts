import { create } from "zustand";
import { currentEntitlement, hasProAccess, proTrialOpen, type ProRecord } from "@/lib/plan";

// A assinatura confirmada pelo servidor. store/cloud.ts lê da conta e guarda uma cópia no aparelho, para valer sem internet.
export const usePro = create<{ record: ProRecord | null }>(() => ({ record: null }));

export function proAccessNow(): boolean {
  return hasProAccess(currentEntitlement(usePro.getState().record, new Date()));
}

// Sem registro não há data para comparar. Assim o relógio só é lido no navegador, nunca na pré-renderização.
export function useProAccess(): boolean {
  const record = usePro((state) => state.record);
  if (record === null) return proTrialOpen();
  return hasProAccess(currentEntitlement(record, new Date()));
}
