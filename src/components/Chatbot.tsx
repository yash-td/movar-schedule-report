import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ProjectChart } from './ProjectChart';
import { constructionProjectData } from '../data/projectData';
import { MermaidDiagram } from './MermaidDiagram';
import { chatService } from '../services/chatService';
import { MessageWithChart } from '../types/chat';

interface ChatbotProps {
  onClose: () => void;
  initialMessage?: string;
}

export function Chatbot({ onClose, initialMessage }: ChatbotProps) {
  const [messages, setMessages] = useState<MessageWithChart[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMessageProcessed = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderChart = (type: string, dataKey: keyof typeof constructionProjectData) => {
    const chartType = type as 'line' | 'bar' | 'pie' | 'radar';
    const chartData = constructionProjectData[dataKey];
    return chartData ? <ProjectChart type={chartType} data={chartData} title={dataKey} /> : null;
  };

  const processChartCommand = (content: string, isVisualRequest: boolean) => {
    let processedContent = content;
    let chart: JSX.Element | undefined;

    if (isVisualRequest && content.includes('```chart')) {
      const chartMatch = content.match(/```chart\n(.*?)\n```/s);
      if (chartMatch) {
        const chartConfig = chartMatch[1].split(',').map(s => s.trim());
        const [type, dataKey] = chartConfig;
        chart = renderChart(type, dataKey as keyof typeof constructionProjectData);
        processedContent = content.replace(/```chart\n.*?\n```/s, '');
      }
    }

    return { content: processedContent, chart };
  };

  useEffect(() => {
    if (initialMessage && !initialMessageProcessed.current) {
      handleSubmitMessage(initialMessage);
      initialMessageProcessed.current = true;
    }
  }, [initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMarkdown = useCallback((content: string) => {
    const components = {
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const value = String(children).replace(/\n$/, '');

        if (!inline && match?.[1] === 'mermaid') {
          return <MermaidDiagram chart={value} />;
        }

        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    };

    return (
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    );
  }, []);

  async function handleSubmitMessage(message: string) {
    if (!message.trim() || isLoading) return;

    const isVisualRequest = message.toLowerCase().trim().startsWith('visual');
    const userMessage = { role: 'user' as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage([...messages, userMessage]);
      const { content, chart } = processChartCommand(response, isVisualRequest);
      
      setMessages((prev) => [...prev, { 
        role: 'assistant',
        content,
        chart
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSubmitMessage(input);
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="h-full max-w-4xl mx-auto flex flex-col">
        <div className="bg-primary/10 backdrop-blur-sm p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Compass - Movar AI Assistant</h3>
              <p className="text-xs text-white/60">Your AI PMO Consultant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-white/40 mt-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm">
                Hello! I'm Compass, Movar's AI PMO consultant. I can help you analyze project data and create visualizations. Start your message with "visual" to see project charts!
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-white prose-invert'
                    : 'bg-white/10 text-white/90'
                } shadow-lg prose prose-sm`}
              >
                {renderMarkdown(message.content)}
                {message.chart && (
                  <div className="mt-4">
                    {message.chart}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white/90 rounded-2xl p-4 shadow-lg flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about Movar's services or start with 'visual' for charts..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white rounded-xl p-2.5 shadow-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}