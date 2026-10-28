/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** Public ALiN API origin (scheme://host[:port]). Never a secret. */
  readonly VITE_ALIN_API_ORIGIN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
