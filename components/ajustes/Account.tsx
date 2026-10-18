"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { CheckRow } from "@/components/ui/CheckRow";
import { Drawer } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import {
  PASSWORD_MIN,
  cancelRecovery,
  deleteAccount,
  resendConfirmation,
  sendPasswordReset,
  signIn,
  signOut,
  signUp,
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
  const { available, email, recovering, status, lastSyncedAt } = useCloud();
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
          <span className="text-[13px] text-muted">Conta com e-mail e senha</span>
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

type LoginStep = "entrar" | "criar" | "confirmar" | "esqueci";

function LoginDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<LoginStep>("entrar");
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (next: LoginStep) => {
    setStep(next);
    setError(null);
  };

  const run = async (action: () => Promise<string | null>, onSuccess: () => void) => {
    setBusy(true);
    const failure = await action();
    setBusy(false);
    setError(failure);
    if (!failure) onSuccess();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === "entrar") {
      void run(
        () => signIn(email, password),
        () => {
          setPassword("");
          onClose();
          showToast("Você entrou. Sincronizando seus dados.");
        },
      );
      return;
    }
    if (!agreed) {
      setError("Marque que leu a política de privacidade e os termos.");
      return;
    }
    void run(
      () => signUp(email, password),
      () => {
        setPassword("");
        go("confirmar");
      },
    );
  };

  const close = () => {
    go("entrar");
    onClose();
  };

  const emailField = (
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
  );

  return (
    <Drawer open={open} onClose={close} eyebrow="Conta" title={step === "esqueci" ? "Recuperar senha" : "Entrar no Flow"}>
      {step === "confirmar" && (
        <div className="grid gap-4">
          <div className="grid gap-2 rounded-[12px] bg-accent-soft p-3.5">
            <strong>Confirme seu e-mail</strong>
            <p>
              Enviamos um link para <strong className="break-all">{email.trim()}</strong>. Abra para ativar a conta e depois entre com
              seu e-mail e senha.
            </p>
          </div>
          <p className="text-[13px] text-muted">
            Não chegou? Veja a caixa de spam ou{" "}
            <button
              type="button"
              className={linkStyles}
              disabled={busy}
              onClick={() => void run(() => resendConfirmation(email), () => showToast("Link enviado de novo."))}
            >
              envie de novo
            </button>
            .
          </p>
          {error && <ErrorText>{error}</ErrorText>}
          <Button size="lg" onClick={() => go("entrar")}>
            Voltar para entrar
          </Button>
        </div>
      )}

      {step === "esqueci" && (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(
              () => sendPasswordReset(email),
              () => {
                go("entrar");
                showToast("Se o e-mail tiver conta, o link para criar uma senha nova chega em instantes.");
              },
            );
          }}
        >
          <p className="text-muted">Digite o e-mail da conta. Enviamos um link para você criar uma senha nova.</p>
          {emailField}
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            Enviar link
          </Button>
          <Button size="lg" onClick={() => go("entrar")}>
            Voltar para entrar
          </Button>
        </form>
      )}

      {(step === "entrar" || step === "criar") && (
        <form onSubmit={submit} className="grid gap-4">
          <Segmented
            options={[
              { value: "entrar", label: "Entrar" },
              { value: "criar", label: "Criar conta" },
            ]}
            value={step}
            onChange={go}
          />
          {emailField}
          <Field label="Senha" hint={step === "criar" ? PASSWORD_HINT : undefined}>
            <input
              type="password"
              autoComplete={step === "criar" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputStyles}
            />
          </Field>
          {step === "criar" && (
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
          )}
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            {step === "criar" ? "Criar conta" : "Entrar"}
          </Button>
          {step === "entrar" && (
            <button type="button" className={`${linkStyles} justify-self-start`} onClick={() => go("esqueci")}>
              Esqueci minha senha
            </button>
          )}
          <p className="text-[13px] text-muted">
            Guardamos só o seu e-mail e os dados de estudo, para sincronizar. Nada é vendido nem usado para anúncios.
          </p>
        </form>
      )}
    </Drawer>
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

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}
