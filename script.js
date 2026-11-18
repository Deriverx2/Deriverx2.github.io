/**
 * E B Benson — Research Monograph
 * Edition Switcher (Washi Paper / Sumi Ink), Technical Drawers, & Domain Filters
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Edition Controller (Washi Paper / Sumi Ink)
     ------------------------------------------------------------------------ */
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");
  const editionLabel = document.getElementById("edition-label");

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
})();
