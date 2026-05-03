import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView, lineNumbers, keymap, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { search, searchKeymap } from "@codemirror/search";
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
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput } from "@codemirror/language";

export interface EditorRef {
  getContent: () => string;
  getCursorPosition: () => { line: number; col: number };
}

interface EditorProps {
  initialContent: string;
  filename: string;
  onChange: (content: string) => void;
  onRun?: () => void;
  onCursorChange?: (line: number, col: number) => void;
  fontSize?: number;
  wordWrap?: boolean;
  readOnly?: boolean;
}

function getLanguageExtension(filename: string): Extension {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "html": case "htm": return html();
    case "css": case "scss": case "less": return css();
    case "js": case "jsx": return javascript({ jsx: true });
    case "ts": return javascript({ typescript: true });
    case "tsx": return javascript({ jsx: true, typescript: true });
    case "json": return json();
    case "xml": case "plist": case "xcconfig": case "gradle": return xml();
    case "md": case "markdown": return markdown();
    case "java": return java();
    case "kt": case "kts": case "groovy": return java();
    case "c": case "h": case "cc": case "cpp": case "cxx": case "hpp": case "hxx": return cpp();
    case "cs": case "m": case "mm": return cpp();
    case "py": return python();
    case "rs": return rust();
    case "go": return go();
    default: return javascript();
  }
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ initialContent, filename, onChange, onRun, onCursorChange, fontSize = 13, wordWrap = false, readOnly = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef      = useRef<EditorView | null>(null);

    const onRunRef            = useRef(onRun);
    const onCursorChangeRef   = useRef(onCursorChange);
    useEffect(() => { onRunRef.current = onRun; }, [onRun]);
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
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const savedContent = viewRef.current?.state.doc.toString() ?? initialContent;

      const extensions: Extension[] = [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          {
            key: "Ctrl-Enter",
            mac: "Cmd-Enter",
            run: () => { onRunRef.current?.(); return true; },
          },
        ]),
        getLanguageExtension(filename),
        vscodeDark,
        autocompletion(),
        search({ top: true }),
        keymap.of(searchKeymap),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: `${fontSize}px`,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          },
          ".cm-scroller": { overflow: "auto", height: "100%" },
          ".cm-content":  { padding: "8px 0" },
        }),
      ];

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
    }, [filename, readOnly, fontSize, wordWrap]);

    return <div className="w-full h-full overflow-hidden" ref={containerRef} />;
  },
);

Editor.displayName = "Editor";
