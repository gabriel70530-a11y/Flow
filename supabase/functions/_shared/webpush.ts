// Web Push sem dependências: criptografia aes128gcm (RFC 8291) e assinatura VAPID (RFC 8292) com a WebCrypto do Deno.

type Bytes = Uint8Array<ArrayBuffer>;

const encoder = new TextEncoder();

export function toBase64Url(bytes: Bytes): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Bytes {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function concat(...parts: Bytes[]): Bytes {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

async function hkdf(salt: Bytes, secret: Bytes, info: Bytes, length: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Corpo cifrado para o navegador da pessoa: só ela tem a chave privada que abre a mensagem.
export async function encryptPayload(
  payload: Bytes,
  target: Pick<PushTarget, "p256dh" | "auth">,
  salt = crypto.getRandomValues(new Uint8Array(16)),
): Promise<Bytes> {
  const receiverPublic = fromBase64Url(target.p256dh);
  const authSecret = fromBase64Url(target.auth);
  const senderKeys = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const senderPublic = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeys.publicKey));
  const receiverKey = await crypto.subtle.importKey("raw", receiverPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, senderKeys.privateKey, 256));

  const ikm = await hkdf(authSecret, shared, concat(encoder.encode("WebPush: info\0"), receiverPublic, senderPublic), 32);
  const contentKey = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  // 0x02 marca o fim do único registro da mensagem.
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(payload, new Uint8Array([2]))));

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  return concat(salt, recordSize, new Uint8Array([senderPublic.length]), senderPublic, cipher);
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

async function vapidAuthorization(endpoint: string, vapid: VapidKeys): Promise<string> {
  const publicBytes = fromBase64Url(vapid.publicKey);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: vapid.privateKey,
      x: toBase64Url(publicBytes.slice(1, 33)),
      y: toBase64Url(publicBytes.slice(33, 65)),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = toBase64Url(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject };
  const unsigned = `${header}.${toBase64Url(encoder.encode(JSON.stringify(claims)))}`;
  const signature = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(unsigned)));
  return `vapid t=${unsigned}.${toBase64Url(signature)}, k=${vapid.publicKey}`;
}

// Devolve o status do serviço de push: 404 e 410 querem dizer que a inscrição não existe mais.
export async function sendPush(target: PushTarget, message: unknown, vapid: VapidKeys, ttlSeconds = 3600): Promise<number> {
  const body = await encryptPayload(encoder.encode(JSON.stringify(message)), target);
  const response = await fetch(target.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuthorization(target.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttlSeconds),
      Urgency: "high",
    },
    body,
  });
  await response.body?.cancel();
  return response.status;
}
