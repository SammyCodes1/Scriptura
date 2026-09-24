/**
 * postbuild.js — runs after `expo export -p web`
 * Injects the Scriptura theme CSS custom properties and no-flash
 * localStorage bootstrap script into dist/index.html.
 */
const fs = require('fs');
const path = require('path');

const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distHtml)) {
  console.error('postbuild: dist/index.html not found. Did the build run?');
  process.exit(1);
}

const THEME_CSS = `
    <!-- Scriptura theme CSS custom properties (6 themes) -->
    <style id="scriptura-themes">
      /* ── Parchment (default) ── */
      :root, [data-theme="parchment"] {
        --bg: #F6EFE2; --surface: #FBF6EC;
        --text-primary: #3B2A1E; --text-secondary: #6B5847;
        --accent: #8B5E34; --border: #E4D5BE;
      }
      [data-theme="midnight"] {
        --bg: #1E1812; --surface: #2A221B;
        --text-primary: #EDE3D3; --text-secondary: #B8A793;
        --accent: #D9A15B; --border: #3A3025;
      }
      [data-theme="daylight"] {
        --bg: #FAFAF8; --surface: #FFFFFF;
        --text-primary: #1A1A1A; --text-secondary: #5A5A5A;
        --accent: #2563EB; --border: #E0E0DE;
      }
      [data-theme="sage"] {
        --bg: #F1F3EC; --surface: #F8FAF5;
        --text-primary: #1E2418; --text-secondary: #4D5A47;
        --accent: #3A6B40; --border: #CDD6C4;
      }
      [data-theme="forest"] {
        --bg: #0D1914; --surface: #162820;
        --text-primary: #E2ECE6; --text-secondary: #9EB1A6;
        --accent: #34D399; --border: #264235;
      }
      [data-theme="dark"] {
        --bg: #0C0A09; --surface: #1C1917;
        --text-primary: #FAFAF9; --text-secondary: #A8A29E;
        --accent: #60A5FA; --border: #44403C;
      }
      html, body { background-color: var(--bg, #F6EFE2); }
    </style>
    <!-- No-flash theme bootstrap: runs before JS, reads localStorage -->
    <script>
      (function(){
        var V=['parchment','midnight','daylight','sage','forest','dark'];
        var B={parchment:'#F6EFE2',midnight:'#1E1812',daylight:'#FAFAF8',sage:'#F1F3EC',forest:'#0D1914',dark:'#0C0A09'};
        function t(){
          try{
            if(localStorage.getItem('@scriptura_theme_chosen')==='true'){
              var s=localStorage.getItem('@scriptura_theme');
              if(s&&V.indexOf(s)!==-1)return s;
            }
          }catch(e){}
          try{if(window.matchMedia('(prefers-color-scheme: dark)').matches)return 'midnight';}catch(e){}
          return 'parchment';
        }
        var th=t();
        document.documentElement.setAttribute('data-theme',th);
        document.documentElement.style.backgroundColor=B[th]||'#F6EFE2';
      })();
    </script>`;

let html = fs.readFileSync(distHtml, 'utf8');

// Only inject if not already done (idempotent)
if (!html.includes('scriptura-themes')) {
  // Insert before </head>
  html = html.replace('</head>', THEME_CSS + '\n  </head>');
  fs.writeFileSync(distHtml, html, 'utf8');
  console.log('postbuild: injected theme CSS + no-flash script into dist/index.html');
} else {
  console.log('postbuild: theme injection already present, skipping.');
}
