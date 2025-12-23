/**
 * Polyfills for Node.js environment
 * This file is loaded via --require flag before any other code
 */
import { webcrypto } from 'node:crypto';

// Polyfill global crypto for @nestjs/schedule and other libraries
(globalThis as any).crypto = webcrypto;
(global as any).crypto = webcrypto;

export {};
