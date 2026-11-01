import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TextStyle, View } from 'react-native';
import Markdown, { ASTNode, MarkdownIt, RenderRules } from 'react-native-markdown-display';
import { WebView } from 'react-native-webview';

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function restoreLatexEscapes(value: string) {
  return value
    .replace(/\x0c/g, '\\f')
    .replace(/\x08/g, '\\b')
    .replace(/\x0b/g, '\\v')
    .replace(/\t/g, '\\t');
}

const markdownit = MarkdownIt({ html: false, typographer: true });
markdownit.disable(['image']);

markdownit.inline.ruler.before('escape', 'math_inline', (state: any, silent: boolean) => {
  const start = state.pos;
  if (state.src[start] !== '$' || state.src[start + 1] === '$') return false;

  const end = state.src.indexOf('$', start + 1);
  if (end < 0 || end === start + 1 || state.src[end - 1] === ' ') return false;

  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.content = state.src.slice(start + 1, end);
  }
  state.pos = end + 1;
  return true;
});

markdownit.block.ruler.before('fence', 'math_block', (state: any, startLine: number, endLine: number, silent: boolean) => {
  const lineStart = state.bMarks[startLine] + state.tShift[startLine];
  const firstLine = state.src.slice(lineStart, state.eMarks[startLine]);
  if (!firstLine.startsWith('$$')) return false;

  const sameLineEnd = firstLine.indexOf('$$', 2);
  let content = '';
  let nextLine = startLine + 1;

  if (sameLineEnd >= 0) {
    content = firstLine.slice(2, sameLineEnd);
  } else {
    const lines: string[] = [];
    let closed = false;
    for (let line = startLine + 1; line < endLine; line += 1) {
      const currentStart = state.bMarks[line] + state.tShift[line];
      const currentLine = state.src.slice(currentStart, state.eMarks[line]);
      const end = currentLine.indexOf('$$');
      if (end >= 0) {
        lines.push(currentLine.slice(0, end));
        nextLine = line + 1;
        closed = true;
        break;
      }
      lines.push(currentLine);
    }
    if (!closed) return false;
    content = lines.join('\n');
  }

  if (!silent) {
    const token = state.push('math_block', 'math', 0);
    token.block = true;
    token.content = content.trim();
    token.map = [startLine, nextLine];
  }
  state.line = nextLine;
  return true;
});

markdownit.renderer.rules.math_inline = (tokens, index) => `<span data-math="inline">${escapeHtml(restoreLatexEscapes(tokens[index].content))}</span>`;
markdownit.renderer.rules.math_block = (tokens, index) => `<div data-math="display">${escapeHtml(restoreLatexEscapes(tokens[index].content))}</div>`;

const renderRules: RenderRules = {
  inline: (node, children) => <View key={node.key} style={styles.inlineFlow}>{children}</View>,
  textgroup: (node, children) => <View key={node.key} style={styles.inlineFlow}>{children}</View>,
  strong: (node, children) => <View key={node.key} style={styles.inlineFlow}>{children}</View>,
  em: (node, children) => <View key={node.key} style={styles.inlineFlow}>{children}</View>,
  text: (node, children, parents) => {
    const textStyle: TextStyle[] = [markdownStyles.text];
    if (parents.some((parent) => parent.type === 'strong')) textStyle.push(markdownStyles.strong);
    if (parents.some((parent) => parent.type === 'em')) textStyle.push(markdownStyles.em);
    return <Text key={node.key} style={textStyle}>{node.content || children}</Text>;
  },
  math_inline: (node: ASTNode) => <Text key={node.key} style={styles.inlineMathText}>{`$${node.content}$`}</Text>,
  math_block: (node: ASTNode) => <Text key={node.key} style={styles.blockMathText}>{node.content}</Text>,
};

interface RichContentProps {
  content?: string | null;
}

