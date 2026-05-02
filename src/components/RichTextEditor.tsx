import { useRef, useCallback } from "react";
import Icon from "@/components/Icon";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR: { cmd: string; arg?: string; icon: string; label: string }[] = [
  { cmd: "bold", icon: "fa-bold", label: "বোল্ড" },
  { cmd: "italic", icon: "fa-italic", label: "ইটালিক" },
  { cmd: "underline", icon: "fa-underline", label: "আন্ডারলাইন" },
  { cmd: "strikeThrough", icon: "fa-strikethrough", label: "স্ট্রাইক" },
  { cmd: "insertUnorderedList", icon: "fa-list-ul", label: "বুলেট তালিকা" },
  { cmd: "insertOrderedList", icon: "fa-list-ol", label: "নম্বর তালিকা" },
  { cmd: "formatBlock", arg: "H3", icon: "fa-heading", label: "শিরোনাম" },
  { cmd: "formatBlock", arg: "BLOCKQUOTE", icon: "fa-quote-left", label: "উদ্ধৃতি" },
  { cmd: "removeFormat", icon: "fa-eraser", label: "ফরম্যাট মুছুন" },
];

export default function RichTextEditor({ value, onChange, placeholder = "এখানে লিখুন...", minHeight = 160 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  const execCmd = useCallback((cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleRef = useCallback((el: HTMLDivElement | null) => {
    (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (el && !isInitialized.current && value) {
      el.innerHTML = value;
      isInitialized.current = true;
    }
  }, [value]);

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", gap: 2, padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", flexWrap: "wrap" }}>
        {TOOLBAR.map((btn) => (
          <button
            key={btn.cmd + (btn.arg || "")}
            type="button"
            title={btn.label}
            onClick={() => execCmd(btn.cmd, btn.arg)}
            style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; e.currentTarget.style.color = "#d4af37"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
          >
            <Icon name={btn.icon} size={14} />
          </button>
        ))}
      </div>
      <div
        ref={handleRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight, padding: "12px 16px", outline: "none", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7, direction: "rtl", textAlign: "right" }}
        className="rich-editor-content"
      />
    </div>
  );
}
