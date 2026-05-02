import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { autocompletion } from "@codemirror/autocomplete";

export interface EditorRef {
  getContent: () => string;
}

interface EditorProps {
  initialContent: string;
  filename: string;
  onChange: (content: string) => void;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({ initialContent, filename, onChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    getContent: () => viewRef.current?.state.doc.toString() || "",
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const ext = filename.split(".").pop()?.toLowerCase();
    let languageExtension = javascript();
    if (ext === "html") languageExtension = html();
    if (ext === "css") languageExtension = css();
    // Use javascript as fallback for dart, yaml, etc for decent syntax highlighting

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        languageExtension,
        vscodeDark,
        autocompletion(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
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

  return (
    <div className="w-full h-full overflow-hidden" ref={containerRef} />
  );
});

Editor.displayName = "Editor";
