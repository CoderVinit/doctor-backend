/**
 * Polyfills for Node.js environment
 * This file must be imported at the very top of main.ts before any other imports
 */
import { webcrypto } from 'crypto';

// Polyfill global crypto for @nestjs/schedule and other libraries
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

if (typeof global.crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}
