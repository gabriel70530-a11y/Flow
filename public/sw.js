// Deixa o Flow abrir sem internet. Os dados já ficam no navegador; aqui só guardamos as páginas e os arquivos do app.
const CACHE = "flow-v1";
const PAGES = ["/", "/painel", "/cronograma", "/materias", "/timer", "/revisoes", "/revisoes/erros", "/simulados", "/redacao", "/prova", "/ajustes"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(PAGES.map((page) => cache.add(page)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function fromNetwork(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Páginas: tenta a rede para pegar a versão nova; sem internet, usa a cópia guardada (ou o Painel).
  if (request.mode === "navigate") {
    event.respondWith(
      fromNetwork(request).catch(async () => (await caches.match(request, { ignoreSearch: true })) ?? (await caches.match("/painel")) ?? Response.error()),
    );
    return;
  }

  // Arquivos com hash no nome nunca mudam: a cópia guardada serve direto.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fromNetwork(request)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fromNetwork(request).catch(() => cached ?? Response.error());
      return cached ?? update;
    }),
  );
});
