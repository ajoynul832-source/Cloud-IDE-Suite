/**
 * Client-side preview generators for CSS, Markdown, JSON, and SVG.
 * Each function returns a complete, self-contained HTML string that
 * can be set as the srcDoc of a sandboxed iframe.
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
    /* ── Sensible reset so user CSS starts clean ── */
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.5; }
    /* ─────────────────────────────────────────────── */
    /* USER CSS — everything below is your stylesheet */
    ${css}
  </style>
</head>
<body>
  <div class="page container wrapper layout">

    <header class="header site-header top-bar">
      <div class="brand logo site-title">
        <h1>CSS <span class="accent highlight">Preview</span></h1>
      </div>
      <nav class="nav navigation menu">
        <a href="#" class="link nav-link active current">Home</a>
        <a href="#" class="link nav-link">About</a>
        <a href="#" class="link nav-link">Work</a>
        <a href="#" class="link nav-link">Contact</a>
      </nav>
    </header>

    <main class="main content body">

      <section class="section hero banner">
        <h2 class="title heading section-title">Welcome to the Preview</h2>
        <p class="text description subtitle lead">
          Your styles are applied to all these elements. Edit the CSS and click
          <strong>Run</strong> to see changes instantly.
        </p>
        <p>
          This is regular <strong>bold text</strong>, <em>italic text</em>,
          <a href="#" class="link">a hyperlink</a>, and
          <code class="code inline-code">inline code</code>.
        </p>
      </section>

      <section class="section buttons-section">
        <h3 class="title section-title">Buttons &amp; Inputs</h3>
        <div class="row flex-row button-group" style="display:flex;gap:.6rem;flex-wrap:wrap;margin:.75rem 0">
          <button class="btn button primary cta">Primary</button>
          <button class="btn button secondary">Secondary</button>
          <button class="btn button outline ghost">Outline</button>
          <button class="btn button danger destructive">Danger</button>
          <button class="btn button sm small" disabled>Disabled</button>
        </div>
        <div class="field form-group" style="display:flex;flex-direction:column;gap:.5rem;max-width:320px">
          <input  type="text"     class="input field-input text-input" placeholder="Text input…">
          <input  type="email"    class="input field-input email-input" placeholder="Email address…">
          <select class="input select dropdown">
            <option>Option one</option><option>Option two</option><option>Option three</option>
          </select>
          <textarea class="input textarea" rows="3" placeholder="Textarea…"></textarea>
        </div>
      </section>

      <section class="section cards-section">
        <h3 class="title section-title">Cards</h3>
        <div class="grid cards card-grid" style="display:flex;gap:1rem;flex-wrap:wrap">
          <div class="card item box panel">
            <div class="card-header"><h4 class="card-title">Card One</h4></div>
            <div class="card-body"><p class="card-text text">Sample card with typical content.</p></div>
            <div class="card-footer"><button class="btn button">Action</button></div>
          </div>
          <div class="card item box panel featured highlight active">
            <div class="card-header"><h4 class="card-title">Featured</h4></div>
            <div class="card-body"><p class="card-text text">A featured / highlighted variant.</p></div>
            <div class="card-footer">
              <span class="badge tag chip label pill">NEW</span>
            </div>
          </div>
          <div class="card item box panel dark">
            <div class="card-header"><h4 class="card-title">Dark Card</h4></div>
            <div class="card-body"><p class="card-text text">Dark variant with more classes.</p></div>
          </div>
        </div>
      </section>

      <section class="section lists-section">
        <h3 class="title section-title">Lists &amp; Tables</h3>
        <ul class="list ul items">
          <li class="item list-item">List item one</li>
          <li class="item list-item active selected">Active item two</li>
          <li class="item list-item">List item three</li>
        </ul>
        <table class="table data-table" style="margin-top:1rem;width:100%;max-width:480px">
          <thead class="thead table-head">
            <tr><th>Language</th><th>Runs</th><th>Status</th></tr>
          </thead>
          <tbody class="tbody table-body">
            <tr class="row tr even"><td>JavaScript</td><td>1,240</td><td class="status success">Active</td></tr>
            <tr class="row tr odd"> <td>Python</td>    <td>892</td>  <td class="status success">Active</td></tr>
            <tr class="row tr even"><td>C / C++</td>   <td>134</td>  <td class="status new">New</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section alerts-section">
        <h3 class="title section-title">Alerts &amp; Badges</h3>
        <div class="alert notification message info"    role="alert">ℹ Info alert message</div>
        <div class="alert notification message success" role="alert">✓ Success alert message</div>
        <div class="alert notification message warning" role="alert">⚠ Warning alert message</div>
        <div class="alert notification message error danger" role="alert">✕ Error / danger alert</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem">
          <span class="badge tag chip label pill">Default</span>
          <span class="badge tag chip label pill primary">Primary</span>
          <span class="badge tag chip label pill success">Success</span>
          <span class="badge tag chip label pill warning">Warning</span>
          <span class="badge tag chip label pill error danger">Error</span>
        </div>
      </section>

    </main>

    <footer class="footer site-footer bottom-bar">
      <p class="copyright text muted">© 2024 CloudIDE CSS Preview — styles applied live.</p>
    </footer>

  </div>
