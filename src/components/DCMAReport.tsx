import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface DCMAMetric {
  value: number | string | Record<string, number>;
  threshold: string | number;
  status: 'pass' | 'fail' | 'warning' | 'info';
  description: string;
}

interface DCMAReportProps {
  metrics: Record<string, DCMAMetric>;
  projectName: string;
  timestamp: string;
  totalTasks: number;
}

export function DCMAReport({ metrics, projectName, timestamp, totalTasks }: DCMAReportProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<string[]>([]);

  const toggleMetric = (metricKey: string) => {
    setExpandedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(key => key !== metricKey)
        : [...prev, metricKey]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusCount = () => {
    return Object.values(metrics).reduce((acc, metric) => ({
      ...acc,
      [metric.status]: (acc[metric.status] || 0) + 1
    }), {} as Record<string, number>);
  };

  const formatValue = (value: number | string | Record<string, number>, metricKey: string) => {
    if (typeof value === 'number') {
      // For metrics that should show both count and percentage
      if (['missingLogic', 'highFloat', 'highDuration', 'criticalPath'].includes(metricKey)) {
        const percentage = ((value / totalTasks) * 100).toFixed(1);
        return `${value} (${percentage}%)`;
      }
      return value.toFixed(2);
    }
    if (typeof value === 'object' && value !== null) {
      // For link types, show percentages
      return Object.entries(value)
        .map(([key, val]) => `${key.toUpperCase()}: ${val}%`)
        .join(', ');
    }
    return value;
  };

  const statusCount = getStatusCount();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">DCMA 14-Point Assessment</h2>
            <p className="text-white/60 text-sm mt-1">
              {projectName} • {new Date(timestamp).toLocaleString()} • {totalTasks} tasks
            </p>
          </div>
          <div className="flex gap-4">
            {statusCount.pass && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">{statusCount.pass} Passed</span>
              </div>
            )}
            {statusCount.warning && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{statusCount.warning} Warnings</span>
              </div>
            )}
            {statusCount.fail && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">{statusCount.fail} Failed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className="p-4 hover:bg-white/5 transition-colors">
            <button
              onClick={() => toggleMetric(key)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(metric.status)}
                <span className="text-white font-medium">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-medium">{formatValue(metric.value, key)}</div>
                  <div className="text-white/60 text-sm">Threshold: {metric.threshold}</div>
                </div>
                {expandedMetrics.includes(key) ? (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white/40" />
                )}
              </div>
            </button>
            {expandedMetrics.includes(key) && (
              <div className="mt-4 pl-8 text-white/70 text-sm">
                {metric.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}