declare module 'vitest/config' {
    import type { UserConfigExport } from 'vite'
    export function defineConfig(config: UserConfigExport): UserConfigExport
}

declare module 'vitest' {
    export const describe: (name: string, fn: () => void) => void
    export const it: (name: string, fn: () => unknown) => void
    export const expect: (value: unknown) => unknown
    export const vi: Record<string, unknown>
    export const beforeEach: (fn: () => void) => void
}

declare module '@testing-library/jest-dom'

declare const describe: (name: string, fn: () => void) => void
declare const it: (name: string, fn: () => unknown) => void
declare const expect: (value: unknown) => unknown
declare const vi: Record<string, unknown>
declare const beforeEach: (fn: () => void) => void
