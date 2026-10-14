"use client";

import katex from "katex";

/**
 * Parse a string for LaTeX delimiters ($...$ for inline, $$...$$ for display)
 * and render them using KaTeX. Non-math parts are rendered as plain text.
 */
export default function LatexText({ text }: { text: string }) {
  const parts = splitLatex(text);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.value}</span>;
        }
        try {
          const html = katex.renderToString(part.value, {
            throwOnError: false,
            displayMode: part.type === "display",
          });
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: html }}
              className={part.type === "display" ? "block my-2 text-center" : ""}
            />
          );
        } catch {
          return (
            <code key={i} className="text-rose-500 text-sm">
              {part.value}
            </code>
          );
        }
      })}
    </span>
  );
}

interface LatexPart {
  type: "text" | "inline" | "display";
  value: string;
}

function splitLatex(input: string): LatexPart[] {
  const result: LatexPart[] = [];
  // Match $$...$$ (display) first, then $...$ (inline)
  const regex = /(\$\$[\s\S]+?\$\$|\$(?!\$)(?:[^$\\]|\\.)+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      result.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    if (raw.startsWith("$$")) {
      result.push({ type: "display", value: raw.slice(2, -2).trim() });
    } else {
      result.push({ type: "inline", value: raw.slice(1, -1).trim() });
    }

    lastIndex = match.index + raw.length;
  }

  // Remaining text
  if (lastIndex < input.length) {
    result.push({ type: "text", value: input.slice(lastIndex) });
  }

  return result;
}