export function RichContent({ content }: RichContentProps) {
  const normalized = useMemo(() => (content || '')
    .replace(/\\\[/g, () => '$$')
    .replace(/\\\]/g, () => '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$'), [content]);

  if (!normalized.trim()) return null;

  return (
    <Markdown
      markdownit={markdownit}
      rules={renderRules}
      style={markdownStyles}
      onLinkPress={(url) => {
        if (!/^https?:\/\//i.test(url)) return false;
        void Linking.openURL(url);
        return false;
      }}
    >
      {normalized}
    </Markdown>
  );
}

export function QuestionPaperContent({ content }: RichContentProps) {
  const [height, setHeight] = useState(120);
  const normalized = useMemo(() => (content || '')
    .replace(/\\\[/g, () => '$$')
    .replace(/\\\]/g, () => '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$'), [content]);
  const htmlContent = useMemo(() => markdownit.render(normalized), [normalized]);
  const html = useMemo(() => `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css"><style>
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:transparent}body{padding:2px;color:#526579;font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-wrap:anywhere}
    p{margin:0 0 10px}h1,h2,h3,h4{color:#24374f;line-height:1.35;margin:16px 0 9px}h1{font-size:20px;border-bottom:1px solid #dfe9f2;padding-bottom:8px}h2{font-size:16px}h3,h4{font-size:14px}ol,ul{padding-left:24px;margin:8px 0}li{padding-left:4px;margin:7px 0}ol>li{padding:10px 12px;background:#fff;border:1px solid #e3edf5;border-radius:10px}li::marker{color:#2d66c8;font-weight:700}strong{color:#26394d;font-weight:800}em{font-style:italic}blockquote{margin:8px 0;padding:8px 12px;border-left:3px solid #2d66c8;background:#f2f8ff}code,pre{font-family:monospace;background:#eef5fb;border-radius:5px;padding:2px 4px}pre{padding:10px;overflow-x:auto}hr{border:0;border-top:1px solid #dfe9f2;margin:14px 0}a{color:#2d66c8}
    [data-math="inline"]{white-space:nowrap}[data-math="display"]{overflow-x:auto;margin:10px 0}.katex-display{margin:0!important;overflow-x:auto;overflow-y:hidden}
  </style></head><body>${htmlContent}<script src="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js"></script><script>
    function measure(){requestAnimationFrame(function(){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(document.documentElement.scrollHeight));});}
    function renderMath(){if(window.katex){document.querySelectorAll('[data-math]:not([data-rendered="true"])').forEach(function(node){var display=node.getAttribute('data-math')==='display';node.setAttribute('data-rendered','true');try{katex.render(node.textContent,node,{displayMode:display,throwOnError:false,strict:'ignore'});}catch(e){node.removeAttribute('data-rendered');}});}measure();}
    window.addEventListener('load',renderMath,{once:true});setTimeout(renderMath,1500);
  </script></body></html>`, [htmlContent]);
  const source = useMemo(() => ({ html }), [html]);

  if (!normalized.trim()) return null;

  return (
    <WebView
      originWhitelist={['*']}
      source={source}
      javaScriptEnabled
      scrollEnabled={false}
      nestedScrollEnabled
      style={{ width: '100%', height, backgroundColor: 'transparent' }}
      onMessage={(event) => {
        const nextHeight = Number(event.nativeEvent.data);
        if (Number.isFinite(nextHeight) && nextHeight > 0) setHeight(nextHeight + 8);
      }}
    />
  );
}

const markdownStyles: Record<string, TextStyle> = {
  body: { color: '#526579', fontSize: 13, lineHeight: 20 },
  text: { color: '#526579', fontSize: 13, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 8 },
  heading1: { color: '#26394D', fontSize: 20, fontWeight: '800', marginTop: 9, marginBottom: 7 },
  heading2: { color: '#26394D', fontSize: 17, fontWeight: '800', marginTop: 8, marginBottom: 6 },
  heading3: { color: '#334B62', fontSize: 15, fontWeight: '700', marginTop: 7, marginBottom: 5 },
  strong: { color: '#26394D', fontWeight: '800' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  code_inline: { color: '#2D66C8', backgroundColor: '#EEF5FB', fontFamily: 'monospace' },
  code_block: { color: '#41576C', backgroundColor: '#F3F8FB', padding: 10, borderRadius: 8 },
  fence: { color: '#41576C', backgroundColor: '#F3F8FB', padding: 10, borderRadius: 8 },
  hr: { backgroundColor: '#DDE8F0', height: 1, marginVertical: 10 },
  link: { color: '#2D66C8' },
};

const styles = StyleSheet.create({
  inlineFlow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  inlineMathText: { color: '#2D66C8', fontStyle: 'italic' },
  blockMathText: { color: '#2D66C8', fontStyle: 'italic', marginVertical: 6 },
});