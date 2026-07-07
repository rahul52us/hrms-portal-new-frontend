"use client";

import { useEffect, useRef, useState } from "react";

const HEADING_OPTIONS = [
  { label: "Normal", tag: "p" },
  { label: "H1", tag: "h1" },
  { label: "H2", tag: "h2" },
  { label: "H3", tag: "h3" },
] as const;

const FORMAT_BTNS = [
  { cmd: "bold", icon: "B", style: { fontWeight: 700 }, title: "Bold" },
  { cmd: "italic", icon: "I", style: { fontStyle: "italic" }, title: "Italic" },
  { cmd: "underline", icon: "U", style: { textDecoration: "underline" }, title: "Underline" },
  { cmd: "strikeThrough", icon: "S", style: { textDecoration: "line-through" }, title: "Strikethrough" },
] as const;

const LIST_BTNS = [
  { cmd: "insertUnorderedList", icon: "• List", title: "Bullet List" },
  { cmd: "insertOrderedList", icon: "1. List", title: "Numbered List" },
] as const;

const ALIGN_BTNS = [
  { cmd: "justifyLeft", icon: "≡", title: "Align Left" },
  { cmd: "justifyCenter", icon: "⊟", title: "Align Center" },
  { cmd: "justifyRight", icon: "⊞", title: "Align Right" },
] as const;

// A mix of standard, vibrant, and pastel colors for the palette
const COLOR_SWATCHES = [
  "#000000", "#4B5563", "#EF4444", "#F97316", "#F59E0B",
  "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#FFFFFF", "#F3F4F6", "#FECACA", "#FED7AA", "#FEF08A",
  "#A7F3D0", "#BFDBFE", "#C7D2FE", "#DDD6FE", "#FBCFE8",
] as const;

interface RichTextEditorProps {
  placeholder?: string;
  minHeight?: number;
  value?: string;
  onChange?: (html: string) => void;
}

