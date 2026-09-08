/* Knowledge Browser — built-in radial/horizontal mindmap + readable notes */
(() => {
  const state = {
    catalog: null,
    topic: null,
    meta: null,
    activeNote: null,
    tree: null,
    mapZoom: "fit",
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
    // Re-apply fit after layout settles; keep map scrolled to origin.
    requestAnimationFrame(() => applyMindmapZoom(state.mapZoom || "fit"));
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
    // Horizontal mind map: word-aware wrap, branch tints, 1:1 scroll (no shrink clipping).
    const pad = 36;
    const rankGapX = 236;
    const nodeGapY = 12;
    const padY = 10;
    const padX = 16;

    const BRANCHES = [
      { stroke: "#0f5c4c", fill: "#cfe8e0", soft: "#e5f3ee", ink: "#0a3d34" },
      { stroke: "#1a5f7a", fill: "#cde4ef", soft: "#e4f0f6", ink: "#0f3f52" },
      { stroke: "#8a5a1a", fill: "#eed9b8", soft: "#f5ebda", ink: "#5c3b0e" },
      { stroke: "#5c3d7a", fill: "#ddd0eb", soft: "#eee6f5", ink: "#3c2852" },
      { stroke: "#1f6b4a", fill: "#c8e6d7", soft: "#e3f2ea", ink: "#134632" },
      { stroke: "#7a3d4a", fill: "#e9cfd5", soft: "#f4e8eb", ink: "#522029" },
    ];

    function nodeWidth(depth) {
      if (depth === 0) return 196;
      if (depth === 1) return 168;
      return 200;
    }

    const measureCtx = (() => {
      const c = document.createElement("canvas");
      return c.getContext("2d");
    })();

    function fontFor(depth) {
      if (depth === 0) return '700 14px "Noto Sans TC", "PingFang TC", sans-serif';
      if (depth === 1) return '700 13px "Noto Sans TC", "PingFang TC", sans-serif';
      return '500 12px "Noto Sans TC", "PingFang TC", sans-serif';
    }

    function textWidth(str, depth) {
      measureCtx.font = fontFor(depth);
      return measureCtx.measureText(str).width;
    }

    function tokenize(s) {
      const tokens = [];
      let ascii = "";
      const flush = () => {
        if (ascii) {
          tokens.push(ascii);
          ascii = "";
        }
      };
      for (const ch of s) {
        if (ch === " " || ch === "/" || ch === "·" || ch === "｜" || ch === "|" || ch === "／") {
          flush();
          tokens.push(ch);
        } else if (/[A-Za-z0-9._+-]/.test(ch)) {
          ascii += ch;
        } else {
          flush();
          tokens.push(ch);
        }
      }
      flush();
      return tokens;
    }

    function wrapLines(text, depth) {
      const raw = String(text || "").trim() || "—";
      const maxW = nodeWidth(depth) - padX * 2 - (depth === 1 ? 8 : 0) - 4;
      const tokens = tokenize(raw);
      const lines = [];
      let cur = "";

      const pushLine = () => {
        if (cur.trim()) lines.push(cur.trim());
        cur = "";
      };

      for (const tok of tokens) {
        const trial = cur + tok;
        if (cur && textWidth(trial, depth) > maxW) {
          pushLine();
          // Hard-split overlong ASCII token
          if (textWidth(tok, depth) > maxW && /^[A-Za-z0-9._+-]+$/.test(tok)) {
            let rest = tok;
            while (rest) {
              let lo = 1;
              let hi = rest.length;
              while (lo < hi) {
                const mid = Math.ceil((lo + hi) / 2);
                if (textWidth(rest.slice(0, mid), depth) <= maxW) lo = mid;
                else hi = mid - 1;
              }
              lines.push(rest.slice(0, lo));
              rest = rest.slice(lo);
            }
            continue;
          }
        }
        cur += tok;
      }
      pushLine();
      if (lines.length > 3) {
        const kept = lines.slice(0, 3);
        kept[2] = `${kept[2].replace(/…$/, "")}…`;
        return kept;
      }
      return lines.length ? lines : ["—"];
    }

    function measure(n, depth) {
      n._depth = depth;
      n._lines = wrapLines(n.text, depth);
      n._w = nodeWidth(depth);
      const lineH = depth === 0 ? 18 : depth === 1 ? 17 : 16;
      const minH = depth === 0 ? 52 : depth === 1 ? 44 : 40;
      // Extra 4px buffer so foreignObject descenders / subpixel never clip.
      n._h = Math.max(minH, n._lines.length * lineH + padY * 2 + 4);
      if (n.children?.length) {
        n.children = n.children.filter((c) => String(c.text || "").trim());
        n.children.forEach((c) => measure(c, depth + 1));
      }
    }
    measure(tree, 0);

    const positions = new Map();
    let cursorY = pad;

    function layout(n, depth) {
      if (!n.children?.length) {
        positions.set(n, { x: pad + depth * rankGapX, y: cursorY, depth });
        cursorY += n._h + nodeGapY;
        return;
      }
      n.children.forEach((c) => layout(c, depth + 1));
      const yMid =
        (positions.get(n.children[0]).y +
          n.children[0]._h / 2 +
          positions.get(n.children[n.children.length - 1]).y +
          n.children[n.children.length - 1]._h / 2) /
          2 -
        n._h / 2;
      positions.set(n, { x: pad + depth * rankGapX, y: Math.max(pad, yMid), depth });
    }

    layout(tree, 0);

    let maxX = 0;
    let maxY = 0;
    for (const [n, p] of positions) {
      maxX = Math.max(maxX, p.x + n._w);
      maxY = Math.max(maxY, p.y + n._h);
    }
    const width = maxX + pad + 48;
    const height = maxY + pad + 28;

    const branchOf = new Map();
    function assignBranch(n, branchIdx) {
      branchOf.set(n, branchIdx);
      (n.children || []).forEach((c) => assignBranch(c, branchIdx));
    }
    (tree.children || []).forEach((c, i) => assignBranch(c, i % BRANCHES.length));
    branchOf.set(tree, 0);

    const edges = [];
    const joints = [];
    function walkEdges(n) {
      const a = positions.get(n);
      for (const c of n.children || []) {
        const b = positions.get(c);
        if (a && b) {
          const pal = BRANCHES[branchOf.get(c) ?? 0];
          const x1 = a.x + n._w;
          const y1 = a.y + n._h / 2;
          const x2 = b.x;
          const y2 = b.y + c._h / 2;
          const mx = (x1 + x2) / 2;
          edges.push(
            `<path class="mm-edge" stroke="${pal.stroke}" d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" />`
          );
          joints.push(
            `<circle class="mm-joint" cx="${x2}" cy="${y2}" r="3.2" fill="${pal.stroke}" />`
          );
        }
        walkEdges(c);
      }
    }
    walkEdges(tree);

    const nodes = [];
    function walkNodes(n) {
      const p = positions.get(n);
      if (!p) return;
      const depth = p.depth;
      const pal = BRANCHES[branchOf.get(n) ?? 0];
      const note = depth === 1 ? matchNote(n.text) : null;
      const softNote = depth > 1 ? matchNote(n.text) : null;
      const clickable = note || softNote ? `mm-clickable${softNote && !note ? " mm-soft" : ""}` : "";
      const isRoot = depth === 0;
      const isBranch = depth === 1;
      const kind = isRoot ? "root" : isBranch ? "branch" : "leaf";
      const rx = isRoot ? 16 : isBranch ? 12 : 10;
      const fill = isRoot ? pal.stroke : isBranch ? pal.fill : pal.soft;
      const strokeW = isRoot ? 0 : isBranch ? 2 : 1.25;
      const labelPadX = isBranch ? padX + 6 : padX;
      const linesHtml = n._lines.map((ln) => `<div class="mm-line">${escapeHtml(ln)}</div>`).join("");
      // Badge lives in SVG (not foreignObject) so it never steals label height / clips title.
      const badge = note
        ? `<g class="mm-badge-g" transform="translate(${n._w - 38}, -9)">
            <rect width="44" height="18" rx="9" fill="${pal.stroke}" />
            <text x="22" y="12.5" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Noto Sans TC, sans-serif">筆記</text>
          </g>`
        : "";

      nodes.push(`
        <g class="mm-node ${kind} ${clickable}" data-text="${escapeAttr(n.text)}" transform="translate(${p.x},${p.y})">
          <rect class="mm-shadow" x="2" y="3" width="${n._w}" height="${n._h}" rx="${rx}" />
          <rect class="mm-card" width="${n._w}" height="${n._h}" rx="${rx}"
            fill="${fill}" stroke="${pal.stroke}" stroke-width="${strokeW}" />
          ${isBranch ? `<rect x="0" y="0" width="5" height="${n._h}" rx="2.5" fill="${pal.stroke}" />` : ""}
          ${badge}
          <foreignObject x="0" y="0" width="${n._w}" height="${n._h}">
            <div xmlns="http://www.w3.org/1999/xhtml" class="mm-label ${kind}"
              style="width:${n._w}px;height:${n._h}px;padding:${padY}px ${labelPadX}px;box-sizing:border-box;${isRoot ? "" : `color:${pal.ink}`}">
              <div class="mm-lines">${linesHtml}</div>
            </div>
          </foreignObject>
        </g>
      `);
      (n.children || []).forEach(walkNodes);
    }
    walkNodes(tree);

    el.mapHost.innerHTML = `
      <div class="mm-scroll">
        <svg class="mm-svg" data-nat-w="${width}" data-nat-h="${height}"
          width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
          preserveAspectRatio="xMinYMin meet" role="img" aria-label="心智圖">
          <defs>
            <pattern id="mm-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.1" fill="#cfc4b4" opacity="0.45" />
            </pattern>
            <linearGradient id="mm-wash" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fffdf8" />
              <stop offset="100%" stop-color="#f0ebe1" />
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#mm-wash)" />
          <rect width="${width}" height="${height}" fill="url(#mm-grid)" />
          ${edges.join("")}
          ${joints.join("")}
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

    // Default: fit whole tree into the panel (uniform scale — no text clipping).
    requestAnimationFrame(() => applyMindmapZoom("fit"));
  }

  function applyMindmapZoom(mode) {
    const scroll = el.mapHost?.querySelector(".mm-scroll");
    const svg = el.mapHost?.querySelector(".mm-svg");
    if (!scroll || !svg) return;
    const natW = Number(svg.dataset.natW) || svg.viewBox.baseVal.width;
    const natH = Number(svg.dataset.natH) || svg.viewBox.baseVal.height;
    state.mapZoom = mode === "actual" ? "actual" : "fit";
    if (state.mapZoom === "actual") {
      svg.setAttribute("width", String(Math.round(natW)));
      svg.setAttribute("height", String(Math.round(natH)));
    } else {
      // Prefer filling panel width (readable); allow vertical scroll instead of shrinking to a postage stamp.
      const aw = Math.max(120, scroll.clientWidth - 16);
      const ah = Math.max(120, scroll.clientHeight - 16);
      let s = Math.min(1, aw / natW) * 0.98;
      // Cap so height is at most ~2.4× viewport (still scrollable, not endless).
      const maxH = ah * 2.4;
      if (natH * s > maxH) s = maxH / natH;
      const dw = Math.round(natW * s);
      const dh = Math.round(natH * s);
      svg.setAttribute("width", String(dw));
      svg.setAttribute("height", String(dh));
    }
    scroll.scrollTo({ left: 0, top: 0 });
    // Root is vertically centered in the tree — scroll so it stays in view (not stuck at y=0 top leaves only).
    const root = el.mapHost.querySelector(".mm-node.root");
    if (root) {
      const sRect = scroll.getBoundingClientRect();
      const rRect = root.getBoundingClientRect();
      const deltaY = rRect.top + rRect.height / 2 - (sRect.top + sRect.height / 2);
      scroll.scrollTop = Math.max(0, scroll.scrollTop + deltaY);
    }
    if (el.btnFit) {
      el.btnFit.textContent = state.mapZoom === "fit" ? "實際大小" : "符合視窗";
    }
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
    applyMindmapZoom(state.mapZoom === "fit" ? "actual" : "fit");
  });

  window.addEventListener("resize", () => {
    if (state.tree && state.mapZoom === "fit") applyMindmapZoom("fit");
  });

  window.addEventListener("hashchange", route);
  loadCatalog()
    .then(route)
    .catch((err) => {
      el.status.textContent = `載入失敗：${err.message}`;
    });
})();
