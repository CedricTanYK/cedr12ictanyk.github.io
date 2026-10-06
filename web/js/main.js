(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Intro curtain: opens after first paint, then unmounts itself
  var curtainDone = function () { root.classList.add("cur-open"); };
  if (reducedMotion) {
    root.classList.add("cur-done");
    curtainDone();
  } else {
    requestAnimationFrame(function () {
      requestAnimationFrame(curtainDone);
    });
    // rAF is paused in hidden pages — open anyway so content never stays masked
    setTimeout(curtainDone, 600);
    setTimeout(function () { root.classList.add("cur-done"); }, 1400);
  }

  // Hero canvas: slow drifting wave field behind the headline
  (function initHeroShader() {
    var canvas = document.getElementById("hero-shader");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = 0, h = 0, t = Math.random() * 100;
    var rafId = null, running = false, heroVisible = true;

    function palette() {
      return ["rgba(246,246,246,0.055)", "rgba(246,246,246,0.04)", "rgba(246,246,246,0.025)"];
    }
    var colors = palette();

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var layers = 14;
      for (var i = 0; i < layers; i++) {
        var p = i / (layers - 1);
        var yBase = h * (0.12 + 0.76 * p);
        var amp = 26 + 58 * Math.sin(t * 0.6 + i * 0.7);
        var freq = 1.5 + 0.8 * Math.sin(i * 1.3);
        ctx.beginPath();
        ctx.moveTo(-60, yBase);
        for (var x = -60; x <= w + 60; x += 16) {
          var y = yBase
            + Math.sin((x / w) * Math.PI * 2 * freq + t * (0.9 + 0.12 * i) + i * 0.55) * amp
            + Math.sin((x / w) * Math.PI * 2 * (freq * 0.5) - t * 0.7) * (amp * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function loop() {
      draw();
      t += 0.008;
      rafId = running ? requestAnimationFrame(loop) : null;
    }
    function start() {
      if (running || reducedMotion) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    window.addEventListener("resize", function () {
      resize();
      if (reducedMotion) draw();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else if (heroVisible) { start(); }
    });

    var hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) { start(); } else { stop(); }
      }, { threshold: 0 }).observe(hero);
    }

    resize();
    if (reducedMotion) { draw(); } else { start(); }
  })();

  // Stagger scroll reveals inside marked groups
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var items = group.querySelectorAll(".reveal");
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 80, 480) + "ms";
    });
  });

  // Nav background on scroll
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var burger = document.getElementById("nav-burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    var mobileLinks = document.querySelectorAll(".nav__mobile a");
    mobileLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
