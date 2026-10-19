// deno test supabase/functions/_shared/webpush_test.ts
import { encryptPayload, fromBase64Url, toBase64Url } from "./webpush.ts";

type Bytes = Uint8Array<ArrayBuffer>;

const encoder = new TextEncoder();

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
}

async function hkdf(salt: Bytes, secret: Bytes, info: Bytes, length: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

// O lado do navegador, pela RFC 8291: abre a mensagem com a chave privada da inscrição.
async function decrypt(body: Bytes, receiver: CryptoKeyPair, authSecret: Bytes): Promise<string> {
  const salt = body.slice(0, 16);
  const recordSize = new DataView(body.buffer, body.byteOffset + 16, 4).getUint32(0);
  const keyLength = body[20];
  const senderPublic = body.slice(21, 21 + keyLength);
  const cipher = body.slice(21 + keyLength);
  assertEquals(recordSize, 4096);
  const receiverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", receiver.publicKey));
  const senderKey = await crypto.subtle.importKey("raw", senderPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: senderKey }, receiver.privateKey, 256));
  const info = new Uint8Array([...encoder.encode("WebPush: info\0"), ...receiverPublic, ...senderPublic]);
  const ikm = await hkdf(authSecret, shared, info, 32);
  const contentKey = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, cipher));
  assertEquals(plain[plain.length - 1], 2);
  return new TextDecoder().decode(plain.slice(0, -1));
}

Deno.test("o navegador abre a mensagem cifrada", async () => {
  const receiver = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const authSecret = crypto.getRandomValues(new Uint8Array(16));
  const target = {
    p256dh: toBase64Url(new Uint8Array(await crypto.subtle.exportKey("raw", receiver.publicKey))),
    auth: toBase64Url(authSecret),
  };
  const message = JSON.stringify({ title: "Hora de estudar", body: "Sem pressa." });
  const body = await encryptPayload(encoder.encode(message), target);
  assertEquals(await decrypt(body, receiver, authSecret), message);
});

Deno.test("base64url ida e volta", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(65));
  assertEquals([...fromBase64Url(toBase64Url(bytes))], [...bytes]);
});
