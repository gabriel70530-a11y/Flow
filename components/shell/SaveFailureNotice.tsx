"use client";

import { linkStyles } from "@/components/ui/Button";
import { retrySave, useSaveStatus } from "@/store/study-store";

export function SaveFailureNotice() {
  const failed = useSaveStatus((state) => state.failed);
  if (!failed) return null;

  return (
    <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm shadow-card">
      <span>
        <strong className="text-danger">Não foi possível salvar.</strong> O navegador recusou a gravação (armazenamento
        cheio ou bloqueado). O que está na tela continua aqui, mas pode se perder ao fechar a aba.
      </span>
      <button type="button" onClick={retrySave} className={linkStyles}>
        Tentar de novo
      </button>
    </div>
  );
}
