import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView, lineNumbers, keymap, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, crosshairCursor, highlightSpecialChars } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab, toggleComment } from "@codemirror/commands";
import { search, searchKeymap } from "@codemirror/search";
import { linter, lintGutter, Diagnostic } from "@codemirror/lint";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { markdown } from "@codemirror/lang-markdown";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { monokai } from "@uiw/codemirror-theme-monokai";
import { githubDark } from "@uiw/codemirror-theme-github";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput, syntaxTree, foldGutter, foldKeymap, indentUnit } from "@codemirror/language";

// ── Theme system ───────────────────────────────────────────────────────────────

export type EditorTheme = "vscodeDark" | "dracula" | "monokai" | "githubDark";

function getThemeExtension(theme: EditorTheme): Extension {
  switch (theme) {
    case "dracula":    return dracula;
    case "monokai":    return monokai;
    case "githubDark": return githubDark;
    default:           return vscodeDark;
  }
}

// ── Language extensions ────────────────────────────────────────────────────────

function getLanguageExtension(filename: string): Extension {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "html": case "htm":                                      return html();
    case "css": case "scss": case "less":                         return css();
    case "js": case "jsx": case "mjs": case "cjs":               return javascript({ jsx: true });
    case "ts":                                                    return javascript({ typescript: true });
    case "tsx":                                                   return javascript({ jsx: true, typescript: true });
    case "json":                                                  return json();
    case "xml": case "plist": case "xcconfig": case "gradle":    return xml();
    case "md": case "markdown":                                   return markdown();
    case "java": case "kt": case "kts": case "groovy":           return java();
    case "c": case "h": case "cc": case "cpp": case "cxx":
    case "hpp": case "hxx": case "cs": case "m": case "mm":      return cpp();
    case "py":                                                    return python();
    case "rs":                                                    return rust();
    case "go":                                                    return go();
    // No Lezer grammar for shell/perl — don't fall back to JS parser
    case "sh": case "bash": case "zsh": case "pl": case "pm":    return [];
    default:                                                      return javascript();
  }
}

// ── Syntax-error linter (works for any Lezer-parsed language) ─────────────────
// Only enabled for extensions where we have a proper grammar (avoids false
// positives on Bash/Perl which otherwise fall back to the JS parser).

const LINTABLE_EXTS = new Set([
  "js", "jsx", "mjs", "cjs", "ts", "tsx",
  "html", "htm", "css", "scss", "json",
  "py", "java", "kt", "c", "h", "cpp", "cxx", "cc", "hpp",
  "rs", "go",
]);

function syntaxErrorSource(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state).cursor().iterate((node) => {
    if (node.name === "⚠") {
      diagnostics.push({
        from: node.from,
        to: Math.max(node.to, node.from + 1),
        severity: "error",
        message: "Syntax error — check brackets, quotes, or missing tokens near this position.",
      });
    }
  });
  return diagnostics;
}

// ── Public types ───────────────────────────────────────────────────────────────

export interface EditorRef {
  getContent: () => string;
  getCursorPosition: () => { line: number; col: number };
  /** Programmatically replace the entire document content (e.g. for Format). */
  setContent: (content: string) => void;
}

