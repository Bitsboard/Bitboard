"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  ListNode,
  ListItemNode,
} from "@lexical/list";
import {
  QuoteNode,
} from "@lexical/rich-text";
import {
  CodeNode,
} from "@lexical/code";
import {
  HeadingNode,
} from "@lexical/rich-text";
import {
  LinkNode,
  $createLinkNode,
} from "@lexical/link";
import {
  TRANSFORMERS,
} from "@lexical/markdown";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  $createTextNode,
  $getNodeByKey,
  $isElementNode,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  $getRoot,
  $createRangeSelection,
  $isParagraphNode,
} from "lexical";
import {
  $createHeadingNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $createQuoteNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
} from "@lexical/code";
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  $setBlocksType,
} from "@lexical/selection";

export type MarkdownWysiwygEditorProps = {
  value?: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
};

export default function MarkdownWysiwygEditor({
  value = "",
  onChange,
  placeholder = "What are your thoughts?",
  className = "",
  minHeight = 200,
}: MarkdownWysiwygEditorProps) {
  const initialConfig = useMemo(() => ({
    namespace: "markdown-wysiwyg",
    theme: lexicalTheme,
    editorState: (editor: any) => {
      editor.update(() => {
        if (!value) {
          const root = $getRoot();
          if (root.getFirstChild() == null) {
            root.append($createParagraphNode());
          }
          return;
        }
        $convertFromMarkdownString(value, TRANSFORMERS);
      });
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      CodeNode,
      ListNode,
      ListItemNode,
      LinkNode,
    ],
    onError(error: Error) {
      console.error(error);
    },
  }), []);

  return (
    <div className={`w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="flex flex-col">
          <Toolbar />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="prose dark:prose-invert max-w-none outline-none px-4 py-3 text-sm leading-relaxed resize-none"
                  style={{ minHeight }}
                />
              }
              placeholder={<Placeholder text={placeholder} />}
              ErrorBoundary={({ children }) => <div>{children}</div>}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <EmitMarkdownOnChange onChange={onChange} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

const lexicalTheme = {
  paragraph: "mb-1",
  heading: {
    h1: "text-xl font-bold mb-2 mt-3",
    h2: "text-lg font-semibold mb-2 mt-3",
    h3: "text-base font-semibold mb-1 mt-2",
  },
  quote: "border-l-2 border-neutral-300 dark:border-neutral-600 pl-3 italic my-2 text-neutral-600 dark:text-neutral-400",
  list: {
    listitem: "my-0.5",
    nested: {
      listitem: "my-0.5",
    },
    ul: "list-disc ml-4 my-1",
    ol: "list-decimal ml-4 my-1",
    checklist: "ml-2 my-1",
  },
  link: "text-blue-600 dark:text-blue-400 underline hover:opacity-80",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "rounded bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-xs",
  },
  code: "block w-full overflow-auto rounded bg-neutral-100 dark:bg-neutral-800 p-3 font-mono text-sm my-2",
};

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      let element: any = anchorNode;
      
      // Find the top-level element
      while (element && element.getParent() && !$isRootOrShadowRoot(element.getParent())) {
        const parent = element.getParent();
        if (parent) {
          element = parent;
        } else {
          break;
        }
      }

      if (element !== null) {
        if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
        } else if ($isQuoteNode(element)) {
          setBlockType("quote");
        } else if ($isCodeNode(element)) {
          setBlockType("code");
        } else if ($isListNode(element)) {
          setBlockType("list");
        } else {
          setBlockType("paragraph");
        }
      }
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateToolbar]);

  const formatText = (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: "h1" | "h2" | "h3") => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== "code") {
    editor.update(() => {
      const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createCodeNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(url);
          const textNode = $createTextNode(url);
          linkNode.append(textNode);
          selection.insertNodes([linkNode]);
        }
      });
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title, 
    className = "" 
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
        isActive ? "bg-neutral-100 dark:bg-neutral-800" : ""
      } ${className}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        isActive={false}
        title="Undo (Ctrl+Z)"
        className={!canUndo ? "opacity-50 cursor-not-allowed" : ""}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        isActive={false}
        title="Redo (Ctrl+Y)"
        className={!canRedo ? "opacity-50 cursor-not-allowed" : ""}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </ToolbarButton>

      <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => formatText("bold")}
        isActive={isBold}
        title="Bold (Ctrl+B)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatText("italic")}
        isActive={isItalic}
        title="Italic (Ctrl+I)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M8 20h4M12 4l-2 16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatText("underline")}
        isActive={isUnderline}
        title="Underline (Ctrl+U)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v8m0 0l-3-3m3 3l3-3M4 20h16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatText("strikethrough")}
        isActive={isStrikethrough}
        title="Strikethrough"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M9 12l6 0M3 12h18" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatText("code")}
        isActive={isCode}
        title="Inline Code (Ctrl+`)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </ToolbarButton>

      <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

      {/* Block Types */}
      <ToolbarButton
        onClick={formatParagraph}
        isActive={blockType === "paragraph"}
        title="Normal text"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatHeading("h1")}
        isActive={blockType === "h1"}
        title="Heading 1"
      >
        <span className="text-sm font-bold">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatHeading("h2")}
        isActive={blockType === "h2"}
        title="Heading 2"
      >
        <span className="text-sm font-semibold">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatHeading("h3")}
        isActive={blockType === "h3"}
        title="Heading 3"
      >
        <span className="text-sm font-medium">H3</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={formatQuote}
        isActive={blockType === "quote"}
        title="Quote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={formatCode}
        isActive={blockType === "code"}
        title="Code block"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </ToolbarButton>

      <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={formatBulletList}
        isActive={blockType === "ul"}
        title="Bullet list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={formatNumberedList}
        isActive={blockType === "ol"}
        title="Numbered list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={insertLink}
        isActive={false}
        title="Insert link"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

function EmitMarkdownOnChange({ onChange }: { onChange?: (md: string) => void }) {
  const [editor] = useLexicalComposerContext();
  const initialSync = useRef(true);

  useEffect(() => {
    if (!onChange) return;
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const md = $convertToMarkdownString(TRANSFORMERS);
        if (initialSync.current) {
          initialSync.current = false;
          return;
        }
        onChange(md);
      });
    });
  }, [editor, onChange]);
  return null;
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute left-4 top-3 select-none text-neutral-400 text-sm">
      {text}
    </div>
  );
}