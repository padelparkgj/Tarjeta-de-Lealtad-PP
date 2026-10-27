// Service Worker — Padel Park Gran Jardín
// v3.8 (26 de octubre de 2026): la app se apagó; la app de socios vive en
// https://app-padel-park.vercel.app/socios/. Este SW existe solo para desmontar al anterior
// (ppgj-v4) en los aparatos que lo tienen: al activarse borra TODAS sus cachés, se da de baja y
// recarga las ventanas abiertas, que ya sin caché reciben la página de redirección de la red.
// No tiene manejador de fetch: nada se sirve desde aquí, ni en línea ni sin red.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
    await self.registration.unregister();
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(ventanas.map(c => c.navigate(c.url).catch(() => {})));
  })());
});
