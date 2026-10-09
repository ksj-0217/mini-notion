// 미니 노션 서비스 워커: 앱 파일을 미리 저장해 두고 인터넷 없이도 열리게 합니다.
// 인터넷이 되면 항상 최신 파일을 받아 쓰고, 안 되면 저장본을 씁니다.
// 파일을 고친 뒤에는 CACHE 이름의 숫자도 올려 주세요.
const CACHE = "mini-notion-v5";
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
  // cache: "reload" → 브라우저에 남은 옛 파일이 아니라 서버의 최신 파일로 저장
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
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

  // 앱 파일: 인터넷에서 최신 파일을 먼저 받고(받으면 저장본도 갱신),
  // 인터넷이 없거나 3초 안에 응답이 없으면 저장본 사용. 페이지 이동은 저장본도 없으면 index.html로
  const fromCache = () => caches.match(req, { ignoreSearch: true })
    .then(hit => hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
  const fromNet = fetch(req.url, { cache: "no-cache" }).then(res => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
    }
    return res;
  });
  const slow = new Promise(resolve => setTimeout(resolve, 3000)).then(fromCache);
  event.respondWith(
    Promise.race([fromNet, slow])
      .then(res => res || fromNet)
      .catch(() => fromCache().then(hit => hit || Response.error()))
  );
});
