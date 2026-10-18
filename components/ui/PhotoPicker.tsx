"use client";

import { Camera, X } from "lucide-react";
import { useState } from "react";
import type { ImagePayload } from "@/store/cloud";

// Lado maior que a IA aproveita; acima disso a foto só pesa mais no envio.
const MAX_SIDE = 1568;
const JPEG_QUALITY = 0.85;

async function shrink(file: File): Promise<ImagePayload> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return { mediaType: "image/jpeg", data: url.slice(url.indexOf(",") + 1) };
}

interface PhotoPickerProps {
  label: string;
  max: number;
  photos: ImagePayload[];
  onChange: (photos: ImagePayload[]) => void;
  disabled?: boolean;
}

export function PhotoPicker({ label, max, photos, onChange, disabled = false }: PhotoPickerProps) {
  const [error, setError] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try {
      const added = await Promise.all([...files].slice(0, max - photos.length).map(shrink));
      onChange([...photos, ...added]);
    } catch {
      setError("Não foi possível abrir essa imagem. Tente uma foto em JPG ou PNG.");
    }
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative size-20 overflow-hidden rounded-[10px] border-2 border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia local em data URL, sem otimização possível */}
            <img src={`data:${photo.mediaType};base64,${photo.data}`} alt={`Foto ${index + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, item) => item !== index))}
              disabled={disabled}
              aria-label={`Remover foto ${index + 1}`}
              className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-surface text-text"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label
            className={`grid min-h-20 min-w-40 flex-1 cursor-pointer place-items-center gap-1 rounded-[10px] border-2 border-dashed border-line px-4 py-3 text-center text-sm text-muted hover:border-edge ${disabled ? "pointer-events-none opacity-45" : ""}`}
          >
            <Camera size={20} aria-hidden />
            <span>{label}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={max > 1}
              disabled={disabled}
              onChange={(event) => {
                void pick(event.target.files);
                event.target.value = "";
              }}
              className="sr-only"
            />
          </label>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
