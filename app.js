// 미니 노션: 페이지 목록, 블록 편집기, 슬래시 명령어, 마크다운 단축키, 첨부파일, 되돌리기, 백업
(() => {
  const STORE_KEY = "mini-notion";
  const THEME_KEY = "mini-notion-theme";
  const TYPES = [
    { type: "p", label: "문단", hint: "일반 텍스트", icon: "Aa", keys: "문단 텍스트 text paragraph" },
    { type: "h1", label: "제목 1", hint: "큰 제목", icon: "H1", keys: "제목1 제목 heading h1" },
    { type: "h2", label: "제목 2", hint: "중간 제목", icon: "H2", keys: "제목2 제목 heading h2" },
    { type: "h3", label: "제목 3", hint: "작은 제목", icon: "H3", keys: "제목3 제목 heading h3" },
    { type: "bullet", label: "글머리 목록", hint: "점으로 나열", icon: "•", keys: "글머리 목록 리스트 list bullet" },
    { type: "num", label: "번호 목록", hint: "1. 2. 3. 순서대로", icon: "1.", keys: "번호 목록 숫자 리스트 numbered list number" },
    { type: "todo", label: "체크리스트", hint: "할 일 체크", icon: "☑", keys: "체크리스트 할일 todo check" },
    { type: "toggle", label: "토글", hint: "접고 펼 수 있는 내용", icon: "▸", keys: "토글 접기 펼치기 toggle" },
    { type: "quote", label: "인용", hint: "인용문 강조", icon: "❝", keys: "인용 quote" },
    { type: "code", label: "코드", hint: "고정폭 글꼴로 코드 쓰기", icon: "</>", keys: "코드 code" },
    { type: "divider", label: "구분선", hint: "가로줄로 나누기", icon: "—", keys: "구분선 가로줄 divider line hr" },
    { type: "image", label: "이미지", hint: "사진 올리기", icon: "🖼", keys: "이미지 사진 그림 image photo picture" },
    { type: "file", label: "파일", hint: "첨부파일 올리기", icon: "📎", keys: "파일 첨부 첨부파일 file attachment upload" }
  ];
  const TYPE_SET = new Set(TYPES.map(t => t.type));
  const RICH = new Set(["p", "h1", "h2", "h3", "bullet", "num", "todo", "toggle", "quote"]);
  const MEDIA = new Set(["divider", "image", "file"]);
  const LISTY = new Set(["bullet", "num", "todo"]);
  const PLACEHOLDER = { p: "'/'를 입력해 블록 종류 고르기", h1: "제목 1", h2: "제목 2", h3: "제목 3", bullet: "목록", num: "목록", todo: "할 일", toggle: "토글", quote: "인용" };
  const SHORTCUTS = [["### ", "h3"], ["## ", "h2"], ["# ", "h1"], ["[ ] ", "todo"], ["[] ", "todo"], ["- ", "bullet"], ["* ", "bullet"], ["1. ", "num"], ["> ", "quote"], ["```", "code"]];
  const EMOJIS = ["📄", "📝", "📌", "📚", "💡", "✅", "📅", "🎯", "🚀", "⭐", "❤️", "🔥", "🎨", "🎵", "📷", "✈️", "🏠", "💼", "💰", "🛒", "🍀", "🌙", "☀️", "🐶", "🐱", "🍎", "☕", "🎉", "🧠", "🔧", "📊", "🗂️", "🔒", "🌱", "🏃", "🎓", "👋", "💬", "📦", "🧪"];
  const THEMES = [["auto", "🌓", "자동"], ["light", "☀️", "밝게"], ["dark", "🌙", "어둡게"]];

  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function block(type, content = "", checked = false) {
    if (type === "code") return { id: uid(), type, text: content };
    if (MEDIA.has(type)) return { id: uid(), type };
    return { id: uid(), type, html: content, checked };
  }

  // ---------- 글자 서식 (HTML은 허용한 태그만 남김) ----------
  const TAGS = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", S: "s", STRIKE: "s", DEL: "s", CODE: "code" };
  function walk(node) {
    let out = "";
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) out += esc(n.nodeValue.replace(/ /g, " "));
      else if (n.nodeType === 1) {
        if (n.nodeName === "BR") { out += "<br>"; return; }
        if ((n.nodeName === "DIV" || n.nodeName === "P") && out) out += "<br>";
        const inner = walk(n);
        const tag = TAGS[n.nodeName];
        out += tag && inner ? `<${tag}>${inner}</${tag}>` : inner;
      }
    });
    return out;
  }
  function sanitize(html) {
    const t = document.createElement("template");
    t.innerHTML = html || "";
    return walk(t.content).replace(/(<br>)+$/, "");
  }
  function plain(html) {
    const t = document.createElement("template");
    t.innerHTML = html || "";
    return t.content.textContent;
  }

  // ---------- 저장 ----------
  function seed() {
    const t = (type, text, checked) => block(type, esc(text), checked);
    const toggle = t("toggle", "토글을 눌러 펼쳐 보세요");
    toggle.body = "숨겨 둔 내용이 여기 있어요.";
    const a = {
      id: uid(), title: "시작하기 (예시)", icon: "👋", blocks: [
        t("p", "미니 노션에 오신 걸 환영합니다. 이 페이지는 예시예요. 마음대로 고치거나 지워도 됩니다."),
        t("h2", "블록 다루기"),
        t("bullet", "Enter를 누르면 아래에 새 블록이 생겨요."),
        t("bullet", "빈 블록에서 Backspace를 누르면 블록이 지워져요."),
        t("bullet", "빈 블록에서 / 를 입력하면 블록 종류를 고를 수 있어요."),
        t("h2", "마크다운 단축키"),
        t("todo", "줄 맨 앞에 # 과 공백을 입력해 제목 1 만들기", true),
        t("todo", "## 과 공백으로 제목 2 만들기"),
        t("todo", "- 와 공백으로 글머리 목록, 1. 과 공백으로 번호 목록 만들기"),
        t("todo", "[] 와 공백으로 체크리스트, > 와 공백으로 인용 만들기"),
        t("h2", "더 해보기"),
        t("num", "블록 왼쪽 ⋮⋮ 손잡이를 끌어 순서를 바꿔요. 손잡이를 누르면 복제·삭제 메뉴가 떠요."),
        { ...t("num", ""), html: "글자를 선택하면 <b>굵게</b>·<i>기울임</i>·<u>밑줄</u> 막대가 떠요." },
        t("num", "/이미지, /파일 로 첨부하거나, 파일을 화면에 끌어다 놓아요."),
        toggle,
        t("quote", "되돌리기는 Ctrl+Z, 다시 실행은 Ctrl+Shift+Z (위쪽 ↶ ↷ 버튼도 있어요)"),
        block("code", "console.log('미니 노션');"),
        block("divider"),
        t("p", "")
      ]
    };
    const b = {
      id: uid(), title: "회의 메모 (예시)", icon: "📝", blocks: [
        t("h1", "주간 회의"),
        t("p", "참석: 기획, 디자인, 개발"),
        t("h2", "결정한 것"),
        t("bullet", "다음 주 금요일까지 시안 2개 공유"),
        t("h2", "할 일"),
        t("todo", "회의록 정리해서 공유"),
        t("todo", "시안 피드백 모으기")
      ]
    };
    return { pages: [a, b], current: a.id };
  }

  // 예전 형식(text)도 읽을 수 있게 맞춰 주기
  function migratePage(p) {
    p.id = p.id || uid();
    p.title = typeof p.title === "string" ? p.title : "";
    p.icon = typeof p.icon === "string" ? p.icon : "";
    if (!Array.isArray(p.blocks) || !p.blocks.length) p.blocks = [block("p")];
    p.blocks.forEach(b => {
      b.id = b.id || uid();
      if (!TYPE_SET.has(b.type)) b.type = "p";
      if (b.type === "code") b.text = String(b.text ?? "");
      else if (!MEDIA.has(b.type)) {
        if (typeof b.html !== "string") b.html = esc(String(b.text ?? ""));
        else b.html = sanitize(b.html);
        delete b.text;
      }
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.pages) && data.pages.length) {
          data.pages.forEach(migratePage);
          if (!data.pages.some(p => p.id === data.current)) data.current = data.pages[0].id;
          return { data, ok: true };
        }
      }
    } catch (e) { /* 저장소를 못 쓰는 환경이면 예시로 시작 */ }
    return { data: seed(), ok: false };
  }

  const loaded = load();
  let state = loaded.data;

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      savedEl.textContent = "저장됨";
    } catch (e) {
      savedEl.textContent = "저장 공간이 부족하거나 이 브라우저에서는 저장되지 않아요";
    }
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(commit, 300);
  }
  function commit() {
    clearTimeout(saveTimer);
    record();
    persist();
  }

  // ---------- 되돌리기 / 다시 실행 ----------
  const hist = [{ pages: JSON.stringify(state.pages), current: state.current }];
  let future = [];
  function record() {
    const s = JSON.stringify(state.pages);
    if (s === hist[hist.length - 1].pages) return;
    hist.push({ pages: s, current: state.current });
    if (hist.length > 200) hist.shift();
    future = [];
  }
  const checkpoint = record; // 구조를 바꾸기 전에 지금까지 입력한 내용을 한 단계로 남김

  function undo() {
    clearTimeout(saveTimer);
    record();
    if (hist.length < 2) return;
    const cur = hist.pop();
    future.push(cur);
    applySnap(hist[hist.length - 1].pages, cur.current);
  }
  function redo() {
    clearTimeout(saveTimer);
    record();
    if (!future.length) return;
    const next = future.pop();
    hist.push(next);
    applySnap(next.pages, next.current);
  }
  function applySnap(pages, current) {
    const f = focusInfo();
    state.pages = JSON.parse(pages);
    if (state.pages.some(p => p.id === current)) state.current = current;
    else if (!state.pages.some(p => p.id === state.current)) state.current = state.pages[0].id;
    persist();
    renderAll();
    restoreFocus(f);
  }

  // ---------- 첨부파일 (IndexedDB) ----------
  let dbp;
  function db() {
    return dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open("mini-notion-files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  }
  function store(mode, fn) {
    return db().then(d => new Promise((res, rej) => {
      const t = d.transaction("files", mode);
      const req = fn(t.objectStore("files"));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }
  const idbPut = (id, v) => store("readwrite", s => s.put(v, id));
  const idbGet = id => store("readonly", s => s.get(id));
  const idbKeys = () => store("readonly", s => s.getAllKeys());
  const idbDel = id => store("readwrite", s => s.delete(id));

  const urlCache = new Map();
  function blobUrl(id) {
    if (!urlCache.has(id)) {
      urlCache.set(id, idbGet(id)
        .then(v => v ? URL.createObjectURL(new Blob([v.buf], { type: v.type })) : null)
        .catch(() => null));
    }
    return urlCache.get(id);
  }
  const usedFileIds = () => {
    const ids = new Set();
    state.pages.forEach(p => p.blocks.forEach(b => b.fileId && ids.add(b.fileId)));
    return ids;
  };
  // 어느 블록도 쓰지 않는 파일은 시작할 때 정리
  async function cleanupFiles() {
    if (!loaded.ok) return;
    try {
      const used = usedFileIds();
      for (const k of await idbKeys()) if (!used.has(k)) await idbDel(k);
    } catch (e) { /* 정리는 실패해도 괜찮음 */ }
  }
  function formatSize(n) {
    if (!n && n !== 0) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  async function insertFiles(files, anchorId, kind) {
    const p = page();
    savedEl.textContent = "올리는 중…";
    const made = [];
    for (const f of files) {
      const fileId = uid();
      try {
        await idbPut(fileId, { buf: await f.arrayBuffer(), type: f.type, name: f.name });
      } catch (err) {
        savedEl.textContent = "";
        alert("첨부파일을 저장하지 못했어요. 저장 공간이 부족하거나 이 브라우저에서 지원하지 않아요.");
        break;
      }
      const isImg = f.type.startsWith("image/");
      made.push({ id: uid(), type: kind === "file" || !isImg ? "file" : "image", fileId, name: f.name || (isImg ? "image" : "file"), size: f.size, mime: f.type });
    }
    if (!made.length) return;
    checkpoint();
    const i = anchorId ? p.blocks.findIndex(b => b.id === anchorId) : -1;
    const anchor = p.blocks[i];
    if (anchor && anchor.type === "p" && !plain(anchor.html)) p.blocks.splice(i, 1, ...made);
    else p.blocks.splice(i + 1, 0, ...made);
    const last = p.blocks.indexOf(made[made.length - 1]);
    let next = p.blocks[last + 1];
    if (!next) { next = block("p"); p.blocks.push(next); }
    commit();
    if (page() === p) { renderBlocks(); focusBlock(next, 0); }
  }

  function downloadFile(b) {
    blobUrl(b.fileId).then(u => {
      if (!u) { alert("파일을 찾을 수 없어요."); return; }
      const a = document.createElement("a");
      a.href = u;
      a.download = b.name || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  // ---------- 백업 ----------
  const toDataURL = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
  async function exportBackup() {
    commit();
    savedEl.textContent = "백업 만드는 중…";
    const files = [];
    for (const id of usedFileIds()) {
      try {
        const v = await idbGet(id);
        if (v) files.push({ id, type: v.type, name: v.name, data: await toDataURL(new Blob([v.buf], { type: v.type })) });
      } catch (e) { /* 못 읽은 파일은 건너뜀 */ }
    }
    const out = { app: "mini-notion", version: 2, exportedAt: new Date().toISOString(), current: state.current, pages: state.pages, files };
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
    a.download = `mini-notion-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    savedEl.textContent = `백업 파일을 저장했어요 (페이지 ${state.pages.length}개, 첨부 ${files.length}개)`;
  }
  async function importBackup(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch (e) { alert("백업 파일을 읽을 수 없어요."); return; }
    if (!data || !Array.isArray(data.pages) || !data.pages.length) { alert("미니 노션 백업 파일이 아니에요."); return; }
    if (!confirm(`백업의 페이지 ${data.pages.length}개로 지금 데이터를 바꿀까요?\n바꾼 뒤에도 되돌리기(Ctrl+Z, ↶)로 돌아갈 수 있어요.`)) return;
    savedEl.textContent = "불러오는 중…";
    for (const f of Array.isArray(data.files) ? data.files : []) {
      try {
        const blob = await (await fetch(f.data)).blob();
        await idbPut(String(f.id), { buf: await blob.arrayBuffer(), type: f.type || blob.type, name: f.name });
      } catch (e) { /* 깨진 첨부는 건너뜀 */ }
    }
    urlCache.clear();
    checkpoint();
    data.pages.forEach(migratePage);
    state.pages = data.pages;
    state.current = data.pages.some(p => p.id === data.current) ? data.current : data.pages[0].id;
    searchEl.value = "";
    commit();
    renderAll();
    savedEl.textContent = "백업을 불러왔어요";
  }

  const page = () => state.pages.find(p => p.id === state.current) || state.pages[0];
  const indexOf = id => page().blocks.findIndex(b => b.id === id);
  const blockById = id => page().blocks.find(b => b.id === id);

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const listEl = $("#page-list");
  const titleEl = $("#page-title");
  const blocksEl = $("#blocks");
  const savedEl = $("#saved");
  const menuEl = $("#slash-menu");
  const searchEl = $("#search");
  const crumbEl = $("#crumb");
  const iconBtn = $("#page-icon");
  const addIconBtn = $("#add-icon");
  const themeBtn = $("#theme");
  const blockMenuEl = $("#block-menu");
  const emojiEl = $("#emoji-menu");
  const fmtEl = $("#fmt-bar");
  const dropLine = $("#drop-line");
  const fileInput = $("#file-input");
  const importInput = $("#import-input");
  const editorEl = $(".editor");
  const docEl = $(".doc");

  const rowOf = id => blocksEl.querySelector(`.block[data-id="${id}"]`);
  const editableOf = b => {
    const row = rowOf(b.id);
    return row && row.querySelector(b.type === "code" ? ".code" : ".text");
  };

  function pageText(p) {
    return p.blocks.map(b => b.type === "code" ? b.text : MEDIA.has(b.type) ? (b.name || "") : plain(b.html) + (b.body ? " " + b.body : "")).join(" ");
  }

  function renderSidebar() {
    const q = searchEl.value.trim().toLowerCase();
    listEl.innerHTML = "";
    let shown = 0;
    state.pages.forEach(p => {
      let snippet = "";
      if (q) {
        const inTitle = (p.title || "").toLowerCase().includes(q);
        const body = pageText(p);
        const at = body.toLowerCase().indexOf(q);
        if (!inTitle && at < 0) return;
        if (!inTitle) snippet = (at > 15 ? "…" : "") + body.slice(Math.max(0, at - 15), at + q.length + 25);
      }
      shown++;
      const li = document.createElement("li");
      li.className = "page-item" + (p.id === page().id ? " active" : "");
      li.dataset.id = p.id;
      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.type = "button";
      const ic = document.createElement("span");
      ic.className = "pi" + (p.icon ? "" : " faint");
      ic.textContent = p.icon || "📄";
      const name = document.createElement("span");
      name.className = "page-name";
      name.textContent = p.title || "제목 없음";
      btn.append(ic, name);
      if (snippet) {
        const sn = document.createElement("span");
        sn.className = "page-snippet";
        sn.textContent = snippet;
        btn.appendChild(sn);
      }
      btn.addEventListener("click", () => openPage(p.id));
      const del = document.createElement("button");
      del.className = "page-del";
      del.type = "button";
      del.textContent = "삭제";
      del.setAttribute("aria-label", `${p.title || "제목 없음"} 삭제`);
      del.addEventListener("click", () => deletePage(p.id));
      li.append(btn, del);
      // 검색 중이 아닐 때만 끌어서 순서 바꾸기 (마우스는 바로, 폰은 길게 누른 뒤)
      if (!q) {
        li.addEventListener("pointerdown", e => {
          if (e.button > 0 || e.target.closest(".page-del")) return;
          dragSort(e, li, listEl, (from, to) => {
            checkpoint();
            const [moved] = state.pages.splice(from, 1);
            state.pages.splice(to, 0, moved);
            save();
            renderSidebar();
          }, e.pointerType === "mouse" ? 0 : 400);
        });
      }
      listEl.appendChild(li);
    });
    if (q && !shown) listEl.innerHTML = '<li class="page-empty">검색 결과가 없어요</li>';
  }

  function renderHead() {
    const p = page();
    iconBtn.hidden = !p.icon;
    iconBtn.textContent = p.icon;
    addIconBtn.hidden = !!p.icon;
    crumbEl.textContent = (p.icon ? p.icon + " " : "") + (p.title || "제목 없음");
    document.title = (p.title || "제목 없음") + " · 미니 노션";
  }

  function setPlainEditable(el) {
    try { el.contentEditable = "plaintext-only"; } catch (e) { el.contentEditable = "true"; }
  }

  function missingEl(b) {
    const m = document.createElement("div");
    m.className = "missing";
    m.textContent = `파일을 찾을 수 없어요: ${b.name || ""}`;
    return m;
  }

  function blockEl(b) {
    const row = document.createElement("div");
    row.className = "block" + (b.type === "todo" && b.checked ? " done" : "") + (b.type === "toggle" && b.open ? " open" : "");
    row.dataset.id = b.id;
    row.dataset.type = b.type;

    // 손잡이: 끌면 순서 바꾸기, 누르면 블록 메뉴
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "handle";
    handle.tabIndex = -1;
    handle.textContent = "⋮⋮";
    handle.title = "끌어서 옮기기 · 눌러서 메뉴";
    handle.setAttribute("aria-label", "블록 메뉴");
    handle.addEventListener("pointerdown", e => {
      if (e.button > 0) return;
      e.preventDefault();
      dragSort(e, row, blocksEl, moveBlock, 0);
    });
    handle.addEventListener("click", () => openBlockMenu(b, handle));
    row.appendChild(handle);

    if (b.type === "divider") {
      row.tabIndex = 0;
      row.appendChild(document.createElement("hr"));
      return row;
    }
    if (b.type === "image") {
      row.tabIndex = 0;
      const fig = document.createElement("figure");
      fig.className = "media";
      const img = document.createElement("img");
      img.alt = b.name || "이미지";
      img.draggable = false;
      fig.appendChild(img);
      blobUrl(b.fileId).then(u => { if (u) img.src = u; else fig.replaceChildren(missingEl(b)); });
      row.appendChild(fig);
      return row;
    }
    if (b.type === "file") {
      row.tabIndex = 0;
      const a = document.createElement("a");
      a.className = "file-card";
      a.tabIndex = -1;
      a.download = b.name || "file";
      a.innerHTML = '<span class="file-ico">📎</span><span class="file-name"></span><span class="file-size"></span>';
      a.querySelector(".file-name").textContent = b.name || "파일";
      a.querySelector(".file-size").textContent = formatSize(b.size);
      blobUrl(b.fileId).then(u => { if (u) a.href = u; else a.replaceWith(missingEl(b)); });
      row.appendChild(a);
      return row;
    }
    if (b.type === "code") {
      const c = document.createElement("div");
      c.className = "code";
      setPlainEditable(c);
      c.spellcheck = false;
      c.dataset.placeholder = "코드 (빈 줄에서 Enter로 나가기)";
      c.textContent = b.text || "";
      row.appendChild(c);
      return row;
    }
    if (b.type === "bullet") {
      const dot = document.createElement("span");
      dot.className = "bullet";
      row.appendChild(dot);
    }
    if (b.type === "num") {
      const n = document.createElement("span");
      n.className = "num";
      row.appendChild(n);
    }
    if (b.type === "todo") {
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "check";
      cb.checked = !!b.checked;
      cb.setAttribute("aria-label", "완료 표시");
      cb.addEventListener("change", () => {
        checkpoint();
        b.checked = cb.checked;
        row.classList.toggle("done", cb.checked);
        save();
      });
      row.appendChild(cb);
    }
    let host = row, tb = null;
    if (b.type === "toggle") {
      tb = document.createElement("button");
      tb.type = "button";
      tb.className = "toggle-btn";
      tb.textContent = "▶";
      tb.setAttribute("aria-label", "펼치기/접기");
      tb.setAttribute("aria-expanded", String(!!b.open));
      host = document.createElement("div");
      host.className = "toggle-main";
      row.append(tb, host);
    }
    const text = document.createElement("div");
    text.className = "text";
    text.contentEditable = "true";
    text.spellcheck = false;
    text.dataset.placeholder = PLACEHOLDER[b.type] || "";
    text.innerHTML = sanitize(b.html);
    host.appendChild(text);
    if (tb) {
      const body = document.createElement("div");
      body.className = "tbody";
      setPlainEditable(body);
      body.spellcheck = false;
      body.dataset.placeholder = "펼쳤을 때 보일 내용";
      body.textContent = b.body || "";
      body.hidden = !b.open;
      host.appendChild(body);
      tb.addEventListener("click", () => {
        checkpoint();
        b.open = !b.open;
        row.classList.toggle("open", b.open);
        body.hidden = !b.open;
        tb.setAttribute("aria-expanded", String(b.open));
        save();
      });
    }
    return row;
  }

  function renumber() {
    let n = 0;
    for (const row of blocksEl.children) {
      if (row.dataset.type === "num") row.querySelector(".num").textContent = ++n + ".";
      else n = 0;
    }
  }

  function renderBlocks() {
    blocksEl.innerHTML = "";
    const p = page();
    if (!p.blocks.length) p.blocks.push(block("p"));
    p.blocks.forEach(b => blocksEl.appendChild(blockEl(b)));
    renumber();
  }

  function renderAll() {
    closeMenu();
    closePopovers();
    fmtEl.hidden = true;
    renderSidebar();
    titleEl.textContent = page().title;
    renderHead();
    renderBlocks();
  }

  // ---------- 커서 ----------
  function caretOffset(el) {
    const sel = getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) return 0;
    const r = sel.getRangeAt(0);
    const pre = r.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(r.startContainer, r.startOffset);
    return pre.toString().length;
  }
  function setCaret(el, offset) {
    if (!el) return;
    el.focus();
    const r = document.createRange();
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n, left = offset, placed = false;
    while ((n = w.nextNode())) {
      if (left <= n.length) { r.setStart(n, left); r.collapse(true); placed = true; break; }
      left -= n.length;
    }
    if (!placed) { r.selectNodeContents(el); r.collapse(offset <= 0); }
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }
  function focusBlock(b, at) {
    const row = rowOf(b.id);
    if (!row) return;
    if (MEDIA.has(b.type)) { row.focus(); return; }
    setCaret(editableOf(b), at);
  }
  function focusInfo() {
    const a = document.activeElement;
    if (a === titleEl) return { title: true, off: caretOffset(titleEl) };
    const row = a && a.closest && a.closest(".block");
    if (!row || !blocksEl.contains(row)) return null;
    if (a === row) return { id: row.dataset.id, cls: null, off: 0 };
    const cls = a.classList.contains("tbody") ? "tbody" : a.classList.contains("code") ? "code" : "text";
    return { id: row.dataset.id, cls, off: caretOffset(a) };
  }
  function restoreFocus(f) {
    if (!f) return;
    if (f.title) { setCaret(titleEl, f.off); return; }
    const row = rowOf(f.id);
    if (!row) return;
    const el = f.cls && (row.querySelector("." + f.cls) || row.querySelector(".text, .code"));
    if (el && !el.hidden) setCaret(el, Math.min(f.off, el.textContent.length));
    else row.focus();
  }
  const clean = s => s.replace(/ /g, " ").replace(/\n$/, "");

  // 캐럿 위치에서 블록 내용을 앞뒤로 나누기 (서식 유지)
  function splitAtCaret(el) {
    const sel = getSelection();
    let r = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!r || !el.contains(r.startContainer)) {
      r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
    }
    if (!r.collapsed) r.deleteContents();
    const tail = document.createRange();
    tail.setStart(r.startContainer, r.startOffset);
    tail.setEnd(el, el.childNodes.length);
    const box = document.createElement("div");
    box.appendChild(tail.extractContents());
    return [sanitize(el.innerHTML), sanitize(box.innerHTML)];
  }
  function removePrefix(el, n) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let t;
    while (n > 0 && (t = w.nextNode())) {
      const k = Math.min(n, t.length);
      t.deleteData(0, k);
      n -= k;
    }
  }

  // ---------- 블록 조작 ----------
  function rerenderBlock(b) {
    const old = rowOf(b.id);
    if (old) old.replaceWith(blockEl(b));
    renumber();
  }

  function setType(b, type, html) {
    const wasCode = b.type === "code";
    if (html !== undefined) {
      if (type === "code") b.text = plain(html);
      else b.html = html;
    } else if (type === "code" && !wasCode) b.text = plain(b.html || "");
    else if (wasCode && type !== "code") b.html = esc(b.text || "");
    b.type = type;
    if (type !== "todo") b.checked = false;
    rerenderBlock(b);
    save();
  }

  function insertAfter(i, nb) {
    page().blocks.splice(i + 1, 0, nb);
    const el = blockEl(nb);
    const ref = blocksEl.children[i];
    if (ref) ref.after(el); else blocksEl.prepend(el);
    renumber();
  }

  function splitBlock(b, el) {
    const i = indexOf(b.id);
    if (b.type !== "p" && !/^h\d$/.test(b.type) && !el.textContent) { // 빈 목록·인용·토글에서 Enter → 문단으로
      checkpoint();
      setType(b, "p", "");
      focusBlock(b, 0);
      return;
    }
    checkpoint();
    if (caretOffset(el) === 0 && el.textContent && getSelection().isCollapsed) { // 맨 앞에서 Enter → 위에 빈 문단
      insertAfter(i - 1, block("p"));
      setCaret(el, 0);
      save();
      return;
    }
    const [before, after] = splitAtCaret(el);
    b.html = before;
    el.innerHTML = before;
    const nb = block(LISTY.has(b.type) || b.type === "toggle" ? b.type : "p", after);
    insertAfter(i, nb);
    focusBlock(nb, 0);
    save();
  }

  function mergeUp(b, prev) {
    checkpoint();
    const p = page();
    const prevEl = editableOf(prev);
    const joinAt = prevEl.textContent.length;
    if (prev.type === "code") {
      prev.text += plain(b.html);
      prevEl.textContent = prev.text;
    } else {
      prev.html = sanitize(prev.html + b.html);
      prevEl.innerHTML = prev.html;
    }
    p.blocks.splice(indexOf(b.id), 1);
    rowOf(b.id).remove();
    renumber();
    setCaret(prevEl, joinAt);
    save();
  }

  function deleteBlock(b, focus = true) {
    checkpoint();
    const p = page();
    const i = indexOf(b.id);
    if (i < 0) return;
    p.blocks.splice(i, 1);
    rowOf(b.id).remove();
    if (!p.blocks.length) {
      const nb = block("p");
      p.blocks.push(nb);
      blocksEl.appendChild(blockEl(nb));
    }
    renumber();
    save();
    if (focus) focusBlock(p.blocks[Math.max(0, i - 1)], Infinity);
  }

  function duplicateBlock(b) {
    checkpoint();
    const copy = JSON.parse(JSON.stringify(b));
    copy.id = uid();
    insertAfter(indexOf(b.id), copy);
    save();
  }

  function moveBlock(from, to) {
    checkpoint();
    const p = page();
    const [b] = p.blocks.splice(from, 1);
    p.blocks.splice(to, 0, b);
    const node = blocksEl.children[from];
    node.remove();
    blocksEl.insertBefore(node, blocksEl.children[to] || null);
    renumber();
    save();
  }

  function makeDivider(b) {
    checkpoint();
    b.type = "divider";
    delete b.html;
    b.checked = false;
    rerenderBlock(b);
    const i = indexOf(b.id);
    let next = page().blocks[i + 1];
    if (!next || !RICH.has(next.type)) { next = block("p"); insertAfter(i, next); }
    focusBlock(next, 0);
    save();
  }

  let uploadTarget = null;
  function requestUpload(b, kind) {
    setType(b, "p", "");
    uploadTarget = { id: b.id, kind };
    fileInput.accept = kind === "image" ? "image/*" : "";
    fileInput.value = "";
    fileInput.click();
    setCaret(editableOf(b), 0);
  }
  fileInput.addEventListener("change", () => {
    const files = [...fileInput.files];
    if (files.length && uploadTarget) insertFiles(files, uploadTarget.id, uploadTarget.kind);
    uploadTarget = null;
  });

  function moveFocus(b, dir) {
    const p = page();
    const j = indexOf(b.id) + dir;
    if (j < 0) { setCaret(titleEl, Infinity); return true; }
    if (j >= p.blocks.length) return false;
    const t = p.blocks[j];
    if (dir < 0 && t.type === "toggle" && t.open) { setCaret(rowOf(t.id).querySelector(".tbody"), Infinity); return true; }
    focusBlock(t, dir < 0 ? Infinity : 0);
    return true;
  }

  // ---------- 끌어서 순서 바꾸기 (블록·페이지 공용) ----------
  let suppressClick = false;
  document.addEventListener("click", e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
  }, true);

  function dragSort(e, item, list, onDrop, hold) {
    const pid = e.pointerId, sx = e.clientX, sy = e.clientY;
    let dragging = false, items = [], from = -1, to = -1, timer = 0;
    const place = y => {
      let t = items.findIndex(x => { const r = x.getBoundingClientRect(); return y < r.top + r.height / 2; });
      if (t < 0) t = items.length;
      to = t > from ? t - 1 : t;
      const lr = list.getBoundingClientRect();
      const ref = items[t] ? items[t].getBoundingClientRect().top : items[items.length - 1].getBoundingClientRect().bottom;
      dropLine.style.top = (ref - 2) + "px";
      dropLine.style.left = lr.left + "px";
      dropLine.style.width = lr.width + "px";
      dropLine.hidden = false;
    };
    const begin = () => {
      timer = 0;
      dragging = true;
      items = [...list.children];
      from = to = items.indexOf(item);
      item.classList.add("dragging");
      document.body.classList.add("is-dragging");
      closePopovers();
      if (hold) {
        getSelection().removeAllRanges();
        if (navigator.vibrate) navigator.vibrate(15);
        place(sy);
      }
    };
    const move = ev => {
      if (ev.pointerId !== pid) return;
      if (!dragging) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (hold) { finish(); return; } // 길게 누르기 전에 움직이면 스크롤로 보고 취소
        begin();
      }
      ev.preventDefault();
      place(ev.clientY);
      if (ev.clientY < 50) scrollBy(0, -14);
      else if (ev.clientY > innerHeight - 50) scrollBy(0, 14);
    };
    const up = ev => {
      if (ev.pointerId !== pid) return;
      const ok = dragging && ev.type === "pointerup" && to >= 0 && to !== from;
      finish();
      if (ok) onDrop(from, to);
    };
    const noScroll = ev => { if (dragging) ev.preventDefault(); };
    const noMenu = ev => { if (dragging || timer) ev.preventDefault(); };
    function finish() {
      if (dragging) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 300); }
      clearTimeout(timer);
      timer = 0;
      dragging = false;
      item.classList.remove("dragging");
      document.body.classList.remove("is-dragging");
      dropLine.hidden = true;
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("touchmove", noScroll);
      document.removeEventListener("contextmenu", noMenu);
    }
    if (hold) timer = setTimeout(begin, hold);
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("touchmove", noScroll, { passive: false });
    document.addEventListener("contextmenu", noMenu);
  }

  // ---------- 슬래시 메뉴 ----------
  let menu = null; // { blockId, items, index }
  function openMenu(b, query) {
    const q = query.trim().toLowerCase();
    const items = TYPES.filter(t => !q || t.label.toLowerCase().includes(q) || t.keys.includes(q));
    menu = { blockId: b.id, items, index: 0 };
    menuEl.innerHTML = "";
    const label = document.createElement("div");
    label.className = "menu-label";
    label.textContent = "블록 종류";
    menuEl.appendChild(label);
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "slash-empty";
      empty.textContent = "일치하는 블록이 없어요";
      menuEl.appendChild(empty);
    }
    items.forEach((t, k) => {
      const btn = document.createElement("button");
      btn.className = "slash-item" + (k === 0 ? " active" : "");
      btn.type = "button";
      btn.innerHTML = `<span class="slash-icon"></span><span><div class="slash-name"></div><div class="slash-hint"></div></span>`;
      btn.querySelector(".slash-icon").textContent = t.icon;
      btn.querySelector(".slash-name").textContent = t.label;
      btn.querySelector(".slash-hint").textContent = t.hint;
      btn.addEventListener("mousedown", e => { e.preventDefault(); pickMenu(k); });
      menuEl.appendChild(btn);
    });
    const row = rowOf(b.id);
    const doc = docEl.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    menuEl.style.top = (r.bottom - doc.top + 4) + "px";
    menuEl.style.left = Math.max(0, Math.min(r.left - doc.left, doc.width - 260)) + "px";
    menuEl.hidden = false;
    menuEl.scrollTop = 0;
  }
  function highlight() {
    menuEl.querySelectorAll(".slash-item").forEach((el, k) => {
      el.classList.toggle("active", k === menu.index);
      if (k === menu.index) el.scrollIntoView({ block: "nearest" });
    });
  }
  function pickMenu(k) {
    if (!menu || !menu.items[k]) return;
    const b = blockById(menu.blockId);
    const t = menu.items[k];
    closeMenu();
    if (!b) return;
    checkpoint();
    if (t.type === "image" || t.type === "file") requestUpload(b, t.type);
    else if (t.type === "divider") makeDivider(b);
    else { setType(b, t.type, ""); focusBlock(b, 0); }
  }
  function closeMenu() { menu = null; menuEl.hidden = true; }

  // ---------- 팝오버 (블록 메뉴, 아이콘 고르기) ----------
  function openPopover(pop, anchor) {
    closePopovers();
    pop.hidden = false;
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let top = r.bottom + 6;
    if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 6);
    pop.style.top = top + "px";
    pop.style.left = Math.min(Math.max(8, r.left), innerWidth - w - 8) + "px";
  }
  function closePopovers() { blockMenuEl.hidden = true; emojiEl.hidden = true; }
  document.addEventListener("pointerdown", e => {
    if (!e.target.closest(".popover, .handle, #page-icon, #add-icon")) closePopovers();
  });

  function openBlockMenu(b, anchor) {
    const i = indexOf(b.id), n = page().blocks.length;
    if (i < 0) return;
    const items = [
      ["↑", "위로 이동", i > 0, () => moveBlock(i, i - 1)],
      ["↓", "아래로 이동", i < n - 1, () => moveBlock(i, i + 1)],
      ["⧉", "복제", true, () => duplicateBlock(b)]
    ];
    if (b.fileId) items.push(["⬇", "다운로드", true, () => downloadFile(b)]);
    items.push(["🗑", "삭제", true, () => deleteBlock(b, false)]);
    blockMenuEl.innerHTML = "";
    items.forEach(([ic, label, enabled, fn]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pop-item";
      btn.disabled = !enabled;
      btn.innerHTML = '<span class="pop-ic"></span><span></span>';
      btn.firstChild.textContent = ic;
      btn.lastChild.textContent = label;
      btn.addEventListener("click", () => { closePopovers(); fn(); });
      blockMenuEl.appendChild(btn);
    });
    openPopover(blockMenuEl, anchor);
  }

  function openEmoji(anchor) {
    emojiEl.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "emoji-grid";
    EMOJIS.forEach(em => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "emoji";
      b.textContent = em;
      b.addEventListener("click", () => setIcon(em));
      grid.appendChild(b);
    });
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "pop-item";
    rm.textContent = "아이콘 없애기";
    rm.addEventListener("click", () => setIcon(""));
    emojiEl.append(grid, rm);
    openPopover(emojiEl, anchor);
  }
  function setIcon(em) {
    closePopovers();
    checkpoint();
    page().icon = em;
    save();
    renderHead();
    renderSidebar();
  }
  iconBtn.addEventListener("click", () => openEmoji(iconBtn));
  addIconBtn.addEventListener("click", () => openEmoji(addIconBtn));

  // ---------- 글자 서식 막대 ----------
  let fmtRange = null, fmtBusy = false;
  const coarse = matchMedia("(pointer: coarse)");
  function showFmt() {
    if (!fmtRange) return;
    fmtEl.hidden = false;
    const rect = fmtRange.getBoundingClientRect(), w = fmtEl.offsetWidth, h = fmtEl.offsetHeight;
    let top = coarse.matches ? rect.bottom + 12 : rect.top - h - 8; // 폰은 기본 복사 메뉴를 피해 아래쪽에
    if (top < 8) top = rect.bottom + 8;
    if (top + h > innerHeight - 8) top = rect.top - h - 8;
    fmtEl.style.top = top + "px";
    fmtEl.style.left = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2), innerWidth - w - 8) + "px";
    fmtEl.querySelectorAll("button").forEach(btn => {
      let on = false;
      try { on = document.queryCommandState(btn.dataset.cmd); } catch (e) { /* 지원하지 않는 브라우저 */ }
      btn.classList.toggle("on", on);
    });
  }
  document.addEventListener("selectionchange", () => {
    if (fmtBusy) return;
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) { fmtEl.hidden = true; return; }
    const node = sel.anchorNode;
    const host = node && (node.nodeType === 1 ? node : node.parentElement);
    const el = host && host.closest(".text");
    if (!el || !blocksEl.contains(el) || !el.contains(sel.focusNode)) { fmtEl.hidden = true; return; }
    fmtRange = sel.getRangeAt(0).cloneRange();
    showFmt();
  });
  addEventListener("scroll", () => { if (!fmtEl.hidden) showFmt(); }, { passive: true });
  fmtEl.addEventListener("pointerdown", e => { e.preventDefault(); fmtBusy = true; });
  fmtEl.addEventListener("mousedown", e => e.preventDefault());
  fmtEl.addEventListener("click", e => {
    const btn = e.target.closest("button");
    fmtBusy = false;
    if (!btn || !fmtRange) return;
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(fmtRange);
    format(btn.dataset.cmd);
    if (sel.rangeCount) fmtRange = sel.getRangeAt(0).cloneRange();
    showFmt();
  });
  function format(cmd) {
    document.execCommand(cmd);
    const sel = getSelection();
    const node = sel.anchorNode;
    const host = node && (node.nodeType === 1 ? node : node.parentElement);
    const el = host && host.closest(".text");
    if (!el) return;
    const b = blockById(el.closest(".block").dataset.id);
    if (b) { b.html = sanitize(el.innerHTML); save(); }
  }

  // ---------- 이벤트 ----------
  blocksEl.addEventListener("input", e => {
    const el = e.target;
    const row = el.closest(".block");
    if (!row) return;
    const b = blockById(row.dataset.id);
    if (!b) return;
    if (el.classList.contains("code")) { b.text = el.textContent; save(); return; }
    if (el.classList.contains("tbody")) { b.body = el.textContent; save(); return; }
    if (!el.classList.contains("text")) return;
    if (!el.textContent && el.innerHTML) el.innerHTML = "";
    b.html = sanitize(el.innerHTML);
    const text = el.textContent.replace(/ /g, " ");

    // 마크다운 단축키: 문단 맨 앞에서만
    if (b.type === "p") {
      if (text === "---") { closeMenu(); makeDivider(b); return; }
      const hit = SHORTCUTS.find(([mark]) => text.startsWith(mark));
      if (hit) {
        closeMenu();
        checkpoint();
        removePrefix(el, hit[0].length);
        setType(b, hit[1], sanitize(el.innerHTML));
        focusBlock(b, 0);
        return;
      }
    }
    // 슬래시 메뉴
    if (text.startsWith("/") && !text.includes(" ")) openMenu(b, text.slice(1));
    else closeMenu();
    save();
  });

  blocksEl.addEventListener("keydown", e => {
    if (e.isComposing || e.keyCode === 229) return; // 한글 조합 중에는 건드리지 않기
    const el = e.target;
    const row = el.closest(".block");
    if (!row) return;
    const b = blockById(row.dataset.id);
    if (!b) return;
    const media = el === row || el.classList.contains("file-card");

    // Alt+↑/↓: 블록 옮기기
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && (media || el.isContentEditable)) {
      e.preventDefault();
      const i = indexOf(b.id), j = i + (e.key === "ArrowUp" ? -1 : 1);
      if (j < 0 || j >= page().blocks.length) return;
      const off = media ? 0 : caretOffset(el);
      moveBlock(i, j);
      if (media) row.focus(); else setCaret(el, off);
      return;
    }
    if (media) mediaKey(e, b, row);
    else if (el.classList.contains("code")) codeKey(e, b, el);
    else if (el.classList.contains("tbody")) bodyKey(e, b, el);
    else if (el.classList.contains("text")) textKey(e, b, el);
  });

  function textKey(e, b, el) {
    if (menu) {
      if (e.key === "ArrowDown") { e.preventDefault(); menu.index = (menu.index + 1) % Math.max(menu.items.length, 1); highlight(); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); menu.index = (menu.index - 1 + menu.items.length) % Math.max(menu.items.length, 1); highlight(); return; }
      if (e.key === "Enter") { e.preventDefault(); if (menu.items.length) pickMenu(menu.index); else closeMenu(); return; }
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      const k = e.key.toLowerCase();
      const cmd = e.shiftKey ? (k === "x" || k === "s" ? "strikeThrough" : null)
        : ({ b: "bold", i: "italic", u: "underline" })[k];
      if (cmd) { e.preventDefault(); format(cmd); return; }
    }

    const collapsed = getSelection().isCollapsed;
    const offset = caretOffset(el);
    const len = el.textContent.length;
    const body = b.type === "toggle" && b.open ? el.parentElement.querySelector(".tbody") : null;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (body && offset === len) { setCaret(body, 0); return; }
      splitBlock(b, el);
    } else if (e.key === "Backspace" && collapsed && offset === 0) {
      if (b.type !== "p") { e.preventDefault(); checkpoint(); setType(b, "p"); focusBlock(b, 0); return; }
      const i = indexOf(b.id);
      if (i <= 0) return;
      e.preventDefault();
      const prev = page().blocks[i - 1];
      if (MEDIA.has(prev.type)) {
        if (!len) deleteBlock(b, false);
        rowOf(prev.id).focus();
      } else mergeUp(b, prev);
    } else if (e.key === "ArrowUp" && collapsed && offset === 0) {
      if (moveFocus(b, -1)) e.preventDefault();
    } else if (e.key === "ArrowDown" && collapsed && offset === len) {
      if (body) { e.preventDefault(); setCaret(body, 0); return; }
      if (moveFocus(b, 1)) e.preventDefault();
    }
  }

  function codeKey(e, b, el) {
    const collapsed = getSelection().isCollapsed;
    const off = caretOffset(el);
    const text = el.textContent;
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); document.execCommand("insertText", false, "  "); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "Enter" && (mod || (collapsed && off === text.length && text.endsWith("\n")))) {
      e.preventDefault(); // 빈 줄에서 Enter(또는 Ctrl+Enter) → 코드 블록 나가기
      checkpoint();
      if (!mod) { b.text = text.replace(/\n$/, ""); el.textContent = b.text; }
      const nb = block("p");
      insertAfter(indexOf(b.id), nb);
      focusBlock(nb, 0);
      save();
      return;
    }
    if (e.key === "Backspace" && collapsed && off === 0 && !text) { e.preventDefault(); checkpoint(); setType(b, "p", ""); focusBlock(b, 0); return; }
    if (e.key === "ArrowUp" && collapsed && off === 0) { if (moveFocus(b, -1)) e.preventDefault(); }
    else if (e.key === "ArrowDown" && collapsed && off === text.length) { if (moveFocus(b, 1)) e.preventDefault(); }
  }

  function bodyKey(e, b, el) {
    const collapsed = getSelection().isCollapsed;
    const off = caretOffset(el);
    const len = el.textContent.length;
    const summary = el.parentElement.querySelector(".text");
    if ((e.key === "ArrowUp" && collapsed && off === 0) || (e.key === "Backspace" && collapsed && off === 0 && !len)) {
      e.preventDefault();
      setCaret(summary, Infinity);
    } else if (e.key === "ArrowDown" && collapsed && off === len) {
      if (moveFocus(b, 1)) e.preventDefault();
    }
  }

  function mediaKey(e, b, row) {
    if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); deleteBlock(b); }
    else if (e.key === "Enter") {
      e.preventDefault();
      checkpoint();
      const nb = block("p");
      insertAfter(indexOf(b.id), nb);
      focusBlock(nb, 0);
      save();
    } else if (e.key === "ArrowUp") { e.preventDefault(); moveFocus(b, -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveFocus(b, 1); }
  }

  blocksEl.addEventListener("focusin", e => {
    const row = e.target.closest(".block");
    if (row) row.classList.add("focused");
  });
  blocksEl.addEventListener("focusout", e => {
    const row = e.target.closest(".block");
    if (row) row.classList.remove("focused");
    setTimeout(() => { if (!blocksEl.contains(document.activeElement)) closeMenu(); }, 0);
  });

  // 빈 아래쪽을 누르면 마지막 블록으로 (마지막이 첨부·코드면 새 문단)
  editorEl.addEventListener("click", e => {
    if (e.target !== editorEl && e.target !== docEl) return;
    if (e.clientY < blocksEl.getBoundingClientRect().bottom) return;
    const p = page();
    const last = p.blocks[p.blocks.length - 1];
    if (RICH.has(last.type)) { focusBlock(last, Infinity); return; }
    checkpoint();
    const nb = block("p");
    insertAfter(p.blocks.length - 1, nb);
    focusBlock(nb, 0);
    save();
  });

  // 붙여넣기: 이미지·파일은 첨부로, 글자는 서식 없이
  document.addEventListener("paste", e => {
    const t = e.target.closest && e.target.closest("[contenteditable]");
    if (!t) return;
    const cd = e.clipboardData;
    if (!cd) return;
    const files = [...cd.files];
    const row = t.closest(".block");
    if (files.length && row) { e.preventDefault(); insertFiles(files, row.dataset.id); return; }
    if (t.classList.contains("code") || t.classList.contains("tbody")) {
      if (t.contentEditable === "plaintext-only") return;
      e.preventDefault();
      document.execCommand("insertText", false, cd.getData("text/plain"));
      return;
    }
    e.preventDefault();
    document.execCommand("insertText", false, cd.getData("text/plain").replace(/\r?\n/g, " "));
  });

  // 파일을 끌어다 놓기
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
  editorEl.addEventListener("dragover", e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    editorEl.classList.add("drop-target");
  });
  editorEl.addEventListener("dragleave", e => {
    if (!editorEl.contains(e.relatedTarget)) editorEl.classList.remove("drop-target");
  });
  editorEl.addEventListener("drop", e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    editorEl.classList.remove("drop-target");
    const files = [...e.dataTransfer.files];
    if (!files.length) return;
    let anchor = null;
    for (const r of blocksEl.children) if (r.getBoundingClientRect().top < e.clientY) anchor = r;
    insertFiles(files, anchor ? anchor.dataset.id : null);
  });

  // 되돌리기 단축키 (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closePopovers(); fmtEl.hidden = true; }
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.isComposing || e.target === searchEl) return;
    const k = e.key.toLowerCase();
    if (k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (k === "y" && !e.metaKey) { e.preventDefault(); redo(); }
  }, true);
  document.addEventListener("beforeinput", e => {
    if (e.inputType === "historyUndo") { e.preventDefault(); undo(); }
    else if (e.inputType === "historyRedo") { e.preventDefault(); redo(); }
  });
  for (const [sel, fn] of [["#undo", undo], ["#redo", redo]]) {
    const btn = $(sel);
    btn.addEventListener("pointerdown", e => e.preventDefault()); // 글 쓰던 위치를 잃지 않게
    btn.addEventListener("click", fn);
  }

  // 제목
  titleEl.addEventListener("input", () => {
    if (!titleEl.textContent && titleEl.innerHTML) titleEl.innerHTML = "";
    page().title = clean(titleEl.textContent);
    const name = listEl.querySelector(`.page-item[data-id="${page().id}"] .page-name`);
    if (name) name.textContent = page().title || "제목 없음";
    renderHead();
    save();
  });
  titleEl.addEventListener("keydown", e => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      focusBlock(page().blocks[0], 0);
    }
  });

  // 페이지 열기·추가·삭제
  function openPage(id) {
    state.current = id;
    save();
    renderAll();
  }
  function addPage() {
    checkpoint();
    const p = { id: uid(), title: "", icon: "", blocks: [block("p")] };
    state.pages.push(p);
    state.current = p.id;
    searchEl.value = "";
    save();
    renderAll();
    titleEl.focus();
  }
  function deletePage(id) {
    checkpoint();
    const i = state.pages.findIndex(p => p.id === id);
    state.pages.splice(i, 1);
    if (!state.pages.length) state.pages.push({ id: uid(), title: "", icon: "", blocks: [block("p")] });
    if (state.current === id) state.current = state.pages[Math.max(0, i - 1)].id;
    save();
    renderAll();
  }
  $("#add-page").addEventListener("click", addPage);
  searchEl.addEventListener("input", renderSidebar);

  // 백업
  $("#export-btn").addEventListener("click", exportBackup);
  $("#import-btn").addEventListener("click", () => { importInput.value = ""; importInput.click(); });
  importInput.addEventListener("change", () => { if (importInput.files[0]) importBackup(importInput.files[0]); });

  // 화면 테마: 자동 → 밝게 → 어둡게
  let theme = "auto";
  try { theme = localStorage.getItem(THEME_KEY) || "auto"; } catch (e) { /* 기본값 사용 */ }
  function applyTheme(t) {
    const found = THEMES.find(x => x[0] === t) || THEMES[0];
    theme = found[0];
    if (theme === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    themeBtn.textContent = `${found[1]} ${found[2]}`;
    themeBtn.setAttribute("aria-label", `화면 테마: ${found[2]} (눌러서 바꾸기)`);
  }
  themeBtn.addEventListener("click", () => {
    const i = THEMES.findIndex(x => x[0] === theme);
    applyTheme(THEMES[(i + 1) % THEMES.length][0]);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* 저장 못 해도 이번엔 적용 */ }
  });

  // 휴대폰: 페이지 목록 접기/펴기
  const sidebar = $("#sidebar");
  const toggle = $("#side-toggle");
  toggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("collapsed") === false;
    toggle.setAttribute("aria-expanded", String(open));
  });
  listEl.addEventListener("click", e => {
    if (e.target.closest(".page-link")) { sidebar.classList.add("collapsed"); toggle.setAttribute("aria-expanded", "false"); }
  });

  // 앱을 닫거나 다른 앱으로 갈 때 바로 저장
  addEventListener("pagehide", commit);
  document.addEventListener("visibilitychange", () => { if (document.hidden) commit(); });

  applyTheme(theme);
  renderAll();
  cleanupFiles();
})();
