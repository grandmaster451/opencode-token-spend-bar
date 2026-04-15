/* eslint-disable @typescript-eslint/no-namespace */
import type {
  BoxProps,
  TextProps,
  SpanProps,
  InputProps,
  SelectProps,
  ScrollBoxProps,
  CodeProps,
  MarkdownProps,
  TextareaProps,
  AsciiFontProps,
  TabSelectProps,
  ExtendedIntrinsicElements,
  OpenTUIComponents,
} from '@opentui/solid/src/types/elements';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements extends ExtendedIntrinsicElements<OpenTUIComponents> {
      box: BoxProps;
      text: TextProps;
      span: SpanProps;
      input: InputProps;
      select: SelectProps;
      scrollbox: ScrollBoxProps;
      code: CodeProps;
      markdown: MarkdownProps;
      textarea: TextareaProps;
      ascii_font: AsciiFontProps;
      tab_select: TabSelectProps;
    }
  }
}
