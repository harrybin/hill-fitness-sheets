/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_HASH?: string
  readonly VITE_BUILD_DATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}