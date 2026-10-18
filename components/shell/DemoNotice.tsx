"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { linkStyles } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { useStudyStore } from "@/store/study-store";

export function DemoNotice() {
  const router = useRouter();
  const resetData = useStudyStore((state) => state.resetData);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timeout = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timeout);
  }, [confirming]);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    resetData();
    showToast("Dados apagados.");
    router.push("/materias");
  };

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-edge bg-accent-soft px-4 py-3 text-sm md:px-5">
      <span>Você está vendo dados de exemplo.</span>
      <button type="button" onClick={handleClick} className={linkStyles}>
        {confirming ? "Clique de novo para confirmar" : "Apagar e começar do zero"}
      </button>
    </div>
  );
}
