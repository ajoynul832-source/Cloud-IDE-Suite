import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView, lineNumbers, keymap, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
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
}

interface EditorProps {
  initialContent: string;
  filename: string;
  onChange: (content: string) => void;
  /** When true, the editor is non-editable (read-only view). Default: false */
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
    case "kt": case "kts": return java();
    case "groovy": return java();
    case "c": case "h": case "cc": case "cpp": case "cxx": case "hpp": case "hxx": return cpp();
    case "cs": return cpp();
    case "m": case "mm": return cpp();
    case "swift": return javascript();
    case "py": return python();
    case "rs": return rust();
    case "go": return go();
    case "dart": return javascript();
    case "yaml": case "yml": return javascript();
    case "toml": case "ini": case "properties": return javascript();
    case "sh": case "bash": case "zsh": return javascript();
    default: return javascript();
  }
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ initialContent, filename, onChange, readOnly = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => viewRef.current?.state.doc.toString() || "",
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const extensions: Extension[] = [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        getLanguageExtension(filename),
        vscodeDark,
        autocompletion(),
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px", fontFamily: "Menlo, Monaco, 'Courier New', monospace" },
          ".cm-scroller": { overflow: "auto", height: "100%" },
          ".cm-content": { padding: "8px 0" },
        }),
      ];

      if (readOnly) {
        extensions.push(EditorView.editable.of(false));
        extensions.push(EditorState.readOnly.of(true));
      } else {
        extensions.push(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
          }),
        );
      }

      const state = EditorState.create({ doc: initialContent, extensions });
      const view = new EditorView({ state, parent: containerRef.current });
      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, [filename, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

    return <div className="w-full h-full overflow-hidden" ref={containerRef} />;
  },
);

Editor.displayName = "Editor";
