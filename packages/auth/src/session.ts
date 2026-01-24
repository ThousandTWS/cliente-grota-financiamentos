import {
  base64UrlDecode,
  base64UrlEncode,
  cryptoInternals,
  decodeJson,
  encodeJson,
  getCrypto,
  getKey,
} from "./crypto";
import { SessionPayload } from "./types";

const { IV_LENGTH } = cryptoInternals;

export async function encryptSession(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const crypto = getCrypto();
  const subtle = crypto.subtle;
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = encodeJson(payload);

  const cipherBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoded,
  );

  const encryptedBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(IV_LENGTH + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, IV_LENGTH);

  return base64UrlEncode(combined);
}

export async function decryptSession(
  value: string | undefined | null,
  secret: string,
): Promise<SessionPayload | null> {
  if (!value) {
    return null;
  }

  try {
    const crypto = getCrypto();
    const subtle = crypto.subtle;
    const key = await getKey(secret);
    const combined = base64UrlDecode(value);
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext,
    );

    return decodeJson<SessionPayload>(decrypted);
  } catch (error) {
    console.warn("[auth] Failed to decrypt session:", error);
    return null;
  }
}

export function isSessionNearExpiry(
  session: SessionPayload,
  skewMs = 60_000,
): boolean {
  const expiresAt = new Date(session.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt - Date.now() <= skewMs;
}
