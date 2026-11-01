import React, { useMemo } from 'react';
import { Linking, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Markdown, { ASTNode, MarkdownIt, RenderRules } from 'react-native-markdown-display';

type SvgMathViewProps = { math: string; resizeMode?: 'cover' | 'contain'; style?: StyleProp<ViewStyle> };
type SvgMathTextProps = { value: string; style?: StyleProp<ViewStyle> };
declare const require: (moduleName: string) => {
  default: React.ComponentType<SvgMathViewProps>;
  MathText: React.ComponentType<SvgMathTextProps>;
};

function getSvgMathRenderers() {
  const runtime = globalThis as typeof globalThis & { PACKAGE_VERSION?: string };
  runtime.PACKAGE_VERSION ||= '3.2.1';
  return require('react-native-math-view/src/fallback');
}

function InlineMath({ value }: SvgMathTextProps) {
  const { MathText: ExpoMathText } = getSvgMathRenderers();
  return <ExpoMathText value={value} style={styles.inlineMath} />;
}

function DisplayMath({ math }: SvgMathViewProps) {
  const { default: ExpoMathView } = getSvgMathRenderers();
  return <ExpoMathView math={math} resizeMode="contain" style={styles.blockMath} />;
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
  math_inline: (node: ASTNode) => <InlineMath key={node.key} value={`$${node.content}$`} />,
  math_block: (node: ASTNode) => <DisplayMath key={node.key} math={node.content} />,
};

interface RichContentProps {
  content?: string | null;
}

export function RichContent({ content }: RichContentProps) {
  const normalized = useMemo(() => (content || '')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
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
  inlineMath: { minHeight: 28, minWidth: 22, justifyContent: 'center' },
  blockMath: { minHeight: 44, maxWidth: '100%', alignSelf: 'stretch' },
});