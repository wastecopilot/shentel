/*
 * Shentel Authorized Retailer — static HTML runtime.
 * Vanilla port of the Next.js client components so the exported HTML behaves
 * identically: Lenis smooth scroll, scroll reveals, parallax, magnetic CTAs,
 * 3D card tilt, sticky header (shadow, active link, mobile menu), ZIP checker
 * and FAQ accordion. Requires assets/js/lenis.min.js (global `Lenis`).
 */
(function () {
  'use strict';

  // Sales line comes from the pre-rendered page (lib/content.ts → site.phone).
  var telLink = document.querySelector('a[href^="tel:"]');
  var PHONE_HREF = telLink ? telLink.getAttribute('href') : '#';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------ */
  /* Lenis smooth scroll                                                 */
  /* ------------------------------------------------------------------ */
  var lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({
      duration: 1.15,
      smoothWheel: true,
      easing: function (t) {
        return 1 - Math.pow(1 - t, 4);
      },
    });
    var loop = function (time) {
      lenis.raf(time);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ */
  /* In-page anchor links (offset for sticky header)                     */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var target = id.length > 1 ? document.querySelector(id) : null;
    if (!target) return;
    e.preventDefault();
    // The open mobile menu collapses as we scroll, so subtract its height up front.
    var menu = document.getElementById('mobile-nav');
    var menuH = menu && menu.classList.contains('grid-rows-[1fr]') ? menu.getBoundingClientRect().height : 0;
    var top = target.getBoundingClientRect().top + window.scrollY - 104 - menuH;
    if (lenis) lenis.scrollTo(top);
    else window.scrollTo({ top: top });
    history.replaceState(null, '', id);
    window.dispatchEvent(new CustomEvent('anchor-nav'));
  });

  // Arriving from another page with a #hash (e.g. legal page → index.html#tv)
  if (location.hash.length > 1) {
    var initial = document.querySelector(location.hash);
    if (initial) {
      window.addEventListener('load', function () {
        var top = initial.getBoundingClientRect().top + window.scrollY - 104;
        if (lenis) lenis.scrollTo(top, { immediate: true });
        else window.scrollTo(0, top);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveals                                                      */
  /* ------------------------------------------------------------------ */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.dataset.inview = 'true';
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 }
  );
  document.querySelectorAll('[data-observe]').forEach(function (el) {
    io.observe(el);
  });

  /* ------------------------------------------------------------------ */
  /* Parallax                                                            */
  /* ------------------------------------------------------------------ */
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (layers.length && !reduce) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var speed = parseFloat(el.dataset.parallax || '0.15');
        var host = el.parentElement || el;
        var r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var delta = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0, ' + delta.toFixed(1) + 'px, 0)';
      });
      ticking = false;
    };
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic CTAs + 3D tilt cards                                       */
  /* ------------------------------------------------------------------ */
  function bindMagnetic(el) {
    if (!finePointer || reduce || el.__magnetic) return;
    el.__magnetic = true;
    var strength = 0.28;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - (r.left + r.width / 2);
      var y = e.clientY - (r.top + r.height / 2);
      el.style.transform = 'translate3d(' + x * strength + 'px, ' + y * strength * 1.2 + 'px, 0)';
    });
    el.addEventListener('pointerleave', function () {
      el.style.transform = 'translate3d(0,0,0)';
    });
  }
  document.querySelectorAll('[data-magnetic]').forEach(bindMagnetic);

  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = 7;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Header: shadow on scroll, active section link, mobile menu          */
  /* ------------------------------------------------------------------ */
  var header = document.querySelector('header.sticky');
  if (header) {
    var bar = header.firstElementChild;
    var SHADOW = 'shadow-[0_8px_30px_-12px_rgba(0,52,99,0.25)]';
    var menuBtn = header.querySelector('button[aria-controls="mobile-nav"]');
    var mobileNav = document.getElementById('mobile-nav');
    var menuOpen = false;

    var syncShadow = function () {
      bar.classList.toggle(SHADOW, window.scrollY > 24 || menuOpen);
    };
    syncShadow();
    window.addEventListener('scroll', syncShadow, { passive: true });

    var setMenu = function (open) {
      menuOpen = open;
      if (!menuBtn || !mobileNav) return;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var lines = menuBtn.querySelectorAll('span > span');
      if (lines[0]) {
        lines[0].classList.toggle('top-1.5', open);
        lines[0].classList.toggle('rotate-45', open);
        lines[0].classList.toggle('top-0', !open);
      }
      if (lines[1]) {
        lines[1].classList.toggle('top-1.5', open);
        lines[1].classList.toggle('-rotate-45', open);
        lines[1].classList.toggle('top-3', !open);
      }
      mobileNav.classList.toggle('grid-rows-[1fr]', open);
      mobileNav.classList.toggle('grid-rows-[0fr]', !open);
      syncShadow();
    };
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        setMenu(!menuOpen);
      });
    }
    window.addEventListener('anchor-nav', function () {
      setMenu(false);
    });

    var links = Array.prototype.slice.call(header.querySelectorAll('nav[aria-label="Primary"] a'));
    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('text-orange', on);
        a.classList.toggle('text-navy', !on);
        a.classList.toggle('hover:text-orange', !on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
        var bar = a.querySelector('span');
        if (on && !bar) {
          bar = document.createElement('span');
          bar.className = 'absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-orange';
          a.insertBefore(bar, a.firstChild);
        } else if (!on && bar) {
          bar.remove();
        }
      });
    };
    var sectionIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    links.forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s) sectionIo.observe(s);
    });
  }

  /* ------------------------------------------------------------------ */
  /* ZIP availability checker (front-end only, no network requests)      */
  /* ------------------------------------------------------------------ */
  var STATE_PREFIXES = [
    { state: 'Maryland', from: 206, to: 219 },
    { state: 'Virginia', from: 220, to: 246 },
    { state: 'West Virginia', from: 247, to: 268 },
    { state: 'Kentucky', from: 400, to: 427 },
  ];
  var PHONE_ICON =
    '<svg fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true" class="h-[18px] w-[18px] transition-transform duration-500 group-hover:-rotate-12"><path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z"></path></svg>';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.querySelectorAll('input[autocomplete="postal-code"]').forEach(function (input) {
    var form = input.form;
    var msg = document.getElementById(input.getAttribute('aria-describedby'));
    if (!form || !msg) return;

    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 5);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var zip = input.value;
      if (!/^\d{5}$/.test(zip)) {
        input.setAttribute('aria-invalid', 'true');
        msg.innerHTML = '<p class="text-amber">Enter a valid 5-digit ZIP code.</p>';
        return;
      }
      input.setAttribute('aria-invalid', 'false');
      var prefix = parseInt(zip.slice(0, 3), 10);
      var match = null;
      STATE_PREFIXES.forEach(function (s) {
        if (prefix >= s.from && prefix <= s.to) match = s;
      });
      var z = escapeHtml(zip);
      var text = match
        ? '<span class="font-semibold text-white">Good news — Shentel serves communities in ' +
          match.state +
          '.</span> A specialist can confirm plans and pricing at your exact address in ' +
          z +
          '.'
        : '<span class="font-semibold text-white">Shentel serves select areas of VA, WV, KY and MD.</span> Give us a call and we’ll double-check service at ' +
          z +
          '.';
      msg.innerHTML =
        '<div class="flex flex-col gap-4 sm:flex-row sm:items-center">' +
        '<p class="text-white/90">' +
        text +
        '</p>' +
        '<a href="' +
        PHONE_HREF +
        '" data-magnetic class="magnetic group inline-flex items-center justify-center gap-2.5 rounded-full font-semibold tracking-tight transition-colors h-12 px-6 text-[15px] bg-orange text-white shadow-[0_12px_32px_-10px_rgba(237,110,15,0.75)] hover:bg-orange-600 shrink-0">' +
        PHONE_ICON +
        '<span>Call to order</span></a>' +
        '</div>';
      var cta = msg.querySelector('[data-magnetic]');
      if (cta) bindMagnetic(cta);
    });
  });

  /* ------------------------------------------------------------------ */
  /* FAQ accordion (one panel open at a time)                            */
  /* ------------------------------------------------------------------ */
  var faqButtons = Array.prototype.slice.call(document.querySelectorAll('button[id^="faq-q-"]'));
  var OPEN_ICON = ['rotate-45', 'bg-orange', 'text-white', 'ring-orange'];
  var CLOSED_ICON = ['text-navy', 'ring-line', 'group-hover:ring-navy/40'];
  var setFaq = function (btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.setAttribute('data-open', String(open));
    var icon = btn.lastElementChild;
    if (icon) {
      OPEN_ICON.forEach(function (c) {
        icon.classList.toggle(c, open);
      });
      CLOSED_ICON.forEach(function (c) {
        icon.classList.toggle(c, !open);
      });
    }
  };
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      faqButtons.forEach(function (b) {
        setFaq(b, false);
      });
      if (!wasOpen) setFaq(btn, true);
    });
  });
})();
