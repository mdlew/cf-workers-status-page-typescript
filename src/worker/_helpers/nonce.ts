/**
 * Generates a cryptographically secure random nonce string.
 *
 * This function creates a new random nonce value for every response,
 * using 16 bytes of random data from the browser's crypto API,
 * and encodes it as a base64 string.
 *
 * @returns {string} A base64-encoded random nonce.
 */
export function nonce(): string {
  // This function generates a new random nonce value for every response.
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}
