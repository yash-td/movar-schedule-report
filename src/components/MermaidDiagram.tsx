import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, Copy, Check } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

// Initialize mermaid with optimized settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#118DFF',
    primaryTextColor: '#fff',
    primaryBorderColor: '#3BA1FF',
    lineColor: '#fff',
    secondaryColor: '#3BA1FF',
    tertiaryColor: '#0F172A'
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    useMaxWidth: true,
    diagramPadding: 8
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    mirrorActors: false,
    bottomMarginAdj: 1,
    useMaxWidth: true
  },
  gantt: {
    useMaxWidth: true
  },
  secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],
  securityLevel: 'strict',
  maxTextSize: 50000,
  fontFamily: 'system-ui, -apple-system, sans-serif'
});

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const renderAttemptRef = useRef<number>(0);
  const chartRef = useRef<string>(chart);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy diagram code:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const maxAttempts = 3;
    
    const renderDiagram = async () => {
      if (!containerRef.current || !isMounted) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Parse and validate the diagram
        await mermaid.parse(chart);
        
        // Generate a unique ID for this render
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(uniqueId, chart);

        if (containerRef.current && isMounted && chartRef.current === chart) {
          containerRef.current.innerHTML = svg;
          setIsLoading(false);
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        
        if (renderAttemptRef.current < maxAttempts) {
          renderAttemptRef.current++;
          setTimeout(renderDiagram, 500 * renderAttemptRef.current);
        } else if (isMounted) {
          setError('Failed to render diagram. Please check the syntax.');
          setIsLoading(false);
        }
      }
    };

    // Reset state for new chart
    if (chart !== chartRef.current) {
      setIsVisible(false);
      setIsLoading(true);
      setError(null);
      renderAttemptRef.current = 0;
      chartRef.current = chart;
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  return (
    <div className="relative my-4 bg-white/5 rounded-lg p-4 group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title={copied ? 'Copied!' : 'Copy diagram code'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-white/60" />
          )}
        </button>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-white/70">
              {renderAttemptRef.current > 0 
                ? `Retrying... (${renderAttemptRef.current}/3)`
                : 'Rendering diagram...'}
            </span>
          </div>
        </div>
      )}
      {error && (
        <div className="text-red-400 p-4 text-sm flex items-center gap-2">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}
      <div
        ref={containerRef}
        className={`overflow-x-auto transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}