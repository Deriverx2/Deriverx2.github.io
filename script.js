/**
 * E B Benson — Research Monograph
 * Edition Switcher (Washi Paper / Sumi Ink), Technical Drawers, & In Silico Regulatory Plate
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Edition Controller (Washi Paper / Sumi Ink)
     ------------------------------------------------------------------------ */
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");
  const editionLabel = document.getElementById("edition-label");
  let onThemeChangeCanvas = null;

  function getTheme() {
    return root.getAttribute("data-theme") === "sumi" ? "sumi" : "paper";
  }

  function syncEditionLabel() {
    if (!editionLabel) return;
    editionLabel.textContent = getTheme() === "paper" ? "SUMI INK" : "WASHI PAPER";
  }

  syncEditionLabel();

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      const next = getTheme() === "paper" ? "sumi" : "paper";
      root.setAttribute("data-theme", next);
      syncEditionLabel();
      try {
        localStorage.setItem("monograph-theme", next);
      } catch (e) {}
      if (typeof onThemeChangeCanvas === "function") {
        onThemeChangeCanvas();
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Copy Correspondence & BibTeX Records
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
        copyEmailLabel.textContent = "COPIED";
        clearTimeout(emailTimer);
        emailTimer = setTimeout(function () {
          copyEmailLabel.textContent = "COPY";
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
        btn.textContent = "COPIED";
        clearTimeout(bibTimer);
        bibTimer = setTimeout(function () {
          btn.textContent = "COPY";
        }, 1800);
      });
    });
  });

  /* ------------------------------------------------------------------------
     3. Editorial Drawers (Abstract / BibTeX)
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
     4. Selected Works Catalogue Filter
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
     5. Section Index Scroll-Spy
     ------------------------------------------------------------------------ */
  const navLinks = document.querySelectorAll(".index-link");
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
      { rootMargin: "-22% 0px -65% 0px", threshold: 0 }
    );

    sections.forEach(function (sec) {
      spyObserver.observe(sec);
    });
  }

  /* ------------------------------------------------------------------------
     6. FIG. 01 — In Silico Regulatory Manifold (Technical Drafting Canvas)
     ------------------------------------------------------------------------ */
  const canvas = document.getElementById("neural-cell-canvas");
  const readout = document.getElementById("sim-readout");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NODE_COUNT = 26;
  const CONNECT_DIST = 104;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let isVisible = true;
  let nodes = [];
  let pulses = [];
  let pointer = { x: -9999, y: -9999, active: false };

  const LABELS = [
    "SOX2", "OCT4", "NANOG", "KLF4", "MYC", "GATA4", "PAX6", "STAT3",
    "z_01", "z_02", "attn_q", "attn_k", "h_cell", "grn_1", "rna_vel",
    "epigen", "t_diff", "lora_A", "lora_B", "v_cell", "scRNA", "atac",
    "agent_0", "ctx_emb", "prior", "latent"
  ];

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const isHub = i % 5 === 0;
      nodes.push({
        x: 32 + Math.random() * Math.max(width - 64, 140),
        y: 28 + Math.random() * Math.max(height - 56, 120),
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: isHub ? 3.4 : 2.3,
        hub: isHub,
        energy: isHub ? 0.35 : 0.05,
        label: LABELS[i % LABELS.length]
      });
    }
  }

  function resize() {
    const stage = canvas.parentElement || canvas;
    width = Math.max(stage.clientWidth, 220);
    height = Math.max(stage.clientHeight, 200);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (nodes.length === 0) {
      initNodes();
    } else {
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].x = Math.max(18, Math.min(width - 18, nodes[i].x));
        nodes[i].y = Math.max(18, Math.min(height - 18, nodes[i].y));
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

  function spawnPerturbation(originIdx) {
    const src = nodes[originIdx];
    if (!src) return;
    src.energy = 1.0;

    for (let j = 0; j < nodes.length; j++) {
      if (j === originIdx) continue;
      const dst = nodes[j];
      const dist = Math.hypot(dst.x - src.x, dst.y - src.y);
      if (dist < CONNECT_DIST && pulses.length < 40) {
        pulses.push({
          from: originIdx,
          to: j,
          t: 0,
          speed: 0.02 + Math.random() * 0.016
        });
      }
    }
  }

  canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;

    const nearest = findNearestNode(pointer.x, pointer.y, 78);
    if (readout) {
      if (nearest !== -1) {
        readout.textContent = "PERTURB [" + nodes[nearest].label + "] · ΔSTATE";
      } else {
        readout.textContent = "26 LOCI · SCANNING";
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
      readout.textContent = "26 LOCI · EQUILIBRIUM";
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
        readout.textContent = "CASCADE [" + nodes[nearest].label + "] · FIRED";
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
    const sumi = getTheme() === "sumi";
    return sumi
      ? {
          ink: [237, 232, 221],
          vermilion: [226, 82, 61],
          label: "#ede8dd",
          contour: "rgba(237, 232, 221, 0.07)"
        }
      : {
          ink: [20, 20, 19],
          vermilion: [200, 62, 43],
          label: "#141413",
          contour: "rgba(20, 20, 19, 0.07)"
        };
  }

  let frameCount = 0;

  function drawFrame() {
    if (!isVisible && !reducedMotion) return;
    ctx.clearRect(0, 0, width, height);
    const pal = getPalette();

    frameCount++;
    if (!reducedMotion && frameCount % 95 === 0) {
      spawnPerturbation(Math.floor(Math.random() * nodes.length));
    }

    const hoveredIdx = pointer.active ? findNearestNode(pointer.x, pointer.y, 78) : -1;

    // Subtle scientific manifold contour rings
    ctx.strokeStyle = pal.contour;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.34, height * 0.35, -0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.19, height * 0.2, -0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!reducedMotion) {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 22 || n.x > width - 22) n.vx *= -1;
        if (n.y < 20 || n.y > height - 20) n.vy *= -1;
        n.x = Math.max(18, Math.min(width - 18, n.x));
        n.y = Math.max(18, Math.min(height - 18, n.y));
      }

      n.energy = Math.max(n.hub ? 0.18 : 0, n.energy * 0.968);

      if (pointer.active) {
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < 78) {
          n.energy = Math.min(1, n.energy + 0.08);
        }
      }
    }

    if (hoveredIdx !== -1 && frameCount % 20 === 0 && !reducedMotion) {
      spawnPerturbation(hoveredIdx);
    }

    // Draw regulatory couplings
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < CONNECT_DIST) {
          const proximity = 1 - dist / CONNECT_DIST;
          const activeStrength = (a.energy + b.energy) * 0.5;
          if (activeStrength > 0.42) {
            ctx.strokeStyle =
              "rgba(" +
              pal.vermilion[0] +
              "," +
              pal.vermilion[1] +
              "," +
              pal.vermilion[2] +
              "," +
              Math.min(0.65, proximity * 0.35 + activeStrength * 0.35).toFixed(3) +
              ")";
          } else {
            ctx.strokeStyle =
              "rgba(" +
              pal.ink[0] +
              "," +
              pal.ink[1] +
              "," +
              pal.ink[2] +
              "," +
              Math.min(0.36, proximity * 0.24).toFixed(3) +
              ")";
          }
          ctx.lineWidth = activeStrength > 0.5 ? 1.15 : 0.85;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Update & draw vermilion perturbation packets
    for (let p = pulses.length - 1; p >= 0; p--) {
      const pulse = pulses[p];
      pulse.t += pulse.speed;
      const a = nodes[pulse.from];
      const b = nodes[pulse.to];
      if (!a || !b || pulse.t >= 1) {
        if (b) b.energy = Math.min(1, b.energy + 0.48);
        pulses.splice(p, 1);
        continue;
      }
      const px = a.x + (b.x - a.x) * pulse.t;
      const py = a.y + (b.y - a.y) * pulse.t;
      ctx.fillStyle =
        "rgba(" +
        pal.vermilion[0] +
        "," +
        pal.vermilion[1] +
        "," +
        pal.vermilion[2] +
        ",0.95)";
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw loci & technical reticles
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isHovered = i === hoveredIdx;
      const isExcited = n.energy > 0.32 || isHovered;
      const rgb = isExcited ? pal.vermilion : pal.ink;
      const radius = n.r + n.energy * 1.4 + (isHovered ? 1.4 : 0);

      if (isExcited) {
        ctx.strokeStyle =
          "rgba(" +
          pal.vermilion[0] +
          "," +
          pal.vermilion[1] +
          "," +
          pal.vermilion[2] +
          "," +
          (0.28 + n.energy * 0.35).toFixed(3) +
          ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle =
        "rgba(" +
        rgb[0] +
        "," +
        rgb[1] +
        "," +
        rgb[2] +
        "," +
        (isExcited ? 0.95 : 0.72).toFixed(3) +
        ")";
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHovered || (n.hub && n.energy > 0.55)) {
        ctx.font = '500 10.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = pal.label;
        const labelX = n.x + 9 > width - 58 ? n.x - 50 : n.x + 9;
        const labelY = n.y - 8 < 16 ? n.y + 15 : n.y - 7;
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
