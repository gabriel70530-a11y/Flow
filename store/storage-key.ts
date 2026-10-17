// Fica fora da store para o script de tema do layout (Server Component) poder importar sem puxar o Zustand.
export const STORAGE_KEY = "enem-flow:v2";
// Formato do protótipo. Só é lido para migrar e fica intacto como cópia de segurança.
export const LEGACY_STORAGE_KEY = "enem-flow:v1";
export const CORRUPT_STORAGE_KEY = "enem-flow:v2:corrompido";