interface EditorProps {
  initialContent:  string;
  filename:        string;
  onChange:        (content: string) => void;
  onRun?:          () => void;
  onFormat?:       () => void;
  onCursorChange?: (line: number, col: number) => void;
  fontSize?:       number;
  wordWrap?:       boolean;
  readOnly?:       boolean;
  theme?:          EditorTheme;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({
    initialContent, filename, onChange, onRun, onFormat, onCursorChange,
    fontSize = 13, wordWrap = false, readOnly = false, theme = "vscodeDark",
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef      = useRef<EditorView | null>(null);

    const onRunRef          = useRef(onRun);
    const onFormatRef       = useRef(onFormat);
    const onCursorChangeRef = useRef(onCursorChange);
    useEffect(() => { onRunRef.current    = onRun; },    [onRun]);
    useEffect(() => { onFormatRef.current = onFormat; }, [onFormat]);
    useEffect(() => { onCursorChangeRef.current = onCursorChange; }, [onCursorChange]);

    useImperativeHandle(ref, () => ({
      getContent: () => viewRef.current?.state.doc.toString() ?? "",
      getCursorPosition: () => {
        const view = viewRef.current;
        if (!view) return { line: 1, col: 1 };
        const pos  = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        return { line: line.number, col: pos - line.from + 1 };
      },
      setContent: (content: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
          // Keep the cursor at a sensible position after replacing
          selection: { anchor: Math.min(view.state.selection.main.anchor, content.length) },
        });
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const savedContent = viewRef.current?.state.doc.toString() ?? initialContent;
      const ext          = filename.split(".").pop()?.toLowerCase() ?? "";
      const canLint      = LINTABLE_EXTS.has(ext);

      // ── AI inline completion source (Ctrl+Space to trigger) ─────────────────
      // Fetches a suggestion from /api/ai/complete using the code context.
      const aiCompletionSource = async (context: CompletionContext): Promise<CompletionResult | null> => {
        if (!context.explicit) return null; // only on Ctrl+Space, not while typing

        const pos    = context.pos;
        const text   = context.state.doc.toString();
        const prefix = text.slice(Math.max(0, pos - 800), pos);
        const suffix = text.slice(pos, Math.min(text.length, pos + 200));

        try {
          const ctrl = new AbortController();
          const tid  = setTimeout(() => ctrl.abort(), 10_000);
          const res  = await fetch("/api/ai/complete", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefix, suffix, filename }),
            signal: ctrl.signal,
          });
          clearTimeout(tid);

          if (!res.ok) return null;
          const data = await res.json() as { completion?: string };
          const completion = data.completion?.trim();
          if (!completion) return null;

          const lines = completion.split("\n");
          const label = lines[0].slice(0, 70) + (lines.length > 1 ? " …" : "");

          return {
            from: pos,
            options: [{
              label,
              detail: "✨ AI",
              apply: completion,
              boost: 99,
              type: "text",
            }],
            validFor: /.*/,
          };
        } catch {
          return null;
        }
      };

      const extensions: Extension[] = [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        rectangularSelection(),
        crosshairCursor(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        indentUnit.of("  "),
        foldGutter(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...closeBracketsKeymap,
          ...completionKeymap,
          indentWithTab,
          {
            key: "Ctrl-Enter", mac: "Cmd-Enter",
            run: () => { onRunRef.current?.(); return true; },
          },
          {
            key: "Ctrl-/", mac: "Cmd-/",
            run: toggleComment,
          },
          {
            key: "Ctrl-Shift-f", mac: "Cmd-Shift-f",
            run: () => { onFormatRef.current?.(); return true; },
          },
        ]),
        getLanguageExtension(filename),
        getThemeExtension(theme),
        autocompletion({ defaultKeymap: false, override: [aiCompletionSource] }),
        search({ top: true }),
        keymap.of(searchKeymap),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: `${fontSize}px`,
            fontFamily: "'JetBrains Mono', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
          },
          ".cm-scroller": { overflow: "auto", height: "100%" },
          ".cm-content":  { padding: "8px 0" },
          ".cm-gutter.cm-lint-gutter": { width: "18px" },
          ".cm-foldGutter": { width: "14px" },
          ".cm-foldGutter .cm-gutterElement": {
            cursor: "pointer",
            padding: "0 2px",
            color: "rgba(255,255,255,0.2)",
          },
          ".cm-foldGutter .cm-gutterElement:hover": { color: "rgba(74,222,128,0.7)" },
        }),
      ];

      if (canLint) {
        extensions.push(lintGutter());
        extensions.push(linter(syntaxErrorSource, { delay: 600 }));
      }

      if (wordWrap) extensions.push(EditorView.lineWrapping);

      if (readOnly) {
        extensions.push(EditorView.editable.of(false));
        extensions.push(EditorState.readOnly.of(true));
      } else {
        extensions.push(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
            if (update.selectionSet) {
              const pos  = update.state.selection.main.head;
              const line = update.state.doc.lineAt(pos);
              onCursorChangeRef.current?.(line.number, pos - line.from + 1);
            }
          }),
        );
      }

      const state = EditorState.create({
        doc: readOnly ? initialContent : savedContent,
        extensions,
      });
      const view = new EditorView({ state, parent: containerRef.current });
      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filename, readOnly, fontSize, wordWrap, theme]);

    return <div className="w-full h-full overflow-hidden" ref={containerRef} />;
  },
);

Editor.displayName = "Editor";
