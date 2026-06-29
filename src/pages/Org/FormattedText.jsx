import React from "react";

// Renders lightweight intention markup safely (no raw HTML):
//   - newlines  -> line breaks
//   - **text**  -> bold
// Returns inline nodes meant to be placed inside a Typography/Box.
const renderInline = (line, keyBase) =>
  line.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyBase}-b-${i}`}>{part}</strong>
    ) : (
      <React.Fragment key={`${keyBase}-t-${i}`}>{part}</React.Fragment>
    )
  );

const FormattedText = ({ text }) => {
  const lines = String(text || "").split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderInline(line, i)}
          {i < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </>
  );
};

export default FormattedText;
