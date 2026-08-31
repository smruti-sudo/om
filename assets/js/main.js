(() => {
  "use strict";

  const html = document.documentElement;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Lenis smooth scroll
  --------------------------------------------------------- */
  let lenis = null;
  if (!prefersReducedMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -86, duration: 1.2 });
      else target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------------------------------------------------------
     Marquee — clone the single authored set until it's wide
     enough to loop seamlessly at any viewport width, keeping
     a constant px/sec speed instead of a fixed duration.
  --------------------------------------------------------- */
  function setupMarquee(track) {
    if (!track) return;
    const container = track.parentElement;
    const baseHTML = track.innerHTML;
    const PX_PER_SECOND = 55;
    const MAX_SETS = 16;

    function fill() {
      track.classList.remove("is-ready");
      track.style.animationDuration = "";
      track.innerHTML = baseHTML;

      const containerWidth = container.offsetWidth;
      let sets = 1;
      while (track.scrollWidth < containerWidth * 2 && sets < MAX_SETS) {
        track.insertAdjacentHTML("beforeend", baseHTML);
        sets++;
      }
      if (sets % 2 !== 0 && sets < MAX_SETS) {
        track.insertAdjacentHTML("beforeend", baseHTML);
        sets++;
      }

      const halfWidth = track.scrollWidth / 2;
      const duration = Math.max(14, halfWidth / PX_PER_SECOND);
      track.style.animationDuration = duration + "s";
      track.classList.add("is-ready");
    }

    fill();

    // Text is set in a condensed webfont; if it's still loading at the
    // first measurement, widths are based on the fallback font and can
    // under-fill once the real font swaps in. Re-measure once settled.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fill);
    }

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fill, 250);
    });
  }

  document.querySelectorAll(".marquee__track").forEach(setupMarquee);

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
    const targets = document.querySelectorAll(".reveal-mask, .reveal-up, .reveal-scale, .stack-card");
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

  // Same light parallax treatment on the Rental Cycle frame photo
  const cycleFrameImg = document.getElementById("cycleFrameImg");
  const cycleFrame = document.getElementById("cycleFrame");
  if (cycleFrameImg && cycleFrame && !prefersReducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const rect = cycleFrame.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const progress = Math.min(Math.max(-center / window.innerHeight, -0.5), 0.5);
        cycleFrameImg.style.transform = `translateY(${progress * 8}%) scale(1.06)`;
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------
     About lede — words brighten one by one as you scroll,
     dimming back if you scroll back up (scroll-scrubbed, not
     a one-shot reveal).
  --------------------------------------------------------- */
  const aboutLede = document.getElementById("aboutLede");
  const aboutWords = aboutLede ? Array.from(aboutLede.querySelectorAll(".word")) : [];
  if (aboutLede && aboutWords.length) {
    if (prefersReducedMotion) {
      aboutWords.forEach((word) => (word.style.opacity = 1));
    } else {
      let aboutTicking = false;
      function updateAboutLede() {
        aboutTicking = false;
        const rect = aboutLede.getBoundingClientRect();
        const start = window.innerHeight * 1.05;
        const end = window.innerHeight * 0.1;
        const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
        const n = aboutWords.length;
        aboutWords.forEach((word, i) => {
          const wordProgress = Math.min(Math.max(progress * n - i, 0), 1);
          word.style.opacity = 0.25 + 0.75 * wordProgress;
        });
      }
      window.addEventListener(
        "scroll",
        () => {
          if (!aboutTicking) {
            aboutTicking = true;
            requestAnimationFrame(updateAboutLede);
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", updateAboutLede);
      updateAboutLede();
    }
  }

  /* ---------------------------------------------------------
     Journey tabs + card stack (cards rise from below and
     stack on top of one another as the section is scrolled)
  --------------------------------------------------------- */
  const tabBtns = document.querySelectorAll(".tabs__btn");
  const tabsWrap = document.querySelector(".tabs");
  const stackSlots = document.querySelectorAll(".stack-card-slot");
  const stackPanels = document.querySelectorAll(".stack-card-slot .stack-card__panel");

  function setActiveTab(name) {
    tabBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
    requestAnimationFrame(movePill);
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = document.querySelector(`.stack-card-slot[data-panel="${btn.dataset.tab}"]`);
      if (slot) {
        if (lenis) lenis.scrollTo(slot, { offset: -70, duration: 1.1 });
        else slot.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      }
      setActiveTab(btn.dataset.tab);
    });
  });

  // animated pill background behind active tab
  let movePill = () => {};
  if (tabsWrap && tabBtns.length) {
    const pill = document.createElement("span");
    pill.className = "tabs__active-pill";
    pill.style.cssText =
      "position:absolute;top:6px;bottom:6px;border-radius:999px;background:var(--gold);transition:transform .45s cubic-bezier(.16,.84,.36,1), width .45s cubic-bezier(.16,.84,.36,1);z-index:0;";
    tabsWrap.insertBefore(pill, tabsWrap.firstChild);
    tabBtns.forEach((b) => (b.style.position = "relative"));

    movePill = function movePill() {
      const active = document.querySelector(".tabs__btn.is-active");
      if (!active) return;
      const wrapRect = tabsWrap.getBoundingClientRect();
      const btnRect = active.getBoundingClientRect();
      pill.style.width = btnRect.width + "px";
      pill.style.transform = `translateX(${btnRect.left - wrapRect.left}px)`;
    };
    window.addEventListener("resize", movePill);
    setTimeout(movePill, 60);
  }

  // as each card scrolls under the next one, ease it back and dim it
  // slightly so the stack reads as a real deck of cards; each card's
  // photo also gets the same light scroll parallax as the hero/cycle images
  if (stackSlots.length && stackPanels.length) {
    const STICKY_TOP = 164;
    const progress = new Array(stackSlots.length).fill(0);
    const eased = new Array(stackSlots.length).fill(0);
    let lastActive = "";

    function computeProgress() {
      const vh = window.innerHeight;
      for (let i = 0; i < stackSlots.length - 1; i++) {
        const nextRect = stackSlots[i + 1].getBoundingClientRect();
        const raw = (STICKY_TOP - nextRect.top + vh * 0.14) / (vh * 0.6);
        progress[i] = Math.min(Math.max(raw, 0), 1);
      }
      progress[stackSlots.length - 1] = 0;

      let activeIndex = 0;
      stackSlots.forEach((slot, i) => {
        if (slot.getBoundingClientRect().top <= STICKY_TOP + 40) activeIndex = i;
      });
      const activeName = stackSlots[activeIndex].dataset.panel;
      if (activeName !== lastActive) {
        lastActive = activeName;
        setActiveTab(activeName);
      }
    }

    function render() {
      stackPanels.forEach((panel, i) => {
        eased[i] += (progress[i] - eased[i]) * (prefersReducedMotion ? 1 : 0.18);
        const scale = 1 - eased[i] * 0.07;
        const ty = -eased[i] * 30;
        const dim = 1 - eased[i] * 0.35;
        panel.style.transform = `translateY(${ty}px) scale(${scale})`;
        panel.style.filter = `brightness(${dim})`;

        if (prefersReducedMotion) return;
        const img = panel.querySelector(".journey__media img");
        if (!img) return;
        const rect = img.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const imgProgress = Math.min(Math.max(-center / window.innerHeight, -0.5), 0.5);
        img.style.transform = `translateY(${imgProgress * 14}%) scale(1.1)`;
      });
    }

    function loop() {
      computeProgress();
      render();
      requestAnimationFrame(loop);
    }

    const isStacked = () => window.matchMedia("(min-width: 861px)").matches;
    let rafId = null;
    function startLoop() {
      if (rafId) return;
      rafId = requestAnimationFrame(loop);
    }
    function stopLoop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
      stackPanels.forEach((panel) => {
        panel.style.transform = "";
        panel.style.filter = "";
      });
    }
    function syncLoop() {
      if (isStacked()) startLoop();
      else stopLoop();
    }
    syncLoop();
    window.addEventListener("resize", syncLoop);
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
     Magnetic elements (buttons get a strong pull, nav/tabs a light one)
  --------------------------------------------------------- */
  function enableMagnetic(el, strengthX, strengthY) {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * strengthX}px, ${y * strengthY}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0,0)";
    });
  }

  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll(".btn").forEach((btn) => enableMagnetic(btn, 0.18, 0.35));
    document.querySelectorAll(".nav__links a").forEach((a) => enableMagnetic(a, 0.12, 0.22));
    document.querySelectorAll(".tabs__btn").forEach((b) => enableMagnetic(b, 0.1, 0.2));
  }

  /* ---------------------------------------------------------
     3D tilt on cards & images
  --------------------------------------------------------- */
  function enableTilt(el, max, scale) {
    el.style.transition = "transform .4s cubic-bezier(.16,.84,.36,1)";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -max;
      const ry = (px - 0.5) * max;
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
  }

  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll(".journey__media").forEach((el) => enableTilt(el, 9, 1.03));
    document.querySelectorAll(".phone").forEach((el) => enableTilt(el, 12, 1.02));
    document.querySelectorAll(".cycle__frame").forEach((el) => enableTilt(el, 5, 1.01));
  }

  /* ---------------------------------------------------------
     Cursor labels ("View" on image cards etc.)
  --------------------------------------------------------- */
  if (hasFinePointer && !prefersReducedMotion) {
    const cursorEl = document.getElementById("cursor");
    const cursorLabel = document.getElementById("cursorLabel");
    document.querySelectorAll("[data-cursor-label]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (!cursorEl || !cursorLabel) return;
        cursorLabel.textContent = el.dataset.cursorLabel;
        cursorEl.classList.add("has-label");
      });
      el.addEventListener("mouseleave", () => {
        if (!cursorEl || !cursorLabel) return;
        cursorEl.classList.remove("has-label");
      });
    });
  }

  /* ---------------------------------------------------------
     Phone mockup — self-playing live-app-UI loop
  --------------------------------------------------------- */
  const phoneEl = document.querySelector(".experience__phone");
  const appCardBtn = document.querySelector(".app-card__btn");
  let phoneLoopTimer = null;

  function playPhoneLoop() {
    if (!appCardBtn) return;
    appCardBtn.textContent = "Paid ✓";
    appCardBtn.classList.add("is-success");
    phoneLoopTimer = setTimeout(() => {
      appCardBtn.textContent = "Pay Now";
      appCardBtn.classList.remove("is-success");
      phoneLoopTimer = setTimeout(playPhoneLoop, 3200);
    }, 1900);
  }

  function stopPhoneLoop() {
    clearTimeout(phoneLoopTimer);
  }

  if (phoneEl && appCardBtn && !prefersReducedMotion) {
    if ("IntersectionObserver" in window) {
      const phoneIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              stopPhoneLoop();
              phoneLoopTimer = setTimeout(playPhoneLoop, 2400);
            } else {
              stopPhoneLoop();
            }
          });
        },
        { threshold: 0.5 }
      );
      phoneIO.observe(phoneEl);
    } else {
      setTimeout(playPhoneLoop, 2400);
    }
  }
})();
