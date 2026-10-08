// 미니 노션 서비스 워커: 앱 파일을 미리 저장해 두고 인터넷 없이도 열리게 합니다.
// 파일을 고친 뒤에는 CACHE 이름의 숫자를 올려야 폰에 새 버전이 반영됩니다.
const CACHE = "mini-notion-v2";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // 앱 파일: 저장본을 먼저 쓰고, 없으면 인터넷에서 받기. 페이지 이동은 오프라인이면 index.html로
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).catch(() => {
      if (req.mode === "navigate") return caches.match("./index.html");
    }))
  );
});