export default function RichTextEditor({
  placeholder = "Start writing...",
  minHeight = 140,
  value = "",
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [focused, setFocused] = useState(false);
  const [activePicker, setActivePicker] = useState<"text" | "bg" | null>(null);

  const exec = (cmd: string, commandValue?: string) => {
    if (cmd === "hiliteColor") {
      if (!document.execCommand("hiliteColor", false, commandValue)) {
        document.execCommand("backColor", false, commandValue);
      }
    } else {
      document.execCommand(cmd, false, commandValue);
    }
    editorRef.current?.focus();
  };

  const handleInput = () => {
    const text = editorRef.current?.innerText.trim() ?? "";
    setIsEmpty(text === "");
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  useEffect(() => {
    if (!editorRef.current) return;

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }

    const text = editorRef.current.innerText.trim();
    setIsEmpty(text === "");
  }, [value]);

  // Handle clicking outside to close the color pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActivePicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const wrap: React.CSSProperties = {
    border: `1.5px solid ${focused ? "#6B21A8" : "#E5E7EB"}`,
    borderRadius: 10,
    overflow: "hidden",
    transition: "border-color 0.15s",
    background: "#FFFFFF",
  };

  const toolbar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
    padding: "8px 10px",
    borderBottom: "1.5px solid #E5E7EB",
    background: "#F9FAFB",
    position: "relative",
  };

  const btn = (extraStyle?: React.CSSProperties): React.CSSProperties => ({
    padding: "4px 9px",
    borderRadius: 6,
    border: "1px solid transparent",
    background: "transparent",
    color: "#374151",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    lineHeight: 1.4,
    transition: "background 0.1s",
    ...extraStyle,
  });

  const divider: React.CSSProperties = {
    width: 1,
    height: 20,
    background: "#E5E7EB",
    margin: "0 4px",
    flexShrink: 0,
  };

  // Renders the dropdown palette for colors
  const renderColorDropdown = (type: "text" | "bg") => {
    if (activePicker !== type) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: 4,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          padding: 10,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 6,
          }}
        >
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents editor from losing focus
                exec(type === "text" ? "foreColor" : "hiliteColor", color);
                setActivePicker(null);
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: color,
                border: "1px solid #E5E7EB",
                cursor: "pointer",
              }}
              title={color}
            />
          ))}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid #E5E7EB", paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Custom:</span>
          <input
            type="color"
            onChange={(e) => exec(type === "text" ? "foreColor" : "hiliteColor", e.target.value)}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={wrap}>
      <div style={toolbar} ref={toolbarRef}>
        <select
          defaultValue="p"
          onChange={(event) => exec("formatBlock", event.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #E5E7EB",
            fontSize: 12,
            color: "#374151",
            background: "#FFFFFF",
            cursor: "pointer",
            fontFamily: "inherit",
            marginRight: 4,
          }}
        >
          {HEADING_OPTIONS.map((heading) => (
            <option key={heading.tag} value={heading.tag}>
              {heading.label}
            </option>
          ))}
        </select>

        <div style={divider} />

        {FORMAT_BTNS.map((buttonConfig) => (
          <button
            key={buttonConfig.cmd}
            title={buttonConfig.title}
            onMouseDown={(event) => {
              event.preventDefault();
              exec(buttonConfig.cmd);
            }}
            style={btn(buttonConfig.style)}
          >
            {buttonConfig.icon}
          </button>
        ))}

        <div style={divider} />

        {/* --- TEXT COLOR BUTTON --- */}
        <div style={{ position: "relative" }}>
          <button
            title="Text Color"
            onMouseDown={(e) => {
              e.preventDefault();
              setActivePicker(activePicker === "text" ? null : "text");
            }}
            style={btn({
              background: activePicker === "text" ? "#E5E7EB" : "transparent",
            })}
          >
            A
          </button>
          {renderColorDropdown("text")}
        </div>

        {/* --- BACKGROUND COLOR BUTTON --- */}
        <div style={{ position: "relative" }}>
          <button
            title="Highlight Color"
            onMouseDown={(e) => {
              e.preventDefault();
              setActivePicker(activePicker === "bg" ? null : "bg");
            }}
            style={btn({
              background: activePicker === "bg" ? "#E5E7EB" : "transparent",
            })}
          >
            <span style={{ background: "#FEF08A", padding: "0 2px" }}>A</span>
          </button>
          {renderColorDropdown("bg")}
        </div>

        <div style={divider} />

        {LIST_BTNS.map((buttonConfig) => (
          <button
            key={buttonConfig.cmd}
            title={buttonConfig.title}
            onMouseDown={(event) => {
              event.preventDefault();
              exec(buttonConfig.cmd);
            }}
            style={btn()}
          >
            {buttonConfig.icon}
          </button>
        ))}

        <div style={divider} />

        {ALIGN_BTNS.map((buttonConfig) => (
          <button
            key={buttonConfig.cmd}
            title={buttonConfig.title}
            onMouseDown={(event) => {
              event.preventDefault();
              exec(buttonConfig.cmd);
            }}
            style={btn({ fontSize: 15 })}
          >
            {buttonConfig.icon}
          </button>
        ))}

        <div style={divider} />

        <button
          title="Insert Link"
          onMouseDown={(event) => {
            event.preventDefault();
            const url = prompt("Enter URL:");
            if (url) {
              exec("createLink", url);
            }
          }}
          style={btn()}
        >
          🔗
        </button>

        <button
          title="Remove Link"
          onMouseDown={(event) => {
            event.preventDefault();
            exec("unlink");
          }}
          style={btn({ fontSize: 11, color: "#9CA3AF" })}
        >
          Unlink
        </button>

        <div style={divider} />

        <button
          title="Clear Formatting"
          onMouseDown={(event) => {
            event.preventDefault();
            exec("removeFormat");
          }}
          style={btn({ fontSize: 11, color: "#9CA3AF" })}
        >
          T×
        </button>
      </div>

      <div style={{ position: "relative" }}>
        {isEmpty && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 14,
              fontSize: 14,
              color: "#9CA3AF",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            minHeight,
            padding: "12px 14px",
            fontSize: 14,
            color: "#111827",
            outline: "none",
            lineHeight: 1.7,
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}