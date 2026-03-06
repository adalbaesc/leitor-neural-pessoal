/**
 * Leitor Neural Pessoal - Chrome/Edge Extension
 * Captura URLs, textos e PDFs e envia para o Web App.
 * Abre diretamente na aba atual do Edge (sem prompt).
 */

const WEB_APP_BASE = 'https://leitor-neural-pessoal-adalba.vercel.app';

const statusEl = document.getElementById('status');

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.classList.add('visible');
  setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 3000);
}

// ── Ler Aba Atual ──
document.getElementById('btn-read-tab').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url) {
      showStatus('Não foi possível capturar a URL.');
      return;
    }

    // No chrome:// or edge:// URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      showStatus('Não é possível ler páginas do navegador.');
      return;
    }

    const readUrl = `${WEB_APP_BASE}/read?url=${encodeURIComponent(tab.url)}`;

    // Open directly in a new tab (no microsoft-edge: prefix needed since we're already in Edge)
    chrome.tabs.create({ url: readUrl });
    window.close();
  } catch (err) {
    showStatus('Erro ao capturar a aba.');
    console.error(err);
  }
});

// ── Colar Texto ──
document.getElementById('btn-paste').addEventListener('click', () => {
  chrome.tabs.create({ url: `${WEB_APP_BASE}/paste` });
  window.close();
});

// ── Ler PDF ──
document.getElementById('btn-pdf').addEventListener('click', () => {
  chrome.tabs.create({ url: `${WEB_APP_BASE}/pdf` });
  window.close();
});
