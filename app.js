// 미니 노션: 페이지 목록, 블록 편집기, 슬래시 명령어, 마크다운 단축키
(() => {
  const STORE_KEY = "mini-notion";
  const TYPES = [
    { type: "p", label: "문단", hint: "일반 텍스트", icon: "Aa", keys: "문단 텍스트 text paragraph" },
    { type: "h1", label: "제목 1", hint: "큰 제목", icon: "H1", keys: "제목1 제목 heading h1" },
    { type: "h2", label: "제목 2", hint: "중간 제목", icon: "H2", keys: "제목2 제목 heading h2" },
    { type: "bullet", label: "글머리 목록", hint: "점으로 나열", icon: "•", keys: "글머리 목록 리스트 list bullet" },
    { type: "todo", label: "체크리스트", hint: "할 일 체크", icon: "☑", keys: "체크리스트 할일 todo check" }
  ];
  const PLACEHOLDER = { p: "'/'를 입력해 블록 종류 고르기", h1: "제목 1", h2: "제목 2", bullet: "목록", todo: "할 일" };
  const SHORTCUTS = [["## ", "h2"], ["# ", "h1"], ["- ", "bullet"], ["* ", "bullet"], ["[] ", "todo"], ["[ ] ", "todo"]];

  const uid = () => Math.random().toString(36).slice(2, 10);
  const block = (type, text = "", checked = false) => ({ id: uid(), type, text, checked });

  // ---------- 저장 ----------
  function seed() {
    const a = {
      id: uid(), title: "시작하기 (예시)", blocks: [
        block("p", "미니 노션에 오신 걸 환영합니다. 이 페이지는 예시예요. 마음대로 고치거나 지워도 됩니다."),
        block("h2", "블록 다루기"),
        block("bullet", "Enter를 누르면 아래에 새 블록이 생겨요."),
        block("bullet", "빈 블록에서 Backspace를 누르면 블록이 지워져요."),
        block("bullet", "빈 블록에서 / 를 입력하면 블록 종류를 고를 수 있어요."),
        block("h2", "마크다운 단축키"),
        block("todo", "줄 맨 앞에 # 과 공백을 입력해 제목 1 만들기", true),
        block("todo", "## 과 공백으로 제목 2 만들기"),
        block("todo", "- 와 공백으로 글머리 목록 만들기"),
        block("todo", "[] 와 공백으로 체크리스트 만들기"),
        block("p", "")
      ]
    };
    const b = {
      id: uid(), title: "회의 메모 (예시)", blocks: [
        block("h1", "주간 회의"),
        block("p", "참석: 기획, 디자인, 개발"),
        block("h2", "결정한 것"),
        block("bullet", "다음 주 금요일까지 시안 2개 공유"),
        block("h2", "할 일"),
        block("todo", "회의록 정리해서 공유"),
        block("todo", "시안 피드백 모으기")
      ]
    };
    return { pages: [a, b], current: a.id };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.pages) && data.pages.length) return data;
      }
    } catch (e) { /* 저장소를 못 쓰는 환경이면 예시로 시작 */ }
    return seed();
  }

  let state = load();
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        savedEl.textContent = "저장됨";
      } catch (e) {
        savedEl.textContent = "이 브라우저에서는 저장되지 않아요";
      }
    }, 250);
  }

  const page = () => state.pages.find(p => p.id === state.current) || state.pages[0];
  const findBlock = id => page().blocks.findIndex(b => b.id === id);

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const listEl = $("#page-list");
  const titleEl = $("#page-title");
  const blocksEl = $("#blocks");
  const savedEl = $("#saved");
  const menuEl = $("#slash-menu");

  function renderSidebar() {
    listEl.innerHTML = "";
    state.pages.forEach(p => {
      const li = document.createElement("li");
      li.className = "page-item" + (p.id === page().id ? " active" : "");
      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.textContent = p.title || "제목 없음";
      btn.addEventListener("click", () => { state.current = p.id; save(); renderAll(); });
      const del = document.createElement("button");
      del.className = "page-del";
      del.textContent = "삭제";
      del.setAttribute("aria-label", `${p.title || "제목 없음"} 삭제`);
      del.addEventListener("click", () => deletePage(p.id));
      li.append(btn, del);
      listEl.appendChild(li);
    });
  }

  function blockEl(b) {
    const row = document.createElement("div");
    row.className = "block" + (b.type === "todo" && b.checked ? " done" : "");
    row.dataset.id = b.id;
    row.dataset.type = b.type;
    if (b.type === "bullet") {
      const dot = document.createElement("span");
      dot.className = "bullet";
      row.appendChild(dot);
    }
    if (b.type === "todo") {
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "check";
      cb.checked = !!b.checked;
      cb.setAttribute("aria-label", "완료 표시");
      cb.addEventListener("change", () => {
        b.checked = cb.checked;
        row.classList.toggle("done", cb.checked);
        save();
      });
      row.appendChild(cb);
    }
    const text = document.createElement("div");
    text.className = "text";
    text.contentEditable = "true";
    text.spellcheck = false;
    text.dataset.placeholder = PLACEHOLDER[b.type];
    text.textContent = b.text;
    row.appendChild(text);
    return row;
  }

  function renderBlocks() {
    blocksEl.innerHTML = "";
    const p = page();
    if (!p.blocks.length) p.blocks.push(block("p"));
    p.blocks.forEach(b => blocksEl.appendChild(blockEl(b)));
  }

  function renderAll() {
    closeMenu();
    renderSidebar();
    titleEl.textContent = page().title;
    renderBlocks();
    document.title = (page().title || "제목 없음") + " · 미니 노션";
  }

  // ---------- 커서 ----------
  const textOf = id => blocksEl.querySelector(`.block[data-id="${id}"] .text`);
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
    const node = el.firstChild;
    const r = document.createRange();
    if (node && node.nodeType === 3) {
      r.setStart(node, Math.min(offset, node.length));
    } else {
      r.selectNodeContents(el);
      r.collapse(offset > 0 ? false : true);
    }
    r.collapse(true);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }
  const clean = s => s.replace(/ /g, " ").replace(/\n$/, "");

  // ---------- 블록 조작 ----------
  function setType(b, type, text) {
    b.type = type;
    if (text !== undefined) b.text = text;
    if (type !== "todo") b.checked = false;
    const old = blocksEl.querySelector(`.block[data-id="${b.id}"]`);
    old.replaceWith(blockEl(b));
    save();
  }

  function splitBlock(b, offset) {
    const p = page();
    const i = findBlock(b.id);
    const listy = b.type === "bullet" || b.type === "todo";
    if (listy && b.text === "") { // 빈 목록에서 Enter → 목록 끝내기
      setType(b, "p", "");
      setCaret(textOf(b.id), 0);
      return;
    }
    const after = b.text.slice(offset);
    b.text = b.text.slice(0, offset);
    textOf(b.id).textContent = b.text;
    const nb = block(listy ? b.type : "p", after);
    p.blocks.splice(i + 1, 0, nb);
    blocksEl.children[i].after(blockEl(nb));
    setCaret(textOf(nb.id), 0);
    save();
  }

  function removeBlock(b, mergeText) {
    const p = page();
    const i = findBlock(b.id);
    if (i <= 0) return;
    const prev = p.blocks[i - 1];
    const joinAt = prev.text.length;
    if (mergeText) {
      prev.text += b.text;
      textOf(prev.id).textContent = prev.text;
    }
    p.blocks.splice(i, 1);
    blocksEl.children[i].remove();
    setCaret(textOf(prev.id), joinAt);
    save();
  }

  function moveFocus(b, dir) {
    const p = page();
    const j = findBlock(b.id) + dir;
    if (j < 0) { setCaret(titleEl, titleEl.textContent.length); return true; }
    if (j >= p.blocks.length) return false;
    const target = p.blocks[j];
    setCaret(textOf(target.id), dir < 0 ? target.text.length : 0);
    return true;
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
    const row = blocksEl.querySelector(`.block[data-id="${b.id}"]`);
    const doc = document.querySelector(".doc").getBoundingClientRect();
    const r = row.getBoundingClientRect();
    menuEl.style.top = (r.bottom - doc.top + 4) + "px";
    menuEl.style.left = Math.max(0, Math.min(r.left - doc.left, doc.width - 260)) + "px";
    menuEl.hidden = false;
  }
  function highlight() {
    menuEl.querySelectorAll(".slash-item").forEach((el, k) => {
      el.classList.toggle("active", k === menu.index);
      if (k === menu.index) el.scrollIntoView({ block: "nearest" });
    });
  }
  function pickMenu(k) {
    if (!menu || !menu.items[k]) return;
    const b = page().blocks[findBlock(menu.blockId)];
    const t = menu.items[k];
    closeMenu();
    setType(b, t.type, "");
    setCaret(textOf(b.id), 0);
  }
  function closeMenu() { menu = null; menuEl.hidden = true; }

  // ---------- 이벤트 ----------
  blocksEl.addEventListener("input", e => {
    const el = e.target.closest(".text");
    if (!el) return;
    const id = el.parentElement.dataset.id;
    const b = page().blocks[findBlock(id)];
    b.text = clean(el.textContent);

    // 마크다운 단축키: 문단 맨 앞에서만
    if (b.type === "p") {
      const hit = SHORTCUTS.find(([mark]) => b.text.startsWith(mark));
      if (hit) {
        closeMenu();
        setType(b, hit[1], b.text.slice(hit[0].length));
        setCaret(textOf(b.id), 0);
        return;
      }
    }
    // 슬래시 메뉴
    if (b.text.startsWith("/") && !b.text.includes(" ")) openMenu(b, b.text.slice(1));
    else closeMenu();
    save();
  });

  blocksEl.addEventListener("keydown", e => {
    const el = e.target.closest(".text");
    if (!el || e.isComposing || e.keyCode === 229) return; // 한글 조합 중에는 건드리지 않기
    const b = page().blocks[findBlock(el.parentElement.dataset.id)];

    if (menu) {
      if (e.key === "ArrowDown") { e.preventDefault(); menu.index = (menu.index + 1) % Math.max(menu.items.length, 1); highlight(); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); menu.index = (menu.index - 1 + menu.items.length) % Math.max(menu.items.length, 1); highlight(); return; }
      if (e.key === "Enter") { e.preventDefault(); if (menu.items.length) pickMenu(menu.index); else closeMenu(); return; }
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    }

    const sel = getSelection();
    const collapsed = sel.isCollapsed;
    const offset = caretOffset(el);

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      b.text = clean(el.textContent);
      splitBlock(b, offset);
    } else if (e.key === "Backspace" && collapsed && offset === 0) {
      if (b.type !== "p") { e.preventDefault(); setType(b, "p"); setCaret(textOf(b.id), 0); }
      else if (findBlock(b.id) > 0) { e.preventDefault(); removeBlock(b, b.text !== ""); }
    } else if (e.key === "ArrowUp" && collapsed && offset === 0) {
      if (moveFocus(b, -1)) e.preventDefault();
    } else if (e.key === "ArrowDown" && collapsed && offset === el.textContent.length) {
      if (moveFocus(b, 1)) e.preventDefault();
    }
  });

  blocksEl.addEventListener("focusin", e => {
    const row = e.target.closest(".block");
    if (row) row.classList.add("focused");
  });
  blocksEl.addEventListener("focusout", e => {
    const row = e.target.closest(".block");
    if (row) row.classList.remove("focused");
    setTimeout(() => { if (!blocksEl.contains(document.activeElement)) closeMenu(); }, 0);
  });

  // 붙여넣기는 글자만
  document.addEventListener("paste", e => {
    if (!e.target.closest || !e.target.closest("[contenteditable]")) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\r?\n/g, " ");
    document.execCommand("insertText", false, text);
  });

  // 제목
  titleEl.addEventListener("input", () => {
    page().title = clean(titleEl.textContent);
    const active = listEl.querySelector(".page-item.active .page-link");
    if (active) active.textContent = page().title || "제목 없음";
    document.title = (page().title || "제목 없음") + " · 미니 노션";
    save();
  });
  titleEl.addEventListener("keydown", e => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const first = page().blocks[0];
      setCaret(textOf(first.id), 0);
    }
  });

  // 페이지 추가·삭제
  function addPage() {
    const p = { id: uid(), title: "", blocks: [block("p")] };
    state.pages.push(p);
    state.current = p.id;
    save();
    renderAll();
    titleEl.focus();
  }
  function deletePage(id) {
    const i = state.pages.findIndex(p => p.id === id);
    state.pages.splice(i, 1);
    if (!state.pages.length) state.pages.push({ id: uid(), title: "", blocks: [block("p")] });
    if (state.current === id) state.current = state.pages[Math.max(0, i - 1)].id;
    save();
    renderAll();
  }
  $("#add-page").addEventListener("click", addPage);

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

  renderAll();
})();
