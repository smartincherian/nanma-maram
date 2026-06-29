import React from "react";
import DOMPurify from "dompurify";
import FormattedText from "./FormattedText";

// Renders intention content safely.
//   - New content from RichTextEditor is HTML -> sanitized, then rendered.
//   - Legacy content is lightweight markup (**bold** + newlines) -> FormattedText.
// Only a small allow-list of formatting tags/attributes survives sanitizing, so
// there is no path for scripts or event handlers to reach the page.
const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "s", "strike", "span", "br", "div", "p"];
const ALLOWED_ATTR = ["style"];

const looksLikeHtml = (value) => /<[a-z][\s\S]*>/i.test(value);

const RichContent = ({ text }) => {
  const value = String(text || "");
  if (!value.trim()) return null;
  if (!looksLikeHtml(value)) return <FormattedText text={value} />;
  const clean = DOMPurify.sanitize(value, { ALLOWED_TAGS, ALLOWED_ATTR });
  return <span dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default RichContent;
