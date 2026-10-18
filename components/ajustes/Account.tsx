"use client";

import { useState, type FormEvent } from "react";
import { ErrorText } from "@/components/conta/AuthForm";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import {
  PASSWORD_MIN,
  cancelRecovery,
  deleteAccount,
  signOut,
  syncNow,
  updatePassword,
  useCloud,
  type SyncStatus,
} from "@/store/cloud";

function syncText(status: SyncStatus, lastSyncedAt: number | null): string {
  if (status === "sincronizando") return "Sincronizando…";
  if (status === "offline") return "Sem internet. O que você fizer fica salvo aqui e vai para a nuvem quando a conexão voltar.";
  if (status === "erro") return "Não foi possível sincronizar agora. Seus dados continuam salvos aqui.";
  if (!lastSyncedAt) return "Aguardando a primeira sincronização.";
  const date = new Date(lastSyncedAt);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const day = toDateKey(date) === toDateKey(new Date()) ? "hoje" : `em ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  return `Sincronizado ${day} às ${time}`;
}

const DOT_COLORS: Record<SyncStatus, string> = {
  ocioso: "bg-success",
  sincronizando: "bg-muted",
  offline: "bg-muted",
  erro: "bg-danger",
};

const PASSWORD_HINT = `Pelo menos ${PASSWORD_MIN} caracteres.`;

// Parte de cima do card "Conta e dados": entrar, estado da sincronização e sair.
export function AccountSection() {
  const { available, email, provider, recovering, status, lastSyncedAt } = useCloud();

  // Só acontece no desenvolvimento local sem o Supabase: em produção, o app nem abre sem conta.
  if (!available || !email) {
    return <p className="text-muted">A conta não está configurada neste ambiente. Os dados ficam só neste navegador.</p>;
  }

  return (
    <div className="grid gap-3.5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-heading font-bold text-accent">
          {email.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <strong className="block break-all">{email}</strong>
          <span className="text-[13px] text-muted">{provider === "google" ? "Conta Google" : "Conta com e-mail e senha"}</span>
        </div>
      </div>
      <p role="status" className="flex items-start gap-2 text-sm">
        <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_COLORS[status]}`} />
        <span className="tabular-nums">{syncText(status, lastSyncedAt)}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {status !== "offline" && (
          <Button onClick={() => void syncNow()} disabled={status === "sincronizando"}>
            Sincronizar agora
          </Button>
        )}
        <Button
          onClick={async () => {
            await signOut();
            showToast("Você saiu da conta.");
          }}
        >
          Sair
        </Button>
      </div>
      <p className="text-[13px] text-muted">Ao sair, seus dados continuam neste aparelho e voltam quando você entrar de novo.</p>
      <NewPasswordDrawer open={recovering} email={email} />
    </div>
  );
}

export function DeleteAccountButton() {
  const email = useCloud((state) => state.email);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!email) return null;

  const remove = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    const failure = await deleteAccount();
    setError(failure);
    if (!failure) showToast("Conta excluída. Os dados deste aparelho continuam aqui.");
  };

  return (
    <div className="grid gap-1">
      <Button onClick={remove} className="justify-self-start">
        {confirming ? "Clique de novo para excluir" : "Excluir conta"}
      </Button>
      <p className="text-[13px] text-muted">Apaga a conta e a cópia na nuvem. Os dados deste aparelho ficam.</p>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// Aberto pelo link de recuperação: a pessoa já está conectada e só escolhe a senha nova.
function NewPasswordDrawer({ open, email }: { open: boolean; email: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const failure = await updatePassword(password);
    setBusy(false);
    setError(failure);
    if (!failure) {
      setPassword("");
      showToast("Senha nova salva.");
    }
  };

  return (
    <Drawer open={open} onClose={cancelRecovery} eyebrow="Conta" title="Nova senha">
      <form onSubmit={save} className="grid gap-4">
        <p className="text-muted">
          Você abriu o link de recuperação. Escolha a senha nova da conta <strong className="break-all">{email}</strong>.
        </p>
        <Field label="Nova senha" hint={PASSWORD_HINT}>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputStyles}
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" variant="primary" size="lg" disabled={busy}>
          Salvar senha
        </Button>
      </form>
    </Drawer>
  );
}
