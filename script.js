/**
 * E B Benson — Research & AI Personal Website
 * Interactive Latent Regulatory Graph, Theme Controller, & UI Interactions
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Theme Controller (Dark / Light)
     ------------------------------------------------------------------------ */
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");

  function getTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  let onThemeChangeCanvas = null;

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      const next = getTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      if (typeof onThemeChangeCanvas === "function") {
        onThemeChangeCanvas();
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Copy Email & Copy BibTeX
     ------------------------------------------------------------------------ */
  const copyEmailBtn = document.getElementById("copy-email-btn");
  const copyEmailLabel = document.getElementById("copy-email-label");

  function copyText(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(function () {
        fallbackCopy(text, onDone);
      });
    } else {
      fallbackCopy(text, onDone);
    }
  }

  function fallbackCopy(text, onDone) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      onDone();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  if (copyEmailBtn && copyEmailLabel) {
    let emailTimer = null;
    copyEmailBtn.addEventListener("click", function () {
      const email = copyEmailBtn.getAttribute("data-email") || "";
      copyText(email, function () {
        copyEmailLabel.textContent = "Copied!";
        clearTimeout(emailTimer);
        emailTimer = setTimeout(function () {
          copyEmailLabel.textContent = "Copy";
        }, 1800);
      });
    });
  }

  document.querySelectorAll(".copy-bib-btn").forEach(function (btn) {
    let bibTimer = null;
    btn.addEventListener("click", function () {
      const targetId = btn.getAttribute("data-copy-target");
      const pre = targetId ? document.getElementById(targetId) : null;
      if (!pre) return;
      copyText(pre.textContent.trim(), function () {
        btn.textContent = "Copied!";
        clearTimeout(bibTimer);
        bibTimer = setTimeout(function () {
          btn.textContent = "Copy";
        }, 1800);
      });
    });
  });

  /* ------------------------------------------------------------------------
     3. Publication Drawers (Abstract / BibTeX)
     ------------------------------------------------------------------------ */
  document.querySelectorAll(".toggle-drawer-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetId = btn.getAttribute("data-target");
      const drawer = targetId ? document.getElementById(targetId) : null;
      if (!drawer) return;

      const isOpen = !drawer.hasAttribute("hidden");
      if (isOpen) {
        drawer.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
      } else {
        drawer.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ------------------------------------------------------------------------
     4. Project Domain Filter
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const filter = btn.getAttribute("data-filter") || "all";

      filterBtns.forEach(function (b) {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });

      projectCards.forEach(function (card) {
        const cat = card.getAttribute("data-category");
        if (filter === "all" || cat === filter) {
          card.removeAttribute("hidden");
        } else {
          card.setAttribute("hidden", "");
        }
      });
    });
  });

  /* ------------------------------------------------------------------------
     5. Active Navigation Scroll-Spy
     ------------------------------------------------------------------------ */
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = Array.from(navLinks)
    .map(function (link) {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length > 0) {
    const spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            navLinks.forEach(function (link) {
              link.classList.toggle("active", link.getAttribute("href") === id);
            });
          }
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );

    sections.forEach(function (sec) {
      spyObserver.observe(sec);
    });
  }

  /* ------------------------------------------------------------------------
     6. Interactive Latent Regulatory / Neural Graph Canvas
     ------------------------------------------------------------------------ */
  const canvas = document.getElementById("neural-cell-canvas");
  const readout = document.getElementById("sim-readout");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NODE_COUNT = 26;
  const CONNECT_DIST = 98;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let isVisible = true;
  let nodes = [];
  let pulses = [];
  let pointer = { x: -9999, y: -9999, active: false };

  // Subtle biological / AI node labels shown on closest hovered node
  const LABELS = [
    "SOX2", "OCT4", "NANOG", "KLF4", "MYC", "GATA4", "PAX6", "STAT3",
    "z_01", "z_02", "attn_q", "attn_k", "h_cell", "grn_1", "rna_vel",
    "epigen", "t_diff", "lora_A", "lora_B", "v_cell", "scRNA", "atac",
    "agent_0", "ctx_emb", "prior", "latent"
  ];

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const isBio = i % 2 === 0;
      nodes.push({
        x: 28 + Math.random() * Math.max(width - 56, 120),
        y: 26 + Math.random() * Math.max(height - 52, 100),
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        r: isBio ? 3.2 : 2.7,
        type: isBio ? "bio" : "ai",
        energy: Math.random() * 0.35,
        label: LABELS[i % LABELS.length]
      });
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(rect.width, 240);
    height = Math.max(rect.height, 200);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (nodes.length === 0) {
      initNodes();
    }
  }

  function spawnPerturbation(originIdx) {
    const src = nodes[originIdx];
    if (!src) return;
    src.energy = 1.0;

    for (let j = 0; j < nodes.length; j++) {
      if (j === originIdx) continue;
      const dst = nodes[j];
      const dx = dst.x - src.x;
      const dy = dst.y - src.y;
      const dist = Math.hypot(dx, dy);
      if (dist < CONNECT_DIST && pulses.length < 36) {
        pulses.push({
          from: originIdx,
          to: j,
          t: 0,
          speed: 0.022 + Math.random() * 0.018,
          type: src.type
        });
      }
    }
  }

  function findNearestNode(cx, cy, maxRadius) {
    let nearest = -1;
    let bestDist = maxRadius;
    for (let i = 0; i < nodes.length; i++) {
      const d = Math.hypot(nodes[i].x - cx, nodes[i].y - cy);
      if (d < bestDist) {
        bestDist = d;
        nearest = i;
      }
    }
    return nearest;
  }

  canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;

    const nearest = findNearestNode(pointer.x, pointer.y, 76);
    if (readout) {
      if (nearest !== -1) {
        readout.textContent = "perturb(" + nodes[nearest].label + ") · Δstate";
      } else {
        readout.textContent = "nodes: " + NODE_COUNT + " · scanning";
      }
    }
    if (reducedMotion) {
      drawFrame();
    }
  });

  canvas.addEventListener("mouseleave", function () {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
    if (readout) {
      readout.textContent = "nodes: " + NODE_COUNT + " · active";
    }
    if (reducedMotion) {
      drawFrame();
    }
  });

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const nearest = findNearestNode(cx, cy, Infinity);
    if (nearest !== -1) {
      spawnPerturbation(nearest);
      if (readout) {
        readout.textContent = "pulse(" + nodes[nearest].label + ") · fired";
      }
      if (reducedMotion) {
        drawFrame();
      }
    }
  });

  if ("IntersectionObserver" in window) {
    const visObserver = new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
    });
    visObserver.observe(canvas);
  }

  function getPalette() {
    const light = getTheme() === "light";
    return light
      ? {
          ai: [2, 132, 199],
          bio: [13, 148, 136],
          edge: [71, 85, 105],
          label: "#0f172a",
          halo: "rgba(13, 148, 136, 0.14)"
        }
      : {
          ai: [56, 189, 248],
          bio: [45, 212, 191],
          edge: [148, 163, 184],
          label: "#edf2f8",
          halo: "rgba(45, 212, 191, 0.18)"
        };
  }

  let frameCount = 0;

  function drawFrame() {
    if (!isVisible && !reducedMotion) return;
    ctx.clearRect(0, 0, width, height);
    const pal = getPalette();

    // Occasional spontaneous regulatory firing
    frameCount++;
    if (!reducedMotion && frameCount % 85 === 0) {
      spawnPerturbation(Math.floor(Math.random() * nodes.length));
    }

    // Find hovered node
    const hoveredIdx = pointer.active ? findNearestNode(pointer.x, pointer.y, 76) : -1;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      if (!reducedMotion) {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 18 || n.x > width - 18) n.vx *= -1;
        if (n.y < 18 || n.y > height - 18) n.vy *= -1;
        n.x = Math.max(16, Math.min(width - 16, n.x));
        n.y = Math.max(16, Math.min(height - 16, n.y));
      }

      n.energy = Math.max(0, n.energy * 0.965);

      if (pointer.active) {
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < 76) {
          n.energy = Math.min(1, n.energy + 0.08);
        }
      }
    }

    if (hoveredIdx !== -1 && frameCount % 18 === 0 && !reducedMotion) {
      spawnPerturbation(hoveredIdx);
    }

    // Draw cell boundary halo in center
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      12,
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.46
    );
    grad.addColorStop(0, pal.halo);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw regulatory / latent edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < CONNECT_DIST) {
          const proximity = 1 - dist / CONNECT_DIST;
          const boost = (a.energy + b.energy) * 0.28;
          const alpha = Math.min(0.55, proximity * 0.24 + boost);
          ctx.strokeStyle =
            "rgba(" +
            pal.edge[0] +
            "," +
            pal.edge[1] +
            "," +
            pal.edge[2] +
            "," +
            alpha.toFixed(3) +
            ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Update & draw signal pulses
    for (let p = pulses.length - 1; p >= 0; p--) {
      const pulse = pulses[p];
      pulse.t += pulse.speed;
      const a = nodes[pulse.from];
      const b = nodes[pulse.to];
      if (!a || !b || pulse.t >= 1) {
        if (b) b.energy = Math.min(1, b.energy + 0.45);
        pulses.splice(p, 1);
        continue;
      }
      const px = a.x + (b.x - a.x) * pulse.t;
      const py = a.y + (b.y - a.y) * pulse.t;
      const rgb = pulse.type === "bio" ? pal.bio : pal.ai;
      ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.9)";
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const rgb = n.type === "bio" ? pal.bio : pal.ai;
      const isHovered = i === hoveredIdx;
      const radius = n.r + n.energy * 1.8 + (isHovered ? 1.6 : 0);

      if (n.energy > 0.15 || isHovered) {
        ctx.fillStyle =
          "rgba(" +
          rgb[0] +
          "," +
          rgb[1] +
          "," +
          rgb[2] +
          "," +
          (0.16 + n.energy * 0.22).toFixed(3) +
          ")";
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle =
        "rgba(" +
        rgb[0] +
        "," +
        rgb[1] +
        "," +
        rgb[2] +
        "," +
        (0.72 + n.energy * 0.28).toFixed(3) +
        ")";
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHovered) {
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillStyle = pal.label;
        const labelX = n.x + 8 > width - 62 ? n.x - 52 : n.x + 8;
        const labelY = n.y - 8 < 16 ? n.y + 16 : n.y - 7;
        ctx.fillText(n.label, labelX, labelY);
      }
    }
  }

  function render() {
    drawFrame();
    if (!reducedMotion) {
      requestAnimationFrame(render);
    }
  }

  onThemeChangeCanvas = drawFrame;

  resize();
  window.addEventListener("resize", function () {
    resize();
    if (reducedMotion) drawFrame();
  });
  render();
})();
