const CACHE_NAME = "qubik-timer-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/sw.js",
    "/src/averages/average_Best.js",
    "/src/averages/average_calculations.js",
    "/src/averages/average_render.js",
    "/src/averages/average_state.js",
    "/src/configuration/create_donate_overlay.js",
    "/src/configuration/create_config_overlay.js",
    "/src/core/main.js",
    "/src/database/average_DB.js",
    "/src/database/cards_render.js",
    "/src/database/crud.js",
    "/src/database/DB_render.js",
    "/src/database/init_DB.js",
    "/src/database/stats_render.js",
    "/src/images/icon_mobile.png",
    "/src/images/logo.png",
    "/src/images/banner.png",
    "/src/images/breb.jpeg",
    "/src/images/paypal.jpeg",
    "/src/images/solves.png",
    "/src/scrambler/cube_render.js",
    "/src/scrambler/render.js",
    "/src/scrambler/rotations.js",
    "/src/scrambler/scrambler_engine.js",
    "/src/scrambler/scrambler_main.js",
    "/src/scrambler/timer.js",
    "/src/sessions/sessions.js",
    "/src/solves/solve_factory.js",
    "/src/solves/solve_state.js",
    "/src/styles/main.css",
    "/src/styles/base.css",
    "/src/styles/navbar.css",
    "/src/styles/scramble.css",
    "/src/styles/timer.css",
    "/src/styles/cube.css",
    "/src/styles/panels.css",
    "/src/styles/modals.css",
    "/src/styles/responsive.css",
    "/src/styles/responsive-mobile.css",
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key)),
            );
        }),
    );
    self.clients.claim();
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).catch(() => {
                return new Response("", {
                    status: 408,
                    statusText: "Request Timeout",
                });
            });
        }),
    );
});
