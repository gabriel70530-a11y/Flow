import { ImageResponse } from "next/og";

export const alt = "Flow · Sua preparação para o ENEM, no ritmo certo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Saira itálico 800 só com as letras do logo. Sem rede na hora do build, o cartão sai com a fonte padrão.
async function logoFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Saira:ital,wdth,wght@1,125,800&text=FLOW").then(
      (response) => response.text(),
    );
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((response) => response.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

// Cartão de compartilhamento nas cores da marca: azul-marinho sobre off-white.
export default async function OpengraphImage() {
  const font = await logoFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#f4f3ee",
          color: "#14213d",
        }}
      >
        <div style={{ fontFamily: font ? "Saira" : undefined, fontSize: 210, fontWeight: 800, fontStyle: "italic" }}>FLOW</div>
        <div style={{ fontSize: 44, color: "#5b6475" }}>Sua preparação para o ENEM, no ritmo certo.</div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Saira", data: font, weight: 800, style: "italic" }] : undefined },
  );
}
