/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BFF_API_URL?: string;
  readonly VITE_UCP_API_URL?: string;
  readonly VITE_DEFAULT_PINCODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
