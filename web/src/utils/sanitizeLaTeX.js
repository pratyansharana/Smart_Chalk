/**
 * Pre-processor to convert any rogue \( \) or \[ \] delimiters to $ and $$
 */
export const sanitizeLaTeX = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\\\(|\\\)/g, '$')     // Converts \( and \) to $
    .replace(/\\\[|\\\]/g, '$$');   // Converts \[ and \] to $$
};
