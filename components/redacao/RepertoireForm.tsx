"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { ESSAY_TEXT_MAX, ESSAY_THEME_MAX, REPERTOIRE_TITLE_MAX } from "@/lib/essays";
import { useStudyStore } from "@/store/study-store";

export function RepertoireForm({ onDone }: { onDone: () => void }) {
  const addRepertoire = useStudyStore((state) => state.addRepertoire);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [themes, setThemes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = addRepertoire({ title, detail, themes });
    if (result) setError(result);
    else onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="Repertório" hint="Uma obra, autor, lei, dado ou fato histórico." error={error}>
        <input
          value={title}
          maxLength={REPERTOIRE_TITLE_MAX}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          placeholder="Ex.: Constituição de 1988, artigo 6º"
          className={inputStyles}
          aria-invalid={Boolean(error)}
        />
      </Field>
      <Field label="Como usar (opcional)">
        <textarea
          value={detail}
          maxLength={ESSAY_TEXT_MAX}
          rows={3}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="Ex.: garante educação e saúde como direitos sociais; serve para mostrar o que falta cumprir"
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      <Field label="Temas em que serve (opcional)" hint="Separe por vírgula. Ajuda a achar na busca.">
        <input
          value={themes}
          maxLength={ESSAY_THEME_MAX}
          onChange={(event) => setThemes(event.target.value)}
          placeholder="Ex.: educação, saúde, desigualdade"
          className={inputStyles}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg">
        Salvar repertório
      </Button>
    </form>
  );
}
