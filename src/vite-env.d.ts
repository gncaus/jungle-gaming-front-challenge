/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Defina como "false" para desligar a API simulada (MSW). Ligada por padrão. */
  readonly VITE_ENABLE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
