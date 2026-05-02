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
}

function getLanguageExtension(filename: string): Extension {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    // Web
    case "html": case "htm": return html();
    case "css": case "scss": case "less": return css();
    case "js": case "jsx": return javascript({ jsx: true });
    case "ts": return javascript({ typescript: true });
    case "tsx": return javascript({ jsx: true, typescript: true });
    case "json": return json();
    case "xml": case "plist": case "xcconfig": case "gradle": return xml();
    case "md": case "markdown": return markdown();
    // JVM / Android
    case "java": return java();
    case "kt": case "kts": return java(); // Kotlin — closest available
    case "groovy": return java();
    // C family / NDK / iOS
    case "c": case "h": case "cc": case "cpp": case "cxx": case "hpp": case "hxx": return cpp();
    case "cs": return cpp(); // C# — cpp is a reasonable fallback
    case "m": case "mm": return cpp(); // Objective-C
    // Swift — use JS as closest available fallback (curly braces, keywords)
    case "swift": return javascript();
    // Scripting / cross-platform
    case "py": return python();
    case "rs": return rust();
    case "go": return go();
    // Dart / Flutter — JS is close enough for block highlighting
    case "dart": return javascript();
    // Config files
    case "yaml": case "yml": return javascript(); // YAML — plaintext with some highlighting
    case "toml": case "ini": case "properties": return javascript();
    // Shell
    case "sh": case "bash": case "zsh": return javascript();
    default: return javascript();
  }
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ initialContent, filename, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => viewRef.current?.state.doc.toString() || "",
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const state = EditorState.create({
        doc: initialContent,
        extensions: [
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
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "13px", fontFamily: "Menlo, Monaco, 'Courier New', monospace" },
            ".cm-scroller": { overflow: "auto", height: "100%" },
            ".cm-content": { padding: "8px 0" },
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, [filename]); // Re-create on filename change

    return <div className="w-full h-full overflow-hidden" ref={containerRef} />;
  }
);

Editor.displayName = "Editor";
