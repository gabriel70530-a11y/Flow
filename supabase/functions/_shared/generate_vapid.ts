// Gera um par de chaves VAPID para os lembretes por push. Rode uma vez e guarde o resultado fora do repositório:
//   deno run supabase/functions/_shared/generate_vapid.ts
import { toBase64Url } from "./webpush.ts";

const keys = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
const publicKey = toBase64Url(new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey)));
const { d } = await crypto.subtle.exportKey("jwk", keys.privateKey);

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}   (Vercel e .env.local)`);
console.log(`VAPID_PUBLIC_KEY=${publicKey}   (segredo da função send-reminders)`);
console.log(`VAPID_PRIVATE_KEY=${d}   (segredo da função send-reminders; nunca no app)`);
