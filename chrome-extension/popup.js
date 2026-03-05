/**
 * Leitor Neural Pessoal - Chrome Extension Popup Script
 * 
 * Captura URLs, abre rotas de texto/PDF no Web App via Microsoft Edge.
 * Usa o prefixo microsoft-edge: para forçar abertura no navegador Edge.
 */

const WEB_APP_BASE = 'https://leitor-neural-pessoal-adalba.vercel.app';

const statusEl = document.getElementById('status');

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = 'text-center text-xs py-1 transition-colors duration-300';

  switch (type) {
    case 'success':
      statusEl.classList.add('text-green-400');
      break;
    case 'error':
      statusEl.classList.add('text-red-400');
      break;
    case 'loading':
      statusEl.classList.add('text-indigo-400');
      break;
    default:
      statusEl.classList.add('text-gray-500');
  }
}

function openInEdge(path) {
  const edgeUrl = `microsoft-edge:${WEB_APP_BASE}${path}`;

  chrome.tabs.create({ url: edgeUrl }, (tab) => {
    if (chrome.runtime.lastError) {
      setStatus('Erro ao abrir o Edge. Verifique se está instalado.', 'error');
      console.error('Erro:', chrome.runtime.lastError.message);
    } else {
      setStatus('Abrindo no Microsoft Edge...', 'success');
      // Close popup after a brief delay
      setTimeout(() => window.close(), 800);
    }
  });
}

// ── Ler Aba Atual ──
document.getElementById('btn-read-tab').addEventListener('click', async () => {
  setStatus('Capturando URL...', 'loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      setStatus('Não foi possível capturar a URL da aba.', 'error');
      return;
    }

    // Ignore chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      setStatus('Não é possível ler páginas internas do Chrome.', 'error');
      return;
    }

    const encodedUrl = encodeURIComponent(tab.url);
    openInEdge(`/read?url=${encodedUrl}`);
  } catch (err) {
    setStatus('Erro ao capturar a aba.', 'error');
    console.error(err);
  }
});

// ── Colar Texto ──
document.getElementById('btn-paste-text').addEventListener('click', () => {
  setStatus('Abrindo editor de texto...', 'loading');
  openInEdge('/paste');
});

// ── Ler PDF ──
document.getElementById('btn-read-pdf').addEventListener('click', () => {
  setStatus('Abrindo leitor de PDF...', 'loading');
  openInEdge('/pdf');
});
