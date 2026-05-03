/**
 * Client-side preview generators for CSS, Markdown, JSON, SVG, and
 * React Native Web (live in-browser runner via Babel + RNW).
 *
 * Each function returns a complete, self-contained HTML string that
 * can be set as the srcDoc of a sandboxed iframe, or served via a blob URL.
 */

// ─── CSS Preview ─────────────────────────────────────────────────────────────
export function generateCSSPreview(css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CSS Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.5; }
    /* USER CSS — everything below is your stylesheet */
    ${css}
  </style>
</head>
<body>
  <div class="page container wrapper layout">

    <header class="header site-header top-bar">
      <div class="brand logo site-title">
        <h1>CSS <span class="accent highlight">Preview</span></h1>
        <p class="subtitle tagline">Your styles applied below</p>
      </div>
      <nav class="nav navbar menu">
        <a class="link nav-link" href="#">Home</a>
        <a class="link nav-link active current" href="#">About</a>
        <a class="link nav-link" href="#">Work</a>
        <button class="btn button cta primary">Get Started</button>
      </nav>
    </header>

    <main class="main content main-content">

      <section class="section hero banner">
        <h2 class="title heading hero-title">Hero Section</h2>
        <p class="text body-text lead description">
          This preview page contains common HTML elements so you can see how
          your stylesheet affects real content. Edit the CSS on the left to
          watch it update here in real time.
        </p>
        <div class="actions buttons">
          <button class="btn button primary cta">Primary Action</button>
          <button class="btn button secondary outline">Secondary</button>
        </div>
      </section>

      <section class="section cards grid">
        <div class="card box panel">
          <h3 class="card-title title">Card One</h3>
          <p class="card-body text">Flexbox, Grid, custom properties — all your layout tools, live.</p>
          <span class="badge tag label">New</span>
        </div>
        <div class="card box panel">
          <h3 class="card-title title">Card Two</h3>
          <p class="card-body text">Animate hover states, transitions, and transforms instantly.</p>
          <span class="badge tag label secondary">Beta</span>
        </div>
        <div class="card box panel">
          <h3 class="card-title title">Card Three</h3>
          <p class="card-body text">Media queries, dark mode, custom fonts — all reflected here.</p>
          <span class="badge tag label accent">Hot</span>
        </div>
      </section>

      <section class="section form-section">
        <form class="form">
          <label class="label field-label">Email address</label>
          <input class="input field text-field" type="email" placeholder="you@example.com" />
          <label class="label field-label">Message</label>
          <textarea class="textarea field" rows="3" placeholder="Write something…"></textarea>
          <button class="btn button submit primary" type="submit">Send</button>
        </form>
      </section>

      <section class="section typography-section">
        <h1 class="heading h1">Heading 1</h1>
        <h2 class="heading h2">Heading 2</h2>
        <h3 class="heading h3">Heading 3</h3>
        <p class="text paragraph">Regular paragraph text with <strong class="strong bold">bold</strong>,
          <em class="em italic">italic</em>, and <code class="code inline-code">inline code</code>.</p>
        <ul class="list ul">
          <li class="item list-item">List item one</li>
          <li class="item list-item">List item two</li>
          <li class="item list-item">List item three</li>
        </ul>
        <blockquote class="blockquote quote">
          "Design is not just what it looks like and feels like. Design is how it works."
        </blockquote>
      </section>

    </main>

    <footer class="footer site-footer bottom-bar">
      <p class="copyright text">&copy; 2025 CSS Preview — CloudIDE</p>
    </footer>
  </div>
