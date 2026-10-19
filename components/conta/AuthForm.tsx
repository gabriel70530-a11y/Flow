"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { CheckRow } from "@/components/ui/CheckRow";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { isMinor, validateBirthYear } from "@/lib/age";
import {
  PASSWORD_MIN,
  resendConfirmation,
  saveBirthYear,
  sendPasswordReset,
  signIn,
  googleLoginOpen,
  signInWithGoogle,
  signUp,
} from "@/store/cloud";

type Step = "entrar" | "criar" | "confirmar" | "esqueci";

const currentYear = () => new Date().getFullYear();

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<string | null>, onSuccess?: () => void) => {
    setBusy(true);
    const failure = await action();
    setBusy(false);
    setError(failure);
    if (!failure) onSuccess?.();
  };
  return { error, setError, busy, run };
}

// Ano de nascimento e, para menores, a ciência do responsável. Usado no cadastro e depois do primeiro login pelo Google.
function AgeFields({
  birthYear,
  guardian,
  onBirthYear,
  onGuardian,
}: {
  birthYear: string;
  guardian: boolean;
  onBirthYear: (value: string) => void;
  onGuardian: () => void;
}) {
  const year = Number(birthYear);
  const minor = !validateBirthYear(birthYear, currentYear()) && isMinor(year, currentYear());
  return (
    <>
      <Field label="Ano de nascimento" hint="O Flow é para quem faz 13 anos ou mais neste ano.">
        <input
          inputMode="numeric"
          autoComplete="bday-year"
          maxLength={4}
          value={birthYear}
          onChange={(event) => onBirthYear(event.target.value.replace(/\D/g, ""))}
          placeholder="2008"
          className={inputStyles}
        />
      </Field>
      {minor && (
        <CheckRow
          checked={guardian}
          onToggle={onGuardian}
          label="Um responsável sabe que vou criar a conta."
          hint="Para menores de 18 anos."
        />
      )}
    </>
  );
}

function TermsCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <div className="grid gap-1">
      <CheckRow checked={checked} onToggle={onToggle} label="Li a política de privacidade e os termos." />
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/privacidade" target="_blank" className={linkStyles}>
          Política de privacidade
        </Link>
        <Link href="/termos" target="_blank" className={linkStyles}>
          Termos de uso
        </Link>
      </p>
    </div>
  );
}

function checkAge(birthYear: string, guardian: boolean): string | null {
  const invalid = validateBirthYear(birthYear, currentYear());
  if (invalid) return invalid;
  if (isMinor(Number(birthYear), currentYear()) && !guardian) return "Marque que um responsável sabe que você vai criar a conta.";
  return null;
}

export function AuthForm() {
  const [step, setStep] = useState<Step>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [guardian, setGuardian] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { error, setError, busy, run } = useAction();

  const go = (next: Step) => {
    setStep(next);
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === "entrar") {
      void run(() => signIn(email, password));
      return;
    }
    const ageError = checkAge(birthYear, guardian);
    if (ageError) {
      setError(ageError);
      return;
    }
    if (!agreed) {
      setError("Marque que leu a política de privacidade e os termos.");
      return;
    }
    void run(
      () => signUp(email, password, Number(birthYear)),
      () => {
        setPassword("");
        go("confirmar");
      },
    );
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

  if (step === "confirmar") {
    return (
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
    );
  }

  if (step === "esqueci") {
    return (
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
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Segmented
        options={[
          { value: "entrar", label: "Entrar" },
          { value: "criar", label: "Criar conta" },
        ]}
        value={step}
        onChange={go}
      />
      {googleLoginOpen() && (
        <>
          <Button size="lg" disabled={busy} onClick={() => void run(signInWithGoogle)}>
            {step === "criar" ? "Criar conta com Google" : "Entrar com Google"}
          </Button>
          <p className="flex items-center gap-3 text-[13px] text-muted before:flex-1 before:border-t before:border-line after:flex-1 after:border-t after:border-line">
            ou com e-mail
          </p>
        </>
      )}
      {emailField}
      <Field label="Senha" hint={step === "criar" ? `Pelo menos ${PASSWORD_MIN} caracteres.` : undefined}>
        <input
          type="password"
          autoComplete={step === "criar" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputStyles}
        />
      </Field>
      {step === "criar" && (
        <>
          <AgeFields
            birthYear={birthYear}
            guardian={guardian}
            onBirthYear={(value) => {
              setBirthYear(value);
              setError(null);
            }}
            onGuardian={() => setGuardian(!guardian)}
          />
          <TermsCheck
            checked={agreed}
            onToggle={() => {
              setAgreed(!agreed);
              setError(null);
            }}
          />
        </>
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
        Guardamos o seu e-mail, o ano de nascimento e os dados de estudo. Nada é vendido nem usado para anúncios.
      </p>
    </form>
  );
}

// Quem entrou pelo Google não passou pelo cadastro: o ano de nascimento é pedido uma vez, antes de abrir o app.
export function BirthYearForm() {
  const [birthYear, setBirthYear] = useState("");
  const [guardian, setGuardian] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { error, setError, busy, run } = useAction();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const ageError = checkAge(birthYear, guardian);
    if (ageError) {
      setError(ageError);
      return;
    }
    if (!agreed) {
      setError("Marque que leu a política de privacidade e os termos.");
      return;
    }
    void run(() => saveBirthYear(Number(birthYear)));
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <p className="text-muted">Falta pouco: o seu ano de nascimento e a confirmação dos termos.</p>
      <AgeFields
        birthYear={birthYear}
        guardian={guardian}
        onBirthYear={(value) => {
          setBirthYear(value);
          setError(null);
        }}
        onGuardian={() => setGuardian(!guardian)}
      />
      <TermsCheck
        checked={agreed}
        onToggle={() => {
          setAgreed(!agreed);
          setError(null);
        }}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        Continuar
      </Button>
    </form>
  );
}
