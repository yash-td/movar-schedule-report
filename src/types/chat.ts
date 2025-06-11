export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MessageWithChart extends Message {
  chart?: JSX.Element;
}