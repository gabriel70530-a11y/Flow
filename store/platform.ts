import { useSyncExternalStore } from "react";
import { ANDROID_LAUNCH_PARAM, ANDROID_LAUNCH_VALUE, ANDROID_PACKAGE } from "@/lib/site";

const ANDROID_SESSION_KEY = "enem-flow:android";

// O app abre o Painel com ?origem=android; um link aberto direto no app chega com o referrer android-app://.
// Fica na sessão, não no localStorage: o app Android divide o armazenamento com o Chrome do aparelho,
// e o site aberto no Chrome continua oferecendo a assinatura.
export function rememberAndroidLaunch() {
  try {
    const params = new URLSearchParams(window.location.search);
    const launchedByApp =
      params.get(ANDROID_LAUNCH_PARAM) === ANDROID_LAUNCH_VALUE || document.referrer.startsWith(`android-app://${ANDROID_PACKAGE}`);
    if (launchedByApp) sessionStorage.setItem(ANDROID_SESSION_KEY, "1");
  } catch {}
}

function isAndroidApp(): boolean {
  rememberAndroidLaunch();
  try {
    return sessionStorage.getItem(ANDROID_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

const subscribeNever = () => () => {};

export function useAndroidApp(): boolean {
  return useSyncExternalStore(subscribeNever, isAndroidApp, () => false);
}