</body>
</html>`;
}

// ─── Markdown Preview ─────────────────────────────────────────────────────────
export function generateMarkdownPreview(markdown: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines   = markdown.split("\n");
  const html: string[] = [];
  let inCode    = false;
  let codeLang  = "";
  let codeLines: string[] = [];
  let inUl      = false;
  let inOl      = false;
  let ulDepth   = 0;

  const closeList = () => {
    if (inUl)      { html.push("</ul>"); inUl = false; }
    else if (inOl) { html.push("</ol>"); inOl = false; }
  };

  const inlineMarkdown = (text: string): string => {
    return escape(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code class="language-${escape(codeLang)}">${codeLines.map(escape).join("\n")}</code></pre>`);
        inCode = false; codeLines = []; codeLang = "";
      } else {
        closeList();
        inCode = true; codeLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith("# "))       { closeList(); html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);  continue; }
    if (line.startsWith("## "))      { closeList(); html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);  continue; }
    if (line.startsWith("### "))     { closeList(); html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);  continue; }
    if (line.startsWith("#### "))    { closeList(); html.push(`<h4>${inlineMarkdown(line.slice(5))}</h4>`);  continue; }
    if (line.startsWith("##### "))   { closeList(); html.push(`<h5>${inlineMarkdown(line.slice(6))}</h5>`);  continue; }
    if (line.startsWith("###### "))  { closeList(); html.push(`<h6>${inlineMarkdown(line.slice(7))}</h6>`);  continue; }
    if (line.startsWith("> "))       { closeList(); html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`); continue; }
    if (/^[-*+] /.test(line))        {
      if (!inUl) { closeList(); html.push("<ul>"); inUl = true; }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\. /.test(line))        {
      if (!inOl) { closeList(); html.push("<ol>"); inOl = true; }
      html.push(`<li>${inlineMarkdown(line.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }
    if (/^[-*_]{3,}$/.test(line.trim())) { closeList(); html.push("<hr>"); continue; }
    if (line.trim() === "") { closeList(); html.push("<p></p>"); continue; }

    const isTable = line.includes("|");
    if (isTable && !inUl && !inOl) {
      const cells = line.split("|").filter(c => c.trim() !== "").map(c => inlineMarkdown(c.trim()));
      if (line.replace(/[\s|-]/g, "") === "") { continue; }
      html.push(`<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  if (inCode) {
    html.push(`<pre><code class="language-${escape(codeLang)}">${codeLines.map(escape).join("\n")}</code></pre>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Markdown Preview</title>
  <style>
    :root { --bg: #0d1117; --fg: #e6edf3; --muted: #7d8590; --border: #30363d;
            --code-bg: #161b22; --link: #58a6ff; --accent: #4ade80; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--fg); font: 15px/1.7 'Segoe UI', system-ui, sans-serif; padding: 32px max(16px, calc(50% - 380px)); }
    h1, h2, h3, h4, h5, h6 { color: var(--fg); font-weight: 600; margin: 1.4em 0 .5em; line-height: 1.3; }
    h1 { font-size: 1.9em; border-bottom: 1px solid var(--border); padding-bottom: .4em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: .3em; }
    h3 { font-size: 1.2em; } h4 { font-size: 1em; }
    p { margin: .7em 0; color: var(--fg); }
    a { color: var(--link); text-decoration: none; } a:hover { text-decoration: underline; }
    strong { font-weight: 700; } em { font-style: italic; } del { opacity: .6; }
    code { font: 13px/1.4 'SF Mono', Menlo, Consolas, monospace; background: var(--code-bg);
           color: var(--accent); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
    pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px;
          padding: 16px; overflow-x: auto; margin: 1em 0; }
    pre code { background: none; border: none; padding: 0; color: var(--fg); font-size: 13px; }
    blockquote { border-left: 3px solid var(--accent); margin: 1em 0; padding: .4em 1em;
                 color: var(--muted); background: var(--code-bg); border-radius: 0 6px 6px 0; }
    ul, ol { padding-left: 1.6em; margin: .6em 0; }
    li { margin: .25em 0; }
    hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid var(--border); padding: 8px 12px; font-size: .9em; }
    tr:nth-child(even) { background: var(--code-bg); }
    p:empty { height: .4em; }
  </style>
</head>
<body>${html.join("\n")}</body>
</html>`;
}

// ─── JSON Preview ─────────────────────────────────────────────────────────────
export function generateJSONPreview(jsonStr: string): string {
  let parsed: unknown;
  let parseError: string | null = null;
  try { parsed = JSON.parse(jsonStr); }
  catch (e) { parseError = e instanceof Error ? e.message : "Invalid JSON"; }

  const colorize = (obj: unknown, depth = 0): string => {
    const indent = "  ".repeat(depth);
    const inner  = "  ".repeat(depth + 1);
    if (obj === null) return '<span class="null">null</span>';
    if (typeof obj === "boolean")
      return `<span class="${obj ? "bool-t" : "bool-f"}">${obj}</span>`;
    if (typeof obj === "number")
      return `<span class="num">${obj}</span>`;
    if (typeof obj === "string")
      return `<span class="str">"${obj.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}"</span>`;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      const items = obj.map((v, i) =>
        `${inner}${colorize(v, depth + 1)}${i < obj.length - 1 ? "," : ""}`
      );
      return `[\n${items.join("\n")}\n${indent}]`;
    }
    if (typeof obj === "object") {
      const entries = Object.entries(obj as Record<string, unknown>);
      if (entries.length === 0) return "{}";
      const items = entries.map(([k, v], i) =>
        `${inner}<span class="key">"${k.replace(/"/g,"&quot;")}"</span>: ${colorize(v, depth + 1)}${i < entries.length - 1 ? "," : ""}`
      );
      return `{\n${items.join("\n")}\n${indent}}`;
    }
    return String(obj);
  };

  const body = parseError
    ? `<div class="err">⚠ Parse error: ${parseError.replace(/</g,"&lt;")}</div>`
    : `<pre>${colorize(parsed)}</pre>`;

  return `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JSON Preview</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d1117;color:#e6edf3;font:13px/1.6 'SF Mono',Menlo,Consolas,monospace;padding:16px}
    pre{white-space:pre-wrap;word-break:break-all}
    .key{color:#79c0ff} .str{color:#a5d6ff} .num{color:#79c0ff}
    .bool-t{color:#4ade80} .bool-f{color:#f97316} .null{color:#7d8590;font-style:italic}
    .err{color:#ff7b72;background:#3d1c1c;border:1px solid #8b2020;border-radius:6px;padding:12px}
  </style>
</head><body>${body}</body></html>`;
}

