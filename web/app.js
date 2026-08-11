(function () {
  'use strict';

  // DOM Elements
  const htmlEl = document.documentElement;
  const docTitleEl = document.getElementById('doc-title');
  const markdownBody = document.getElementById('markdown-body');
  const emptyState = document.getElementById('empty-state');
  const tocSidebar = document.getElementById('toc-sidebar');
  const tocList = document.getElementById('toc-list');
  const tocBtn = document.getElementById('toc-btn');
  const tocClose = document.getElementById('toc-close');
  const findBtn = document.getElementById('find-btn');
  const findBar = document.getElementById('find-bar');
  const findInput = document.getElementById('find-input');
  const findCount = document.getElementById('find-count');
  const findPrev = document.getElementById('find-prev');
  const findNext = document.getElementById('find-next');
  const findClose = document.getElementById('find-close');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomBadge = document.getElementById('zoom-badge');
  const themeBtn = document.getElementById('theme-btn');
  const openBtn = document.getElementById('open-btn');
  const emptyOpenBtn = document.getElementById('empty-open-btn');
  const toast = document.getElementById('toast');

  let currentDoc = null;
  let zoomLevel = 1.0;
  let findMatches = [];
  let currentFindIndex = -1;

  // Send IPC Message to Go Backend
  function postToGo(action, payload = {}) {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage(JSON.stringify({ action, ...payload }));
    } else {
      console.log('[IPC Mock Post]', action, payload);
    }
  }

  // --- Theme Management ---
  function setTheme(theme) {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    htmlEl.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const current = htmlEl.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    postToGo('save_theme', { theme: next });
  }

  themeBtn.addEventListener('click', toggleTheme);

  // --- Zoom Management ---
  function updateZoom(newZoom) {
    zoomLevel = Math.max(0.5, Math.min(2.5, Math.round(newZoom * 10) / 10));
    markdownBody.style.fontSize = `${zoomLevel * 16}px`;
    zoomBadge.textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  zoomInBtn.addEventListener('click', () => updateZoom(zoomLevel + 0.1));
  zoomOutBtn.addEventListener('click', () => updateZoom(zoomLevel - 0.1));

  // --- Document Rendering API (Invoked by Go core) ---
  window.renderDocument = function (doc) {
    currentDoc = doc;
    emptyState.classList.add('hidden');
    markdownBody.classList.remove('hidden');

    docTitleEl.textContent = doc.name || 'MDView';
    document.title = `${doc.name} - MDView`;

    markdownBody.innerHTML = doc.rendered_html || '';

    buildTOC(doc.table_of_contents || []);
    setupLinkInterception();

    // Scroll to top or anchor
    window.scrollTo(0, 0);
  };

  window.renderError = function (errMsg) {
    emptyState.classList.add('hidden');
    markdownBody.classList.remove('hidden');
    docTitleEl.textContent = 'Error - MDView';
    markdownBody.innerHTML = `<div class="error-banner" style="background:#ef444422; border:1px solid #ef4444; color:#ef4444; padding:16px; border-radius:8px; margin-top:20px;">
      <h3 style="margin-bottom:8px;">Failed to load Markdown document</h3>
      <p>${escapeHtml(errMsg)}</p>
    </div>`;
  };

  window.showEmptyState = function () {
    currentDoc = null;
    markdownBody.classList.add('hidden');
    emptyState.classList.remove('hidden');
    docTitleEl.textContent = 'MDView';
    document.title = 'MDView';
    tocSidebar.classList.add('hidden');
  };

  window.setTheme = setTheme;

  // --- TOC Outline Sidebar ---
  function buildTOC(tocItems) {
    tocList.innerHTML = '';
    if (!tocItems || tocItems.length === 0) {
      tocList.innerHTML = '<div style="padding:16px; font-size:0.85rem; color:var(--text-secondary);">No headings found in document</div>';
      return;
    }

    tocItems.forEach((item) => {
      const a = document.createElement('a');
      a.className = `toc-item level-${item.level}`;
      a.href = `#${item.id}`;
      a.textContent = item.text;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(item.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
      tocList.appendChild(a);
    });
  }

  function toggleTOC() {
    tocSidebar.classList.toggle('hidden');
  }

  tocBtn.addEventListener('click', toggleTOC);
  tocClose.addEventListener('click', () => tocSidebar.classList.add('hidden'));

  // --- Link Interception (External vs Local Markdown links) ---
  function setupLinkInterception() {
    const links = markdownBody.querySelectorAll('a');
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.getElementById(href.substring(1));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        } else if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
          e.preventDefault();
          postToGo('open_external', { url: href });
        } else if (href.endsWith('.md') || href.endsWith('.markdown') || href.includes('.md#')) {
          e.preventDefault();
          postToGo('open_relative', { path: href });
        }
      });
    });
  }

  // --- Copy Code Handler ---
  window.copyCode = function (btn) {
    const code = btn.getAttribute('data-code');
    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {
      showToast('Copied to clipboard!');
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 2000);
    });
  };

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }

  // --- Find-in-Document Search Engine ---
  function showFindBar() {
    findBar.classList.remove('hidden');
    findInput.focus();
    findInput.select();
  }

  function closeFindBar() {
    findBar.classList.add('hidden');
    clearFindHighlights();
  }

  function clearFindHighlights() {
    const matches = markdownBody.querySelectorAll('mark.find-match');
    matches.forEach((m) => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    findMatches = [];
    currentFindIndex = -1;
    findCount.textContent = '0 / 0';
  }

  function performFind() {
    clearFindHighlights();
    const query = findInput.value.trim();
    if (!query) return;

    const walk = document.createTreeWalker(markdownBody, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];

    let node;
    while ((node = walk.nextNode())) {
      if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE') continue;
      const text = node.nodeValue;
      if (text.toLowerCase().includes(query.toLowerCase())) {
        nodesToReplace.push(node);
      }
    }

    nodesToReplace.forEach((textNode) => {
      const parent = textNode.parentNode;
      const text = textNode.nodeValue;
      const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
      const frag = document.createDocumentFragment();
      let lastIdx = 0;

      text.replace(regex, (match, p1, offset) => {
        frag.appendChild(document.createTextNode(text.substring(lastIdx, offset)));
        const mark = document.createElement('mark');
        mark.className = 'find-match';
        mark.textContent = match;
        frag.appendChild(mark);
        lastIdx = offset + match.length;
      });

      frag.appendChild(document.createTextNode(text.substring(lastIdx)));
      parent.replaceChild(frag, textNode);
    });

    findMatches = Array.from(markdownBody.querySelectorAll('mark.find-match'));
    if (findMatches.length > 0) {
      currentFindIndex = 0;
      highlightActiveMatch();
    } else {
      findCount.textContent = '0 / 0';
    }
  }

  function highlightActiveMatch() {
    findMatches.forEach((m, i) => {
      if (i === currentFindIndex) {
        m.classList.add('active');
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        m.classList.remove('active');
      }
    });
    findCount.textContent = `${currentFindIndex + 1} / ${findMatches.length}`;
  }

  function nextMatch() {
    if (findMatches.length === 0) return;
    currentFindIndex = (currentFindIndex + 1) % findMatches.length;
    highlightActiveMatch();
  }

  function prevMatch() {
    if (findMatches.length === 0) return;
    currentFindIndex = (currentFindIndex - 1 + findMatches.length) % findMatches.length;
    highlightActiveMatch();
  }

  findBtn.addEventListener('click', showFindBar);
  findClose.addEventListener('click', closeFindBar);
  findInput.addEventListener('input', performFind);
  findNext.addEventListener('click', nextMatch);
  findPrev.addEventListener('click', prevMatch);

  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) prevMatch();
      else nextMatch();
    } else if (e.key === 'Escape') {
      closeFindBar();
    }
  });

  // --- Open File Buttons ---
  function requestOpenFile() {
    postToGo('open_dialog');
  }

  openBtn.addEventListener('click', requestOpenFile);
  emptyOpenBtn.addEventListener('click', requestOpenFile);

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
      e.preventDefault();
      toggleTOC();
    } else if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      showFindBar();
    } else if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
      e.preventDefault();
      requestOpenFile();
    } else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      updateZoom(zoomLevel + 0.1);
    } else if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      updateZoom(zoomLevel - 0.1);
    } else if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      updateZoom(1.0);
    } else if (e.key === 'Escape') {
      if (!findBar.classList.contains('hidden')) {
        closeFindBar();
      } else if (!tocSidebar.classList.contains('hidden')) {
        tocSidebar.classList.add('hidden');
      }
    }
  });

  // --- Drag and Drop File Handlers ---
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.path) {
        postToGo('open_file', { path: file.path });
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          postToGo('open_content', { name: file.name, content: evt.target.result });
        };
        reader.readAsText(file);
      }
    }
  });

  // Utility helpers
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Notify Go core frontend is ready
  document.addEventListener('DOMContentLoaded', () => {
    postToGo('ready');
  });

})();
