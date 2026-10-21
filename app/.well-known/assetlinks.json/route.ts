import { ANDROID_PACKAGE, androidCertFingerprints } from "@/lib/site";

// Digital Asset Links: prova para o Android que o app da Play Store e o site são do mesmo dono.
// Sem isso, o app abre o Flow com a barra de endereço do Chrome no topo.
export function GET() {
  const fingerprints = androidCertFingerprints();
  const statements = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: fingerprints },
        },
      ]
    : [];
  return Response.json(statements);
}
