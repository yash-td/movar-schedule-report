import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface ProjectChartProps {
  type: 'line' | 'bar' | 'pie' | 'radar';
  data: ChartData<any>;
  title: string;
}

const defaultOptions: ChartOptions<any> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    title: {
      display: true,
      color: 'rgba(255, 255, 255, 0.9)',
      font: {
        size: 16,
        weight: 'bold'
      },
      padding: {
        top: 10,
        bottom: 30
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 13
      },
      cornerRadius: 6,
      displayColors: true,
      callbacks: {
        afterBody: (context: any) => {
          const datasetIndex = context[0].datasetIndex;
          const index = context[0].dataIndex;
          const dataset = context[0].chart.data.datasets[datasetIndex];
          
          if (dataset.activities && dataset.activities[index]) {
            return dataset.activities[index].map((activity: any) => 
              `${activity.code}: ${activity.name}`
            );
          }
          
          if (dataset.milestones) {
            const milestone = dataset.milestones.find(
              (m: any) => m.month === context[0].chart.data.labels[index]
            );
            if (milestone) {
              return [`Milestone: ${milestone.milestone}`];
            }
          }
          return [];
        }
      }
    }
  },
  scales: {
    r: {
      ticks: {
        color: 'rgba(255, 255, 255, 0.9)',
        backdropColor: 'transparent'
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      angleLines: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      pointLabels: {
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 11
        }
      }
    },
    x: {
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: {
          size: 11
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false
      }
    },
    y: {
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: {
          size: 11
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false
      }
    }
  }
};

export function ProjectChart({ type, data, title }: ProjectChartProps) {
  const options = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        ...defaultOptions.plugins.title,
        text: title
      }
    }
  };

  const chartProps = {
    data,
    options
  };

  return (
    <div className="w-full h-[400px] bg-white/5 rounded-xl p-6 border border-white/10">
      {type === 'line' && <Line {...chartProps} />}
      {type === 'bar' && <Bar {...chartProps} />}
      {type === 'pie' && <Pie {...chartProps} />}
      {type === 'radar' && <Radar {...chartProps} />}
    </div>
  );
}