</body>
</html>`;
}

// ─── Markdown Preview ─────────────────────────────────────────────────────────
export function generateMarkdownPreview(markdown: string): string {
  // The actual parsing runs inside the sandboxed iframe via inline JS
  const escaped = JSON.stringify(markdown);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Markdown Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.7;
      max-width: 780px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }
    h1,h2 { border-bottom: 1px solid rgba(255,255,255,.1); padding-bottom:.3em; }
    h1 { font-size:2em;    color:#fff;    margin-top:1em; }
    h2 { font-size:1.5em;  color:#e6edf3; margin-top:1.25em; }
    h3 { font-size:1.25em; margin-top:1em; }
    h4,h5,h6 { margin-top:.75em; }
    h1,h2,h3,h4,h5,h6 { font-weight:600; line-height:1.25; }
    p  { margin:.75em 0; }
    a  { color:#58a6ff; }
    a:hover { text-decoration:underline; }
    code {
      background: rgba(110,118,129,.2);
      padding:.2em .4em;
      border-radius:4px;
      font-family:'Menlo','Monaco','Courier New',monospace;
      font-size:.88em;
      color:#f78166;
    }
    pre {
      background:#161b22;
      border:1px solid rgba(255,255,255,.1);
      border-radius:8px;
      padding:1rem;
      overflow-x:auto;
      margin:1em 0;
    }
    pre code { background:none; padding:0; color:#e6edf3; font-size:.88em; }
    blockquote {
      border-left:4px solid #4ade80;
      margin:1em 0;
      padding:.5em 1em;
      color:#8b949e;
      background:rgba(74,222,128,.05);
      border-radius:0 6px 6px 0;
    }
    ul,ol { padding-left:2em; margin:.75em 0; }
    li { margin:.2em 0; }
    hr { border:none; border-top:1px solid rgba(255,255,255,.1); margin:2em 0; }
    table { border-collapse:collapse; width:100%; margin:1em 0; }
    th,td { border:1px solid rgba(255,255,255,.1); padding:.5em .75em; text-align:left; }
    th { background:rgba(255,255,255,.06); font-weight:600; }
    tr:nth-child(even) td { background:rgba(255,255,255,.02); }
    img { max-width:100%; border-radius:6px; }
    strong { color:#e6edf3; }
    del { color:#8b949e; }
    .task-item { list-style:none; margin-left:-1.5em; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    var src = ${escaped};

    function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function parse(md) {
      // Stash fenced code blocks
      var codeBlocks = [];
      var out = md.replace(/\`\`\`(\\w*)\\n?([\\s\\S]*?)\`\`\`/g, function(_,lang,code){
        codeBlocks.push({lang:lang||'',code:code});
        return '\\x00CB'+(codeBlocks.length-1)+'\\x00';
      });

      // Stash inline code
      var inlineCodes = [];
      out = out.replace(/\`([^\`\\n]+)\`/g, function(_,code){
        inlineCodes.push(code);
        return '\\x00IC'+(inlineCodes.length-1)+'\\x00';
      });

      // Escape remaining HTML
      out = esc(out);

      // Headings
      out = out.replace(/^(#{1,6})\\s+(.+)$/gm, function(_,h,t){
        return '<h'+h.length+'>'+t.trim()+'</h'+h.length+'>';
      });

      // Bold + italic
      out = out.replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>');
      out = out.replace(/\\*\\*(.+?)\\*\\*/g,       '<strong>$1</strong>');
      out = out.replace(/__(.+?)__/g,                '<strong>$1</strong>');
      out = out.replace(/\\*([^*\\n]+?)\\*/g,        '<em>$1</em>');
      out = out.replace(/_([^_\\n]+?)_/g,            '<em>$1</em>');
      out = out.replace(/~~(.+?)~~/g,                '<del>$1</del>');

      // Images before links
      out = out.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, '<img alt="$1" src="$2">');
      // Links
      out = out.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>');

      // Blockquotes
      out = out.replace(/^&gt;\\s*(.+)$/gm, '<blockquote>$1</blockquote>');

      // HR
      out = out.replace(/^[-*_]{3,}\\s*$/gm, '<hr>');

      // Tables
      out = out.replace(/((?:^\\|.+\\|\\s*\\n)+)/gm, function(table){
        var rows = table.trim().split('\\n');
        var result = '<table>';
        var isHead = true;
        rows.forEach(function(row){
          if (/^[\\|\\s\\-:]+$/.test(row)){ isHead=false; return; }
          var cells = row.split('|').slice(1,-1);
          var tag = isHead ? 'th' : 'td';
          result += '<tr>' + cells.map(function(c){ return '<'+tag+'>'+c.trim()+'</'+tag+'>'; }).join('') + '</tr>';
          if (isHead) isHead = false;
        });
        return result + '</table>';
      });

      // Task list items
      out = out.replace(/^\\s*- \\[x\\] (.+)$/gim, '<li class="task-item">☑ $1</li>');
      out = out.replace(/^\\s*- \\[ \\] (.+)$/gim, '<li class="task-item">☐ $1</li>');

      // Unordered lists
      out = out.replace(/((?:^\\s*[-*+] .+\\n?)+)/gm, function(block){
        var items = block.trim().split('\\n').map(function(l){
          return '<li>'+l.replace(/^\\s*[-*+] /,'')+'</li>';
        });
        return '<ul>'+items.join('')+'</ul>\\n';
      });

      // Ordered lists
      out = out.replace(/((?:^\\d+\\. .+\\n?)+)/gm, function(block){
        var items = block.trim().split('\\n').map(function(l){
          return '<li>'+l.replace(/^\\d+\\. /,'')+'</li>';
        });
        return '<ol>'+items.join('')+'</ol>\\n';
      });

      // Paragraphs (lines not starting with a tag)
      out = out.replace(/^([^<\\n][^\\n]*)$/gm, '<p>$1</p>');

      // Restore inline code
      out = out.replace(/\\x00IC(\\d+)\\x00/g, function(_,i){
        return '<code>'+esc(inlineCodes[+i])+'</code>';
      });

      // Restore code blocks
      out = out.replace(/\\x00CB(\\d+)\\x00/g, function(_,i){
        var b = codeBlocks[+i];
        return '<pre><code class="lang-'+b.lang+'">'+esc(b.code.replace(/\\n$/,''))+'</code></pre>';
      });

      return out;
    }

    document.getElementById('root').innerHTML = parse(src);
  </script>
</body>
</html>`;
}

