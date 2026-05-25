(function () {
  const body = document.body;
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll() {
    if (!hero) return;
    const past = hero.getBoundingClientRect().bottom < 60;
    body.classList.toggle('scrolled', past);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('.code-wrap > pre').forEach((pre) => {
    const wrap = pre.parentElement;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy to clipboard');
    btn.setAttribute('aria-live', 'polite');
    btn.innerHTML = '<svg class="copy" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V7a2 2 0 0 1 2-2h8"/></svg><svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>';
    wrap.appendChild(btn);
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const text = pre.innerText.trim();
      try { await navigator.clipboard.writeText(text); }
      catch {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        try { document.execCommand('copy'); } catch {}
        sel.removeAllRanges();
      }
      btn.classList.add('copied');
      btn.setAttribute('aria-label', 'Copied');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('aria-label', 'Copy to clipboard');
      }, 1400);
    });
  });

  function lastTextNode(root) {
    let last = null;
    function walk(node) {
      if (node.nodeType === 3 && node.nodeValue.trim()) {
        last = node;
        return;
      }
      if (node.nodeType !== 1 || node.matches('pre, code, script, style')) return;
      Array.from(node.childNodes).forEach(walk);
    }
    walk(root);
    return last;
  }

  // CSS handles most wrapping; this keeps final short phrases from orphaning.
  document.querySelectorAll([
    '.hero-sub',
    '.lead',
    '.chapter-head-desc',
    '.prose p',
    '.callout p',
    '.loop-intro',
    '.loop-note',
    '.chapter-info p',
    '.loop-grid p',
    '.pull',
    '.principles-list p',
    '.never-list strong',
    '.ref-body .desc',
    '.sources-intro',
    '.source-list .src-gloss'
  ].join(',')).forEach((el) => {
    if (el.textContent.trim().split(/\s+/).length < 4) return;
    const node = lastTextNode(el);
    if (!node) return;
    node.nodeValue = node.nodeValue.replace(/(\S+)\s+(\S+)\s+(\S+)(\s*)$/, '$1\u00a0$2\u00a0$3$4');
  });

  function scrollToAnchor(id, shouldPushState, behavior) {
    if (!id) return false;
    const target = document.getElementById(id);
    if (!target) return false;
    const y = target.getBoundingClientRect().top + window.scrollY - 24;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    if (behavior === 'auto') root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: y, behavior: behavior || (reduceMotion ? 'auto' : 'smooth') });
    if (behavior === 'auto') {
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    }
    if (shouldPushState) history.pushState(null, '', '#' + id);
    return true;
  }

  function settleHashScroll(behavior) {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const run = () => {
      scrollToAnchor(id, false, behavior || 'auto');
      onScroll();
    };
    run();
    window.requestAnimationFrame(run);
    window.setTimeout(run, 120);
    window.setTimeout(run, 480);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(() => {});
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!scrollToAnchor(id, true)) return;
      e.preventDefault();
    });
  });

  window.addEventListener('load', () => {
    const schedule = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame
      : (typeof window.setTimeout === 'function' ? (callback) => window.setTimeout(callback, 0) : (callback) => callback());
    schedule(() => {
      settleHashScroll('auto');
    });
  }, { once: true });

  window.addEventListener('hashchange', () => {
    settleHashScroll(reduceMotion ? 'auto' : 'smooth');
  });
})();
