(() => {
  "use strict";

  const html = document.documentElement;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Preloader
  --------------------------------------------------------- */
  const preloader = document.getElementById("preloader");
  const preloaderBar = preloader ? preloader.querySelector(".preloader__bar span") : null;

  window.addEventListener("load", () => {
    if (preloaderBar) preloaderBar.style.width = "100%";
    setTimeout(() => {
      if (preloader) preloader.classList.add("is-done");
      document.body.classList.remove("no-scroll");
      initReveals();
    }, 420);
  });
  document.body.classList.add("no-scroll");
  // safety fallback in case 'load' never fires quickly (cached assets etc.)
  setTimeout(() => {
    if (preloader && !preloader.classList.contains("is-done")) {
      if (preloaderBar) preloaderBar.style.width = "100%";
      preloader.classList.add("is-done");
      document.body.classList.remove("no-scroll");
      initReveals();
    }
  }, 2200);

  /* ---------------------------------------------------------
     Custom cursor
  --------------------------------------------------------- */
  if (hasFinePointer && !prefersReducedMotion) {
    const cursor = document.getElementById("cursor");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
    });

    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (cursor) cursor.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(tick);
    }
    tick();

    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("[data-cursor='link'], a, button")) {
        cursor && cursor.classList.add("is-link");
      }
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-cursor='link'], a, button")) {
        cursor && cursor.classList.remove("is-link");
      }
    });
  }

  /* ---------------------------------------------------------
     Nav scroll state
  --------------------------------------------------------- */
  const nav = document.getElementById("nav");
  function onScrollNav() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ---------------------------------------------------------
     Burger / fullscreen menu
  --------------------------------------------------------- */
  const burger = document.getElementById("burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".menu-overlay__links a").forEach((a) => {
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal (IntersectionObserver)
  --------------------------------------------------------- */
  function initReveals() {
    const targets = document.querySelectorAll(".reveal-mask, .reveal-up, .reveal-scale");
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      targets.forEach((t) => t.classList.add("is-inview"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ---------------------------------------------------------
     Hero parallax
  --------------------------------------------------------- */
  const heroImg = document.getElementById("heroImg");
  const hero = document.getElementById("hero");
  if (heroImg && hero && !prefersReducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const progress = Math.min(Math.max(-rect.top / (rect.height || 1), 0), 1);
        heroImg.style.transform = `translateY(${progress * 12}%) scale(1.02)`;
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------
     Journey tabs
  --------------------------------------------------------- */
  const tabBtns = document.querySelectorAll(".tabs__btn");
  const panels = document.querySelectorAll(".journey__panel");
  const tabsWrap = document.querySelector(".tabs");

  function activateTab(name) {
    tabBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // animated pill background behind active tab
  if (tabsWrap && tabBtns.length) {
    const pill = document.createElement("span");
    pill.className = "tabs__active-pill";
    pill.style.cssText =
      "position:absolute;top:6px;bottom:6px;border-radius:999px;background:var(--gold);transition:transform .45s cubic-bezier(.16,.84,.36,1), width .45s cubic-bezier(.16,.84,.36,1);z-index:0;";
    tabsWrap.style.position = "relative";
    tabsWrap.insertBefore(pill, tabsWrap.firstChild);
    tabBtns.forEach((b) => (b.style.position = "relative"));

    function movePill() {
      const active = document.querySelector(".tabs__btn.is-active");
      if (!active) return;
      const wrapRect = tabsWrap.getBoundingClientRect();
      const btnRect = active.getBoundingClientRect();
      pill.style.width = btnRect.width + "px";
      pill.style.transform = `translateX(${btnRect.left - wrapRect.left}px)`;
    }
    tabBtns.forEach((btn) => btn.addEventListener("click", () => requestAnimationFrame(movePill)));
    window.addEventListener("resize", movePill);
    setTimeout(movePill, 60);
  }

  /* ---------------------------------------------------------
     FAQ accordion
  --------------------------------------------------------- */
  const accordionItems = document.querySelectorAll(".accordion__item");
  function setPanelHeight(item, open) {
    const panel = item.querySelector(".accordion__panel");
    if (!panel) return;
    if (open) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    } else {
      panel.style.maxHeight = "0px";
    }
  }
  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".accordion__trigger");
    if (item.classList.contains("is-active")) setPanelHeight(item, true);
    trigger.addEventListener("click", () => {
      const isActive = item.classList.contains("is-active");
      accordionItems.forEach((other) => {
        other.classList.remove("is-active");
        setPanelHeight(other, false);
      });
      if (!isActive) {
        item.classList.add("is-active");
        setPanelHeight(item, true);
      }
    });
  });
  window.addEventListener("resize", () => {
    accordionItems.forEach((item) => {
      if (item.classList.contains("is-active")) setPanelHeight(item, true);
    });
  });

  /* ---------------------------------------------------------
     Experience progress ring — animate when in view
  --------------------------------------------------------- */
  const ring = document.getElementById("progressRing");
  const num = document.getElementById("progressNum");
  if (ring && num) {
    const CIRC = 2 * Math.PI * 52;
    const target = 68;
    let animated = false;

    function animateRing() {
      if (animated) return;
      animated = true;
      const start = performance.now();
      const duration = 1400;
      function frame(t) {
        const p = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = Math.round(eased * target);
        num.textContent = value;
        ring.style.strokeDashoffset = CIRC - eased * (target / 100) * CIRC;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if ("IntersectionObserver" in window) {
      const ringIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              animateRing();
              ringIO.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      ringIO.observe(ring);
    } else {
      animateRing();
    }
  }

  /* ---------------------------------------------------------
     Magnetic buttons
  --------------------------------------------------------- */
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0,0)";
      });
    });
  }
})();
