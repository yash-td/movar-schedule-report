import { useEffect, useRef } from 'react';
import { FrappeGantt } from 'frappe-gantt-react';

interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string;
}

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const ganttRef = useRef<any>(null);

  return (
    <div className="w-full overflow-x-auto bg-white/5 rounded-xl p-6 border border-white/10">
      <FrappeGantt
        ref={ganttRef}
        tasks={tasks.map(task => ({
          ...task,
          dependencies: task.dependencies || ''
        }))}
        mode="Month"
        onClick={task => console.log(task)}
        onDateChange={(task, start, end) => console.log(task, start, end)}
        onProgressChange={(task, progress) => console.log(task, progress)}
        onTasksChange={tasks => console.log(tasks)}
        customPopupHtml={task => `
          <div class="details-container">
            <h5>${task.name}</h5>
            <p>Duration: ${task.start.toLocaleDateString()} - ${task.end.toLocaleDateString()}</p>
            <p>Progress: ${task.progress}%</p>
          </div>
        `}
      />
    </div>
  );
}