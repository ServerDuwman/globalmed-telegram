import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 2016;
const BACKEND_URL = process.env.BACKEND_URL || 'http://87.192.224.166:8989';

// 1. Для главной страницы внедряем скрипт Telegram WebApp для мобильных телефонов (полный экран, без свайп-сброса)
app.get(['/', '/index.html'], async (req, res, next) => {
  try {
    const upstream = await fetch(`${BACKEND_URL}/`);
    let html = await upstream.text();

    const telegramInjection = `
    <!-- Telegram Mini App Mobile / Desktop Integration -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script>
      (function() {
        function setupTelegramView() {
          if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            try {
              tg.ready();
              tg.expand();

              // Определяем, откуда открыто: с ПК или со смартфона
              const isDesktop = ['tdesktop', 'macos', 'web', 'weba'].includes(tg.platform) ||
                                !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

              if (isDesktop) {
                // На ПК (Desktop): разворачиваем в большое / широкое окно
                if (typeof tg.requestFullscreen === 'function') {
                  tg.requestFullscreen();
                }
              } else {
                // На Телефоне: открываем в обычном аккуратном мобильном окне без лишних кнопок
                if (typeof tg.exitFullscreen === 'function') {
                  tg.exitFullscreen();
                }
              }

              if (typeof tg.enableClosingConfirmation === 'function') {
                tg.enableClosingConfirmation();
              }
            } catch (err) {
              console.warn('Telegram view setup error:', err);
            }
          }
        }

        setupTelegramView();
        document.addEventListener('DOMContentLoaded', setupTelegramView);
        window.addEventListener('load', setupTelegramView);
        setTimeout(setupTelegramView, 300);
      })();
    </script>
    <style>
      /* Адаптивный контейнер для ПК и смартфона */
      html, body, #root {
        width: 100% !important;
        height: 100% !important;
        min-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-overflow-scrolling: touch;
      }
    </style>
    `;

    html = html.replace('</head>', `${telegramInjection}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(html);
  } catch (err) {
    console.error('Ошибка загрузки HTML с бэкенда:', err.message);
    next();
  }
});

// 2. Полный прозрачный реверс-прокси для всех файлов, скриптов, стилей и /api
app.use(
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true
  })
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Реверс-прокси Globalmed HRM запущен на порту ${PORT}`);
  console.log(`🌐 Проксирование на: ${BACKEND_URL}`);
  console.log(`📱 Адаптация под телефонный формат Telegram активна`);
  console.log(`====================================================`);
});