// ─── JSON Viewer ──────────────────────────────────────────────────────────────
export function generateJSONPreview(jsonContent: string): string {
  const escaped = JSON.stringify(jsonContent);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JSON Viewer</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Menlo','Monaco','Courier New',monospace;
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
      padding: 1rem;
    }
    .meta { font-size: .8em; color: #8b949e; margin-bottom: .75rem; padding: .4rem .75rem; background: rgba(255,255,255,.04); border-radius: 6px; display:flex; gap:1rem; flex-wrap:wrap; }
    .valid  { color: #4ade80; }
    .error  { color: #ff7b72; background: rgba(255,123,114,.08); border:1px solid rgba(255,123,114,.2); padding:1rem; border-radius:8px; white-space:pre-wrap; }
    .key    { color: #79c0ff; }
    .str    { color: #a5d6ff; }
    .num    { color: #f78166; }
    .bool   { color: #ff7b72; font-weight:600; }
    .null   { color: #8b949e; font-style:italic; }
    pre     { margin: 0; white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    var raw = ${escaped};
    var root = document.getElementById('root');

    function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function hl(json) {
      return esc(json).replace(
        /("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,
        function(m){
          var cls = 'num';
          if (/^"/.test(m))          cls = /:$/.test(m) ? 'key' : 'str';
          else if (/true|false/.test(m)) cls = 'bool';
          else if (/null/.test(m))       cls = 'null';
          return '<span class="'+cls+'">'+m+'</span>';
        }
      );
    }

    function countNodes(val) {
      if (typeof val !== 'object' || val === null) return 1;
      return Object.values(val).reduce(function(a,v){ return a + countNodes(v); }, 0);
    }

    try {
      var parsed = JSON.parse(raw);
      var pretty = JSON.stringify(parsed, null, 2);
      var type   = Array.isArray(parsed) ? 'array['+parsed.length+']' : typeof parsed;
      var nodes  = countNodes(parsed);
      root.innerHTML =
        '<div class="meta">' +
          '<span class="valid">✓ Valid JSON</span>' +
          '<span>' + raw.length.toLocaleString() + ' chars</span>' +
          '<span>type: ' + type + '</span>' +
          '<span>' + nodes.toLocaleString() + ' values</span>' +
        '</div>' +
        '<pre>' + hl(pretty) + '</pre>';
    } catch(e) {
      root.innerHTML =
        '<div class="error"><strong>Invalid JSON</strong>\\n' + e.message + '\\n\\n' + esc(raw) + '</div>';
    }
  </script>
</body>
</html>`;
}

// ─── SVG Preview ──────────────────────────────────────────────────────────────
export function generateSVGPreview(svg: string): string {
  // Allow either raw SVG or an XML declaration header
  const sanitized = svg.replace(/<\?xml[^?]*\?>\s*/i, "").trim();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SVG Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      background: #1c2128;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      gap: 1rem;
    }
    .wrapper {
      background: white;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .wrapper svg { max-width: 100%; height: auto; display:block; }
    .meta {
      font-family: monospace;
      font-size: 11px;
      color: rgba(255,255,255,.3);
      text-align: center;
    }
    .error {
      font-family: monospace;
      font-size: 12px;
      color: #ff7b72;
      background: rgba(255,123,114,.1);
      border: 1px solid rgba(255,123,114,.2);
      border-radius: 8px;
      padding: 1rem;
      max-width: 480px;
    }
  </style>
</head>
<body>
  <div id="wrapper" class="wrapper"></div>
  <div class="meta" id="meta"></div>
  <script>
    var svgStr = ${JSON.stringify(sanitized)};
    var wrapper = document.getElementById('wrapper');
    var meta    = document.getElementById('meta');
    try {
      var parser = new DOMParser();
      var doc    = parser.parseFromString(svgStr, 'image/svg+xml');
      var err    = doc.querySelector('parsererror');
      if (err) throw new Error(err.textContent);
      var svgEl  = doc.documentElement;
      wrapper.appendChild(document.importNode(svgEl, true));
      var w = svgEl.getAttribute('width')  || svgEl.getAttribute('viewBox')?.split(' ')[2] || '?';
      var h = svgEl.getAttribute('height') || svgEl.getAttribute('viewBox')?.split(' ')[3] || '?';
      meta.textContent = w + ' × ' + h + ' · SVG Preview';
    } catch(e) {
      wrapper.parentNode.replaceChild(
        Object.assign(document.createElement('div'), {className:'error', textContent: 'SVG parse error: ' + e.message}),
        wrapper
      );
    }
  </script>
</body>
</html>`;
}
