/* Knowledge Browser — built-in radial/horizontal mindmap + readable notes */
(() => {
  const state = {
    catalog: null,
    topic: null,
    meta: null,
    activeNote: null,
    tree: null,
  };

  const el = {
    status: document.getElementById("catalog-status"),
    tabs: document.getElementById("topic-tabs"),
    cards: document.getElementById("topic-cards"),
    home: document.getElementById("home-view"),
    topic: document.getElementById("topic-view"),
    notes: document.getElementById("notes"),
    links: document.getElementById("doc-links"),
    meta: document.getElementById("reader-meta"),
    body: document.getElementById("reader-body"),
    mapTitle: document.getElementById("map-title"),
    mapStatus: document.getElementById("map-status"),
    mapHost: document.getElementById("markmap-host"),
    btnFit: document.getElementById("btn-fit"),
  };

  const NOTE_ALIASES = [
    { id: "memory", needles: ["持久記憶", "persistent", "okf", "opencontext", "rune", "heimdall", "失憶"], note: "01-persistent-memory.md", label: "持久記憶" },
    { id: "security", needles: ["安全沙箱", "security", "grith", "gitspawn", "hijack", "不可信"], note: "02-security-sandbox.md", label: "安全沙箱" },
    { id: "backlash", needles: ["採用與反彈", "adoption", "backlash", "slop", "gamedev", "gloop", "agentic"], note: "03-adoption-backlash.md", label: "採用與反彈" },
    { id: "harness", needles: ["本地", "harness", "pi", "opencode", "qwen", "自架"], note: "04-harness-local.md", label: "本地 Harness" },
    { id: "stack", needles: ["互補", "stack", "cursor", "claude", "skills", "hooks", "copilot"], note: "05-complementary-stacks.md", label: "互補 Stack" },
  ];

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);
    if (parts[0] === "topic" && parts[1]) {
      loadTopic(parts[1], parts[2] ? decodeURIComponent(parts[2]) : null).catch((err) => {
        el.mapStatus.hidden = false;
        el.mapStatus.textContent = `載入失敗：${err.message}`;
        el.body.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      });
    } else {
      showHome();
    }
  }

  function showHome() {
    el.home.hidden = false;
    el.topic.hidden = true;
    el.home.classList.remove("is-hidden");
    el.topic.classList.add("is-hidden");
    [...el.tabs.querySelectorAll(".tab")].forEach((b) => b.classList.remove("active"));
  }

  async function loadCatalog() {
    const res = await fetch("./catalog.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`catalog.json HTTP ${res.status}`);
    state.catalog = await res.json();
    el.status.textContent = `更新 ${state.catalog.updated_at || "—"} · ${state.catalog.topics.length} 個主題`;

    el.tabs.innerHTML = "";
    el.cards.innerHTML = "";
    for (const t of state.catalog.topics) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tab";
      tab.textContent = t.title;
      tab.addEventListener("click", () => {
        location.hash = `#/topic/${t.slug}`;
      });
      el.tabs.appendChild(tab);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "topic-card";
      const cov = t.coverage || {};
      card.innerHTML = `
        <h3>${escapeHtml(t.title)}</h3>
        <p>${escapeHtml(t.summary || "")}</p>
        <div class="chips">
          <span class="chip">近 ${escapeHtml(String(t.window_days || 30))} 天</span>
          <span class="chip ok">含心智圖</span>
          ${(cov.ok || []).slice(0, 3).map((s) => `<span class="chip ok">${escapeHtml(s)}</span>`).join("")}
        </div>
      `;
      card.addEventListener("click", () => {
        location.hash = `#/topic/${t.slug}`;
      });
      el.cards.appendChild(card);
    }
  }

  async function loadTopic(slug, noteHint) {
    el.home.hidden = true;
    el.topic.hidden = false;
    el.home.classList.add("is-hidden");
    el.topic.classList.remove("is-hidden");

    [...el.tabs.querySelectorAll(".tab")].forEach((b, i) => {
      const t = state.catalog.topics[i];
      b.classList.toggle("active", t && t.slug === slug);
    });

    const cat = state.catalog.topics.find((t) => t.slug === slug);
    if (!cat) throw new Error(`找不到主題：${slug}`);

    const base = `./topics/${slug}`;
    const [metaRes, mdRes] = await Promise.all([
      fetch(`${base}/meta.json`, { cache: "no-store" }),
      fetch(`${base}/mindmap.md`, { cache: "no-store" }),
    ]);
    if (!metaRes.ok) throw new Error(`meta.json HTTP ${metaRes.status}`);
    if (!mdRes.ok) throw new Error(`mindmap.md HTTP ${mdRes.status}`);

    const meta = await metaRes.json();
    let md = await mdRes.text();
    md = md.replace(/```[\s\S]*?```/g, "").trim();

    state.topic = cat;
    state.meta = meta;
    el.mapTitle.textContent = `${cat.title} · 心智圖`;

    const coverage = cat.coverage || {};
    el.meta.innerHTML = `
      <span class="chip ok">研究窗 ${escapeHtml(String(cat.window_days || meta.window_days || 30))} 天</span>
      <span class="chip">日期 ${escapeHtml(cat.researched_at || meta.researched_at || "")}</span>
      ${(coverage.ok || []).map((s) => `<span class="chip ok">${escapeHtml(s)}</span>`).join("")}
      ${(coverage.absent || []).map((s) => `<span class="chip warn">未含 ${escapeHtml(s)}</span>`).join("")}
    `;

    el.links.innerHTML = `
      <a href="${base}/INDEX.md" target="_blank" rel="noopener">主題索引</a>
      <a href="${base}/mindmap.md" target="_blank" rel="noopener">心智圖 Markdown</a>
      <a href="${base}/sources.md" target="_blank" rel="noopener">來源列表</a>
    `;

    renderNotes(slug, meta);
    state.tree = parseMarkdownTree(md, cat.title);
    drawMindmap(state.tree, slug);
    el.mapStatus.hidden = true;

    if (noteHint && noteHint !== "INDEX.md") {
      await openNote(slug, noteHint);
    } else {
      await openOverview(slug);
    }
  }

  /** Parse # / ## / - lists into a tree (markmap-style outline). */
  function parseMarkdownTree(md, fallbackRoot) {
    const lines = md.split("\n");
    const root = { text: fallbackRoot || "Topic", children: [], depth: 0 };
    const stack = [root];

    for (let raw of lines) {
      const line = raw.replace(/\t/g, "  ");
      if (!line.trim()) continue;

      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        const depth = h[1].length;
        const node = { text: h[2].trim(), children: [], depth };
        while (stack.length > depth) stack.pop();
        while (stack.length < depth) {
          const filler = { text: "", children: [], depth: stack.length };
          stack[stack.length - 1].children.push(filler);
          stack.push(filler);
        }
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        continue;
      }

      const li = /^(\s*)[-*]\s+(.*)$/.exec(line);
      if (li) {
        const node = { text: li[2].trim(), children: [], depth: stack.length };
        stack[stack.length - 1].children.push(node);
        continue;
      }
    }

    // If root has one empty wrapper from "# Title", prefer that child as visual root
    if (root.children.length === 1 && root.children[0].text) {
      return root.children[0];
    }
    if (!root.text || root.text === fallbackRoot) {
      // keep
    }
    return root.children.length ? root : { text: fallbackRoot, children: [], depth: 0 };
  }

  function drawMindmap(tree, slug) {
    // Horizontal tree layout (common web mindmap template)
    const nodeH = 34;
    const nodeGapY = 14;
    const rankGapX = 210;
    const pad = 28;
    const nodeW = 168;

    // Measure subtree leaf counts for vertical span
    function leafCount(n) {
      if (!n.children || !n.children.length) return 1;
      return n.children.reduce((s, c) => s + leafCount(c), 0);
    }

    const positions = new Map();
    let cursorY = 0;

    function layout(n, depth) {
      const leaves = leafCount(n);
      const height = leaves * (nodeH + nodeGapY) - nodeGapY;
      const y0 = cursorY;
      if (!n.children || !n.children.length) {
        const y = cursorY;
        cursorY += nodeH + nodeGapY;
        positions.set(n, { x: pad + depth * rankGapX, y, depth });
        return;
      }
      n.children.forEach((c) => layout(c, depth + 1));
      const first = positions.get(n.children[0]);
      const last = positions.get(n.children[n.children.length - 1]);
      const y = (first.y + last.y) / 2;
      positions.set(n, { x: pad + depth * rankGapX, y, depth });
      // restore cursor already advanced by children
      void height;
      void y0;
    }

    layout(tree, 0);

    let maxX = 0;
    let maxY = 0;
    for (const p of positions.values()) {
      maxX = Math.max(maxX, p.x + nodeW);
      maxY = Math.max(maxY, p.y + nodeH);
    }
    const width = maxX + pad;
    const height = Math.max(maxY + pad, 320);

    const palette = ["#0f5c4c", "#1f7a64", "#3f947c", "#6aaf96", "#97c7b6"];

    const edges = [];
    function walkEdges(n) {
      const a = positions.get(n);
      for (const c of n.children || []) {
        const b = positions.get(c);
        if (a && b) {
          const x1 = a.x + nodeW;
          const y1 = a.y + nodeH / 2;
          const x2 = b.x;
          const y2 = b.y + nodeH / 2;
          const mx = (x1 + x2) / 2;
          edges.push(`<path class="mm-edge" d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" />`);
        }
        walkEdges(c);
      }
    }
    walkEdges(tree);

    const nodes = [];
    function walkNodes(n) {
      const p = positions.get(n);
      if (!p) return;
      const label = truncate(n.text, 18);
      const fill = palette[Math.min(p.depth, palette.length - 1)];
      const note = matchNote(n.text);
      const clickable = note ? "mm-clickable" : "";
      nodes.push(`
        <g class="mm-node ${clickable}" data-text="${escapeAttr(n.text)}" transform="translate(${p.x},${p.y})">
          <rect width="${nodeW}" height="${nodeH}" rx="10" fill="${p.depth === 0 ? fill : "#fffdf8"}" stroke="${fill}" stroke-width="${p.depth === 0 ? 0 : 1.5}" />
          <text x="${nodeW / 2}" y="${nodeH / 2 + 5}" text-anchor="middle" fill="${p.depth === 0 ? "#f7fffb" : "#1c1916"}" font-size="${p.depth === 0 ? 13 : 12}" font-family="Noto Sans TC, sans-serif">${escapeHtml(label)}</text>
        </g>
      `);
      (n.children || []).forEach(walkNodes);
    }
    walkNodes(tree);

    el.mapHost.innerHTML = `
      <div class="mm-scroll">
        <svg class="mm-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="心智圖">
          ${edges.join("")}
          ${nodes.join("")}
        </svg>
      </div>
    `;

    el.mapHost.querySelectorAll(".mm-node.mm-clickable").forEach((g) => {
      g.addEventListener("click", () => {
        const text = g.getAttribute("data-text") || "";
        const hit = matchNote(text);
        if (hit) {
          openNote(slug, hit.note, hit.label);
          document.querySelector(".reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function truncate(s, n) {
    const t = String(s || "");
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
  }

  function matchNote(text) {
    const t = String(text || "").toLowerCase();
    for (const row of NOTE_ALIASES) {
      if (row.needles.some((n) => t.includes(n.toLowerCase()))) return row;
    }
    for (const n of state.meta?.nodes || []) {
      if (n.note && n.label && t.includes(String(n.label).toLowerCase())) {
        return { note: n.note, label: n.label };
      }
    }
    return null;
  }

  function renderNotes(slug, meta) {
    const notes = (meta.nodes || []).filter((n) => n.note);
    const list = notes.length
      ? notes
      : NOTE_ALIASES.map((n) => ({ label: n.label, note: n.note }));

    el.notes.innerHTML = "";
    const overview = document.createElement("button");
    overview.type = "button";
    overview.className = "note-btn";
    overview.innerHTML = `<span class="idx">總覽</span>主題說明`;
    overview.addEventListener("click", () => openOverview(slug));
    el.notes.appendChild(overview);

    list.forEach((n, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "note-btn";
      btn.dataset.note = n.note;
      btn.innerHTML = `<span class="idx">筆記 ${String(i + 1).padStart(2, "0")}</span>${escapeHtml(n.label || n.note)}`;
      btn.addEventListener("click", () => openNote(slug, n.note, n.label));
      el.notes.appendChild(btn);
    });
  }

  async function openOverview(slug) {
    state.activeNote = null;
    [...el.notes.querySelectorAll(".note-btn")].forEach((b, i) => b.classList.toggle("active", i === 0));
    const res = await fetch(`./topics/${slug}/INDEX.md`, { cache: "no-store" });
    if (!res.ok) {
      el.body.innerHTML = `<p class="muted">無法載入總覽（${res.status}）</p>`;
      return;
    }
    el.body.innerHTML =
      `<div class="overview-banner">上方是心智圖全貌。點有對應筆記的分支，或左側原子筆記，可讀主張／證據／下一步。</div>` +
      renderMarkdown(await res.text());
    location.hash = `#/topic/${slug}`;
  }

  async function openNote(slug, filename, label) {
    state.activeNote = filename;
    [...el.notes.querySelectorAll(".note-btn")].forEach((b) => {
      b.classList.toggle("active", b.dataset.note === filename);
    });
    const res = await fetch(`./topics/${slug}/notes/${filename}`, { cache: "no-store" });
    if (!res.ok) {
      el.body.innerHTML = `<p class="muted">無法載入筆記（${res.status}）</p>`;
      return;
    }
    el.body.innerHTML = renderMarkdown(await res.text());
    location.hash = `#/topic/${slug}/${encodeURIComponent(filename)}`;
  }

  function renderMarkdown(src) {
    const lines = String(src).replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let i = 0;
    let paragraph = [];
    let listType = null;
    let listItems = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!listType) return;
      const tag = listType;
      blocks.push(`<${tag}>${listItems.map((x) => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
      listType = null;
      listItems = [];
    };

    while (i < lines.length) {
      const line = lines[i];
      const heading = /^(#{1,3})\s+(.*)$/.exec(line);
      const ul = /^[-*]\s+(.*)$/.exec(line);
      const ol = /^(\d+)\.\s+(.*)$/.exec(line);
      const quote = /^>\s?(.*)$/.exec(line);

      if (!line.trim()) {
        flushParagraph();
        flushList();
        i += 1;
        continue;
      }
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        const rawTitle = heading[2].trim();
        const titleMap = {
          Claim: "主張",
          Evidence: "證據",
          Implications: "意涵",
          Actions: "下一步",
          Links: "相關連結",
          Verdict: "結論",
        };
        const text = titleMap[rawTitle] || rawTitle;
        const sectionClass =
          /^claim$/i.test(rawTitle) ? "section-claim" :
          /^actions$/i.test(rawTitle) ? "section-actions" : "";
        if (sectionClass) {
          const bodyLines = [];
          i += 1;
          while (i < lines.length) {
            const n = lines[i];
            const nh = /^(#{1,3})\s+/.exec(n);
            if (nh && nh[1].length <= level) break;
            bodyLines.push(n);
            i += 1;
          }
          blocks.push(
            `<section class="${sectionClass}"><h${level}>${escapeHtml(text)}</h${level}>${renderMarkdown(bodyLines.join("\n"))}</section>`
          );
          continue;
        }
        blocks.push(`<h${level}>${escapeHtml(text)}</h${level}>`);
        i += 1;
        continue;
      }
      if (ul) {
        flushParagraph();
        if (listType && listType !== "ul") flushList();
        listType = "ul";
        listItems.push(ul[1]);
        i += 1;
        continue;
      }
      if (ol) {
        flushParagraph();
        if (listType && listType !== "ol") flushList();
        listType = "ol";
        listItems.push(ol[2]);
        i += 1;
        continue;
      }
      if (quote) {
        flushParagraph();
        flushList();
        blocks.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
        i += 1;
        continue;
      }
      flushList();
      paragraph.push(line.trim());
      i += 1;
    }
    flushParagraph();
    flushList();
    return blocks.join("\n");
  }

  function inline(text) {
    let s = escapeHtml(text);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const safeHref = String(href).replace(/"/g, "");
      if (/^https?:\/\//i.test(safeHref)) {
        return `<a href="${safeHref}" target="_blank" rel="noopener">${label}</a>`;
      }
      return `<span class="ref">${label}</span>`;
    });
    s = s.replace(/\[\[([^\]]+)\]\]/g, "<strong>$1</strong>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  el.btnFit?.addEventListener("click", () => {
    const scroll = el.mapHost.querySelector(".mm-scroll");
    if (scroll) scroll.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  });

  window.addEventListener("hashchange", route);
  loadCatalog()
    .then(route)
    .catch((err) => {
      el.status.textContent = `載入失敗：${err.message}`;
    });
})();
