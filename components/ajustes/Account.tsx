"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { CheckRow } from "@/components/ui/CheckRow";
import { Drawer } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import { deleteAccount, sendMagicLink, signInWithGoogle, signOut, syncNow, useCloud, type SyncStatus } from "@/store/cloud";

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

// Parte de cima do card "Conta e dados": entrar, estado da sincronização e sair.
export function AccountSection() {
  const { available, email, provider, status, lastSyncedAt } = useCloud();
  const [loginOpen, setLoginOpen] = useState(false);

  if (!available) {
    return (
      <p className="text-muted">
        A conta ainda não está disponível neste endereço. Seus dados ficam só neste navegador; para levar a outro aparelho, use o
        backup.
      </p>
    );
  }

  if (!email) {
    return (
      <div className="grid gap-3">
        <p className="text-muted">
          Seus dados estão só neste navegador. Com uma conta, o Flow guarda uma cópia na nuvem e você continua de onde parou em outro
          aparelho.
        </p>
        <p className="text-[13px] text-muted">A conta é opcional e gratuita. Sem ela, tudo continua funcionando.</p>
        <Button variant="primary" size="lg" className="justify-self-start" onClick={() => setLoginOpen(true)}>
          Entrar ou criar conta
        </Button>
        <LoginDrawer open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <div className="grid gap-3.5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-heading font-bold text-accent">
          {email.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <strong className="block break-all">{email}</strong>
          <span className="text-[13px] text-muted">{provider === "google" ? "Entrou com Google" : "Entrou com link no e-mail"}</span>
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
            showToast("Você saiu da conta. Seus dados continuam neste aparelho.");
          }}
        >
          Sair
        </Button>
      </div>
      <p className="text-[13px] text-muted">Ao sair, seus dados continuam neste aparelho.</p>
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

function LoginDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<string | null>, onSuccess?: () => void) => {
    if (!agreed) {
      setError("Marque que leu a política de privacidade e os termos.");
      return;
    }
    setBusy(true);
    const failure = await action();
    setBusy(false);
    setError(failure);
    if (!failure) onSuccess?.();
  };

  const sendLink = (event: FormEvent) => {
    event.preventDefault();
    void run(() => sendMagicLink(email), () => setSentTo(email.trim()));
  };

  const close = () => {
    setSentTo(null);
    setError(null);
    onClose();
  };

  return (
    <Drawer open={open} onClose={close} eyebrow="Conta" title="Entrar no Flow">
      {sentTo ? (
        <div className="grid gap-4">
          <div className="grid gap-2 rounded-[12px] bg-accent-soft p-3.5">
            <strong>Confira seu e-mail</strong>
            <p>
              Enviamos um link para <strong className="break-all">{sentTo}</strong>. Abra neste aparelho para entrar. O link vale por 1
              hora.
            </p>
          </div>
          <p className="text-[13px] text-muted">
            Não chegou? Veja a caixa de spam ou{" "}
            <button type="button" className={linkStyles} disabled={busy} onClick={() => void run(() => sendMagicLink(sentTo))}>
              envie de novo
            </button>
            .
          </p>
          {error && <ErrorText>{error}</ErrorText>}
          <Button size="lg" onClick={() => setSentTo(null)}>
            Usar outro e-mail
          </Button>
        </div>
      ) : (
        <form onSubmit={sendLink} className="grid gap-4">
          <p className="text-muted">Sem senha: entre com o Google ou receba um link no e-mail. Se ainda não tem conta, ela é criada agora.</p>
          <div className="grid gap-1">
            <CheckRow
              checked={agreed}
              onToggle={() => {
                setAgreed(!agreed);
                setError(null);
              }}
              label="Li a política de privacidade e os termos."
              hint="Se tenho menos de 18 anos, um responsável sabe que vou criar a conta."
            />
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/privacidade" target="_blank" className={linkStyles}>
                Política de privacidade
              </Link>
              <Link href="/termos" target="_blank" className={linkStyles}>
                Termos de uso
              </Link>
            </p>
          </div>
          <Button variant="primary" size="lg" disabled={busy} onClick={() => void run(signInWithGoogle)}>
            Entrar com Google
          </Button>
          <p className="flex items-center gap-3 text-[13px] text-muted before:flex-1 before:border-t before:border-line after:flex-1 after:border-t after:border-line">
            ou
          </p>
          <Field label="E-mail">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              className={inputStyles}
            />
          </Field>
          <Button type="submit" size="lg" disabled={busy}>
            Receber link no e-mail
          </Button>
          {error && <ErrorText>{error}</ErrorText>}
          <p className="text-[13px] text-muted">
            Guardamos só o seu e-mail e os dados de estudo, para sincronizar. Nada é vendido nem usado para anúncios.
          </p>
        </form>
      )}
    </Drawer>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}
