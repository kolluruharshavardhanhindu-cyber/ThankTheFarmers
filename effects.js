/* Thank the Farmers — motion layer. Adds effects only; never edits wording. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = window.innerWidth < 700;

  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function el(tag, cls) { var n = doc.createElement(tag); if (cls) n.className = cls; return n; }

  /* ------------------------------------------------------------------ hero */
  var hero = doc.querySelector('.hero, .page-hero');
  var bg, kb, content, canvasRun = null;

  if (hero) {
    bg = el('div', 'fx-bg'); bg.setAttribute('aria-hidden', 'true');
    kb = el('div', 'fx-kb');
    bg.appendChild(kb);
    bg.appendChild(el('div', 'fx-shade'));
    if (!reduce) bg.appendChild(el('div', 'fx-rays'));
    hero.insertBefore(bg, hero.firstChild);
    root.classList.add('fx-ready');
    content = hero.querySelector('.hero-content');

    // headline: split into words (text itself is untouched)
    var h1 = hero.querySelector('h1');
    if (h1 && !reduce) {
      var state = { i: 0 };
      (function split(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = doc.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
              var w = el('span', 'w'), wi = el('span', 'wi');
              wi.style.setProperty('--i', state.i++);
              wi.textContent = p; w.appendChild(wi); frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) { n.classList.add('hl'); split(n); }
        });
      })(h1);
    }

    // drifting pollen, fireflies and leaves
    if (!reduce) {
      var cv = el('canvas', 'fx-canvas'); bg.appendChild(cv);
      var ctx = cv.getContext('2d');
      var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [], visible = true, raf = 0, last = 0;
      var count = small ? 22 : 46;

      function resize() {
        W = hero.clientWidth; H = hero.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function spawn(initial) {
        var leaf = Math.random() < .2;
        return {
          x: Math.random() * W, y: initial ? Math.random() * H : H + 20,
          r: leaf ? 4 + Math.random() * 4 : .8 + Math.random() * 2.6,
          vy: -(10 + Math.random() * 28), vx: (Math.random() - .5) * 8,
          ph: Math.random() * 6.28, sp: .5 + Math.random() * 1.2,
          a: .25 + Math.random() * .6, leaf: leaf, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 1.4,
          hue: leaf ? (Math.random() < .5 ? '170,215,120' : '255,190,110') : (Math.random() < .7 ? '255,205,130' : '255,245,225')
        };
      }
      function frame(t) {
        raf = requestAnimationFrame(frame);
        if (!visible || doc.hidden) { last = t; return; }
        var dt = Math.min((t - last) / 1000 || .016, .05); last = t;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.ph += p.sp * dt;
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(p.ph) * 14) * dt; p.rot += p.vr * dt;
          if (p.y < -20 || p.x < -30 || p.x > W + 30) { parts[i] = spawn(false); continue; }
          var tw = .55 + .45 * Math.sin(p.ph * 2.2);
          var al = p.a * tw;
          if (p.leaf) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = 'rgba(' + p.hue + ',' + (al * .8).toFixed(3) + ')';
            ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .42, 0, 0, 6.283); ctx.fill();
            ctx.restore();
          } else {
            var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
            g.addColorStop(0, 'rgba(' + p.hue + ',' + al.toFixed(3) + ')');
            g.addColorStop(.25, 'rgba(' + p.hue + ',' + (al * .35).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(' + p.hue + ',0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
          }
        }
      }
      resize();
      for (var k = 0; k < count; k++) parts.push(spawn(true));
      raf = requestAnimationFrame(frame);
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero); else window.addEventListener('resize', resize);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
    }
  }

  /* ----------------------------------------------- progress bar + parallax */
  var bar = el('div', 'fx-progress'); bar.setAttribute('aria-hidden', 'true'); doc.body.appendChild(bar);
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || root.scrollTop, max = root.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
      if (hero && !reduce) {
        var hh = hero.offsetHeight;
        if (y < hh * 1.1) {
          kb.style.transform = 'translate3d(0,' + (y * .16).toFixed(1) + 'px,0)';
          if (content) {
            var f = Math.min(y / (hh * .7), 1);
            content.style.transform = 'translate3d(0,' + (y * .12).toFixed(1) + 'px,0)';
            content.style.opacity = (1 - f * .85).toFixed(3);
          }
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------- scroll reveal */
  var groups = [
    ['.impact-item', 'up'], ['.section-kicker', 'up'],
    ['.intro h2', 'up'], ['.intro > p', 'up'], ['.support-card', 'up'],
    ['.section h2', 'up'], ['.section .lead', 'up'], ['.section .sub', 'up'], ['.num', 'pop'],
    ['.highlight', 'up'], ['.goal', 'up'], ['.after', 'up'], ['.italic', 'up'], ['.disclaimer', 'up'],
    ['.cards li', 'up'], ['.benefits li', 'up'], ['.ways li', 'pop'],
    ['.contact-card', 'up'], ['.pay-card', 'up'], ['.stories .story-card', 'up'],
    ['.photos img', 'img'], ['.poster', 'img'],
    ['.portrait', 'left'], ['.story-text > *', 'right'],
    ['.closing']
  ];
  var targets = [];
  groups.forEach(function (g) {
    $all(g[0]).forEach(function (n) {
      if (n.hasAttribute('data-r')) return;
      n.setAttribute('data-r', g[1] || 'up');
      targets.push(n);
    });
  });
  // stagger siblings
  var seen = new Map();
  targets.forEach(function (n) {
    var p = n.parentNode, c = seen.get(p) || 0; seen.set(p, c + 1);
    n.style.setProperty('--d', (Math.min(c, 6) * .09).toFixed(2) + 's');
  });

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (n) { io.observe(n); });
  } else {
    targets.forEach(function (n) { n.classList.add('in'); });
  }

  /* ------------------------------------------------------ tilt + glare cards */
  if (finePointer && !reduce) {
    $all('.support-card, .cards li, .benefits li, .contact-card, .pay-card, .stories .story-card').forEach(function (c) {
      c.classList.add('fx-tilt');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', function () {
        c.style.removeProperty('--rx'); c.style.removeProperty('--ry');
      });
    });

    // magnetic buttons
    $all('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px');
        b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.removeProperty('--tx'); b.style.removeProperty('--ty'); });
    });
  }

  /* ----------------------------------------------- floating hearts in banner */
  if (!reduce) {
    var glyphs = ['♥', '✦', '♥', '✿'];
    $all('.closing-inner').forEach(function (box) {
      for (var i = 0; i < (small ? 6 : 11); i++) {
        var s = el('span', 'fx-float'); s.setAttribute('aria-hidden', 'true');
        s.textContent = glyphs[i % glyphs.length];
        s.style.setProperty('--x', (4 + Math.random() * 92).toFixed(1) + '%');
        s.style.setProperty('--s', (12 + Math.random() * 18).toFixed(0) + 'px');
        s.style.setProperty('--t', (6 + Math.random() * 6).toFixed(1) + 's');
        s.style.setProperty('--dl', (-Math.random() * 10).toFixed(1) + 's');
        s.style.setProperty('--dx', ((Math.random() - .5) * 90).toFixed(0) + 'px');
        s.style.setProperty('--rot', ((Math.random() - .5) * 120).toFixed(0) + 'deg');
        box.appendChild(s);
      }
    });
  }

  /* ----------------------------------------------- celebratory burst on copy */
  if (!reduce) {
    $all('.copy').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var bits = ['♥', '✦', '✿', '♥'];
        for (var i = 0; i < 14; i++) {
          var s = el('span', 'fx-bit'), a = Math.random() * 6.283, d = 40 + Math.random() * 70;
          s.textContent = bits[i % bits.length];
          s.style.left = cx + 'px'; s.style.top = cy + 'px';
          s.style.setProperty('--bx', (Math.cos(a) * d).toFixed(0) + 'px');
          s.style.setProperty('--by', (Math.sin(a) * d - 20).toFixed(0) + 'px');
          s.style.setProperty('--br', ((Math.random() - .5) * 300).toFixed(0) + 'deg');
          s.style.color = ['#ed741d', '#ffb347', '#2d6a35', '#e63946'][i % 4];
          doc.body.appendChild(s);
          setTimeout((function (n) { return function () { n.remove(); }; })(s), 1000);
        }
      });
    });
  }

  /* ------------------------------------------------------- page transitions */
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('fx-leave'); });
  if (!reduce) {
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      var u; try { u = new URL(a.href, location.href); } catch (_) { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname) return;            // in-page anchors keep smooth scroll
      e.preventDefault();
      root.classList.add('fx-leave');
      setTimeout(function () { location.href = a.href; }, 240);
    });
  }
})();
