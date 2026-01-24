const IV_LENGTH = 12;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keyCache = new Map<string, Promise<CryptoKey>>();

export function getCrypto(): Crypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new Error("Web Crypto API is not available in this runtime.");
  }

  return globalThis.crypto;
}

export function base64UrlEncode(bytes: Uint8Array): string {
  if (typeof btoa !== "undefined") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // @ts-ignore
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  throw new Error("Base64 helpers are not available in this runtime.");
}

export function base64UrlDecode(value: string): Uint8Array {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }

  if (typeof atob !== "undefined") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // @ts-ignore
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  throw new Error("Base64 helpers are not available in this runtime.");
}

export async function getKey(secret: string): Promise<CryptoKey> {
  if (!secret) {
    throw new Error("Session secret is missing");
  }

  if (!keyCache.has(secret)) {
    const crypto = getCrypto();
    const subtle = crypto.subtle;
    const keyPromise = subtle
      .digest("SHA-256", encoder.encode(secret))
      .then((hash) =>
        subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]),
      );
    keyCache.set(secret, keyPromise);
  }

  return keyCache.get(secret)!;
}

export const encodeJson = (payload: unknown): Uint8Array =>
  encoder.encode(JSON.stringify(payload));

export const decodeJson = <T>(value: ArrayBuffer): T =>
  JSON.parse(decoder.decode(value)) as T;

export const cryptoInternals = {
  IV_LENGTH,
  encoder,
  decoder,
};
