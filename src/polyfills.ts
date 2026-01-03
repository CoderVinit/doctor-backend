/**
 * Polyfills for Node.js environment
 * This file is loaded via --require flag before any other code
 */
import { webcrypto } from 'node:crypto';

// Polyfill global crypto for @nestjs/schedule and other libraries
// Only set if crypto is not already available (Node.js 18+ has it natively)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}

export {};