// ─── SVG Preview ─────────────────────────────────────────────────────────────
export function generateSVGPreview(svgSource: string): string {
  const escaped = svgSource
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SVG Preview</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;background:#0d1117;color:#e6edf3;font:12px 'SF Mono',Menlo,monospace}
    #canvas{display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);padding:20px}
    #canvas svg{max-width:100%;max-height:100%;width:auto;height:auto}
    #meta{height:40px;border-top:1px solid #30363d;display:flex;align-items:center;
          padding:0 16px;color:#7d8590;font-size:11px;gap:12px}
    #err{color:#ff7b72;padding:20px}
  </style>
</head>
<body>
  <div id="canvas">
    <div id="err"></div>
  </div>
  <div id="meta"><span id="meta-text"></span></div>
  <script>
    var src = ${JSON.stringify(svgSource).replace(/<\/script/gi, '<\\/script')};
    var canvas  = document.getElementById('canvas');
    var errEl   = document.getElementById('err');
    var meta    = document.getElementById('meta-text');
    try {
      var parser  = new DOMParser();
      var doc     = parser.parseFromString(src, 'image/svg+xml');
      var err     = doc.querySelector('parsererror');
      if (err) throw new Error(err.textContent);
      var svgEl   = doc.documentElement;
      var wrapper = document.createElement('div');
      wrapper.appendChild(document.importNode(svgEl, true));
      canvas.appendChild(wrapper);
      var w = svgEl.getAttribute('width')  || svgEl.getAttribute('viewBox')?.split(' ')[2] || '?';
      var h = svgEl.getAttribute('height') || svgEl.getAttribute('viewBox')?.split(' ')[3] || '?';
      meta.textContent = w + ' × ' + h + ' · SVG Preview';
    } catch(e) {
      errEl.textContent = 'SVG parse error: ' + e.message;
    }
  </script>
</body>
</html>`;
}

// ─── React Native Web Preview ─────────────────────────────────────────────────
//
// Transforms React Native source code to run directly in the browser using
// React Native Web (RNW). No Expo Snack API call needed — works instantly.
//
// Steps:
//  1. transformRNCode()  — replaces import/export with global variable refs
//  2. Babel standalone   — handles JSX → createElement at runtime in browser
//  3. Indirect eval      — runs code in global scope so App becomes window.App
//  4. AppRegistry        — mounts the App component via RNW

function transformRNCode(code: string): string {
  let out = code;

  // Remove TypeScript type imports
  out = out.replace(/import\s+type\s+[^\n]*\n?/g, "");

  // import React, { useState, useEffect } from 'react'
  // → const { useState, useEffect } = React;
  out = out.replace(
    /import\s+React\s*,\s*\{([^}]+)\}\s+from\s+['"]react['"]\s*;?/g,
    (_, h) => `const { ${h.trim()} } = React;`,
  );

  // import React from 'react' → (remove — React is a global)
  out = out.replace(/import\s+React\s+from\s+['"]react['"]\s*;?\n?/g, "");

  // import { useState } from 'react' → const { useState } = React;
  out = out.replace(
    /import\s+\{([^}]+)\}\s+from\s+['"]react['"]\s*;?/g,
    (_, h) => `const { ${h.trim()} } = React;`,
  );

  // import { View, Text, ... } from 'react-native' (handles multi-line)
  // → const { View, Text, ... } = ReactNativeWeb;
  out = out.replace(
    /import\s+\{([^}]+)\}\s+from\s+['"]react-native(?:-web)?['"]\s*;?/g,
    (_, imp) => `const { ${imp.replace(/\s+/g, " ").trim()} } = ReactNativeWeb;`,
  );

  // Remove all remaining import statements (expo, third-party, etc.)
  out = out.replace(/import\s+[^\n]+\n?/g, "");

  // export default function App( → function App(
  out = out.replace(/export\s+default\s+function\s+App\s*\(/, "function App(");
  // export default class App → class App
  out = out.replace(/export\s+default\s+class\s+App\b/, "class App");
  // export default someIdentifier → var __rnExportDefault = someIdentifier
  out = out.replace(
    /export\s+default\s+(?!function|class)(\w+)/g,
    "var __rnExportDefault = $1",
  );
  // export default function/class OtherName → function/class OtherName
  out = out.replace(/export\s+default\s+(function|class)\s+/, "$1 ");
  // Named exports: export const/let/var/function/class → remove export keyword
  out = out.replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ");

  return out;
}

/**
 * Generates a complete self-contained HTML page that runs React Native code
 * live in the browser using React Native Web + Babel standalone.
 *
 * Works with the Expo Starter template (and any standard RN code) instantly
 * — no server round-trip, no Expo API, no network delay beyond CDN loads.
 */
export function generateReactNativeWebPreview(files: Record<string, string>): string {
  const appFile =
    files["App.js"] ??
    files["App.tsx"] ??
    files["App.ts"] ??
    Object.entries(files).find(([k]) => /^App\.[jt]sx?$/.test(k))?.[1] ??
    Object.values(files)[0] ??
    "";

  const transformed = transformRNCode(appFile);

  // Safe JSON encoding — escapes </script> so the HTML parser won't close
  // our script tag prematurely when the user code contains that string.
  const safeJson = JSON.stringify(transformed)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;background:#0d1117;overflow:hidden}
    #root{height:100%;display:flex;flex-direction:column}
    #__err{
      display:none;position:fixed;inset:0;background:#150a0a;
      color:#ff9090;font:12px/1.6 'SF Mono',Monaco,Consolas,monospace;
      padding:20px;overflow:auto;z-index:9999;white-space:pre-wrap;word-break:break-all
    }
    #__loading{
      position:fixed;inset:0;background:#0d1117;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:14px;z-index:8888
    }
    .spin{width:28px;height:28px;border:2px solid #4ade8025;border-top-color:#4ade80;
          border-radius:50%;animation:s .8s linear infinite}
    @keyframes s{to{transform:rotate(360deg)}}
    .loadtxt{color:#4ade8090;font:12px/1 'SF Mono',Monaco,monospace}
    .loadtxt2{color:#ffffff25;font:11px/1 'SF Mono',Monaco,monospace}
  </style>
</head>
<body>
  <div id="__loading">
    <div class="spin"></div>
    <span class="loadtxt">Loading React Native Web…</span>
    <span class="loadtxt2">First load may take a few seconds</span>
  </div>
  <div id="root"></div>
  <div id="__err"></div>

  <!-- User code stored as JSON — safe from HTML injection -->
  <script id="__rncode" type="application/json">${safeJson}</script>

  <!-- React Native Web stack loaded from CDN -->
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/react-native-web@0.19.12/dist/index.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.23.6/babel.min.js"></script>

  <script>
    (function () {
      var loadingEl = document.getElementById('__loading');
      var errEl     = document.getElementById('__err');

      function showErr(msg) {
        if (loadingEl) loadingEl.style.display = 'none';
        errEl.style.display = 'block';
        errEl.textContent = '\\u26a0\\ufe0f  ' + String(msg);
      }

      window.onerror = function (m, _s, _l, _c, e) {
        showErr(e ? (e.stack || e.message) : m);
        return true;
      };
      window.addEventListener('unhandledrejection', function (e) {
        showErr(e.reason
          ? (e.reason.stack || e.reason.message || String(e.reason))
          : 'Unhandled promise rejection');
      });

      var RNW = window.ReactNativeWeb;

      // Expose common RNW exports as globals so user code (post-import-transform)
      // can reference View, Text, StyleSheet, etc. directly.
      [
        'View','Text','StyleSheet','TouchableOpacity','Pressable','ScrollView',
        'FlatList','SectionList','SafeAreaView','StatusBar','Image','TextInput',
        'Switch','ActivityIndicator','Modal','Dimensions','Platform','Animated',
        'Easing','KeyboardAvoidingView','RefreshControl','VirtualizedList',
        'TouchableHighlight','TouchableWithoutFeedback','ImageBackground',
        'Alert','Linking','PixelRatio','BackHandler','Keyboard','LayoutAnimation',
        'AppRegistry',
      ].forEach(function (k) { if (RNW[k] !== undefined) window[k] = RNW[k]; });

      // Expose React hooks & utilities as globals
      [
        'useState','useEffect','useCallback','useMemo','useRef','useContext',
        'createContext','useReducer','useLayoutEffect','useInsertionEffect',
        'forwardRef','memo','Fragment','createElement','cloneElement','Children',
        'Component','PureComponent','createRef',
      ].forEach(function (k) { if (window.React[k] !== undefined) window[k] = window.React[k]; });

      // Read user code from JSON script tag
      var codeEl = document.getElementById('__rncode');
      if (!codeEl) { showErr('Internal error: code element missing'); return; }

      var userCode;
      try { userCode = JSON.parse(codeEl.textContent); }
      catch (e) { showErr('Internal error parsing code: ' + e.message); return; }

      // Compile JSX with Babel (react preset only — no module transform)
      var compiled;
      try {
        compiled = Babel.transform(userCode, {
          presets: [['react', { runtime: 'classic' }]],
          filename: 'App.js',
        }).code;
        // Strip "use strict" so indirect eval runs in sloppy mode.
        // In sloppy mode, function declarations in eval go to global scope
        // (i.e. window.App = function App(){...}).
        compiled = compiled.replace(/^['"]use strict['"];\s*/m, '');
      } catch (e) {
        showErr('Compile error:\\n\\n' + (e.message || String(e)));
        return;
      }

      // Run in global scope via indirect eval.
      // Sloppy-mode function declarations are hoisted to window, so
      // "function App(){}" becomes window.App automatically.
      try {
        var geval = eval; // indirect eval — executes in global scope
        geval(compiled);
      } catch (e) {
        showErr('Runtime error:\\n\\n' + (e.stack || e.message));
        return;
      }

      // Locate the App component
      var AppComp = window.App || window.__rnExportDefault;
      if (!AppComp) {
        showErr(
          'No "App" component found.\\n\\n' +
          'Make sure your file contains:\\n\\n' +
          '  export default function App() {\\n' +
          '    return <View>...</View>;\\n' +
          '  }\\n\\n' +
          'or:\\n\\n' +
          '  const App = () => <View>...</View>;\\n' +
          '  export default App;'
        );
        return;
      }

      // Hide loading spinner, mount the app
      if (loadingEl) loadingEl.style.display = 'none';
      try {
        RNW.AppRegistry.registerComponent('__CloudIDEApp__', function () { return AppComp; });
        RNW.AppRegistry.runApplication('__CloudIDEApp__', {
          rootTag: document.getElementById('root'),
          initialProps: {},
        });
      } catch (e) {
        showErr('Mount error:\\n\\n' + (e.stack || e.message));
      }
    })();
  </script>
</body>
</html>`;
}
