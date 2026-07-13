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

  const formattedHtml = text
    ? text
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
