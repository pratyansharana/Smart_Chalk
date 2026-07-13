import { useEffect, useRef } from 'react';

/**
 * Renders text containing Markdown formatting and mathematical LaTeX formulas
 * delimited by inline ($formula$) or block ($$formula$$) delimiters.
 */
export function MathView({ text, className = '', as = 'div' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.renderMathInElement) {
      try {
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
      }
    }
  }, [text]);

  // Sanitize and restore JSON-escaped control characters inside LaTeX back into backslash commands
  let cleanedText = text || '';
  if (typeof cleanedText === 'string') {
    cleanedText = cleanedText
      .replace(/\x0c/g, '\\f') // Restore Form Feed (\x0c) to \f (e.g. \frac)
      .replace(/\x08/g, '\\b') // Restore Backspace (\x08) to \b (e.g. \begin)
      .replace(/\x0b/g, '\\v') // Restore Vertical Tab (\x0b) to \v (e.g. \vec)
      .replace(/\t/g, '\\t');  // Restore Horizontal Tab (\t) to \t (e.g. \times)
  }

  const formattedHtml = cleanedText
    ? cleanedText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code class='bg-white/5 px-1 py-0.5 rounded font-mono text-amber-300'>$1</code>")
        .replace(/\n\n/g, "</p><p class='mt-2.5'>")
        .replace(/\n/g, "<br />")
    : '';

  const Component = as;

  return (
    <Component
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
