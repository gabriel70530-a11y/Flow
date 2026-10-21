// Deixa o Flow abrir sem internet. Os dados já ficam no navegador; aqui só guardamos as páginas e os arquivos do app.
const CACHE = "flow-v2";
const PAGES = ["/", "/painel", "/cronograma", "/materias", "/timer", "/revisoes", "/revisoes/erros", "/revisoes/cartoes", "/questoes",
  "/simulados", "/redacao", "/tabuada", "/prova", "/conquistas", "/ajustes", "/ajuda"];

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

// Lembretes de estudo enviados pelo servidor (função send-reminders). A tag é a mesma do aviso local: nunca aparecem dois.
self.addEventListener("push", (event) => {
  const message = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(message.title || "Flow", {
      body: message.body || "",
      tag: message.tag,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: message.url || "/painel" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // O aviso só abre páginas do próprio Flow.
  const target = new URL(event.notification.data?.url || "/painel", self.location.origin);
  const url = target.origin === self.location.origin ? target.href : new URL("/painel", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) return open.focus().then(() => open.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
