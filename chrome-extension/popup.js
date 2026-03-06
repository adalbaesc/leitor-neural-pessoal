/**
 * Leitor Neural Pessoal - Chrome Extension
 * Captura URLs, textos e PDFs e envia para o Web App.
 * Usa o prefixo microsoft-edge: para forçar abertura no Edge (vozes neurais).
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

/**
 * Abre a URL forçando no Microsoft Edge.
 * Usa o protocolo microsoft-edge: que o Windows reconhece.
 */
function openInEdge(url) {
  // O prefixo microsoft-edge: abre a URL no Edge automaticamente
  window.open(`microsoft-edge:${url}`, '_blank');
  window.close();
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
    openInEdge(readUrl);
  } catch (err) {
    showStatus('Erro ao capturar a aba.');
    console.error(err);
  }
});

// ── Colar Texto ──
document.getElementById('btn-paste').addEventListener('click', () => {
  openInEdge(`${WEB_APP_BASE}/paste`);
});

// ── Ler PDF ──
document.getElementById('btn-pdf').addEventListener('click', () => {
  openInEdge(`${WEB_APP_BASE}/pdf`);
});
