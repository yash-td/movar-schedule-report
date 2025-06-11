import Papa from 'papaparse';

interface Task {
  task_id: string;
  task_name: string;
  task_code: string;
  target_start_date: string;
  target_end_date: string;
  target_drtn_hr_cnt: string;
  total_float_hr_cnt: string;
  free_float_hr_cnt: string;
  driving_path_flag: string;
  status: string;
  task_type: string;
  resources?: any[];
  relationships?: any[];
}

interface TaskPred {
  task_id: string;
  pred_task_id: string;
  pred_type: string;
  lag_hr_cnt: number;
}

interface ParsedData {
  chartData: any;
  tableData: any[];
  projectDates: {
    minStartDate: string;
    maxEndDate: string;
  };
}

export async function parseXERFile(file: File, onProgress?: (progress: number) => void, isBaseline: boolean = false): Promise<ParsedData> {
  const text = await file.text();
  const lines = text.split('\n');
  
  const tables: { [key: string]: any[] } = {};
  let currentTable = '';
  let headers: string[] = [];
  
  // First pass - extract all tables including TASKPRED
  for (const line of lines) {
    if (line.startsWith('%T')) {
      currentTable = line.split('\t')[1]?.trim() || '';
      tables[currentTable] = [];
    } else if (line.startsWith('%F')) {
      headers = line.split('\t').slice(1).map(h => h.trim());
    } else if (line.startsWith('%R')) {
      const values = line.split('\t').slice(1);
      if (currentTable && headers.length) {
        const row = Object.fromEntries(
          headers.map((header, i) => [header, values[i]?.trim()])
        );
        tables[currentTable].push(row);
      }
    }
  }

  // Extract relationships from TASKPRED table
  const relationships = new Map<string, any[]>();
  const taskPreds = tables['TASKPRED'] || [];
  
  taskPreds.forEach(pred => {
    const rel = {
      predecessor_id: pred.pred_task_id,
      pred_type: pred.pred_type || 'PR_FS',
      lag_hr_cnt: parseInt(pred.lag_hr_cnt || '0')
    };
    
    if (!relationships.has(pred.task_id)) {
      relationships.set(pred.task_id, []);
    }
    relationships.get(pred.task_id)!.push(rel);
  });

  // Process tasks with relationships
  const processedTasks = (tables['TASK'] || []).map(task => ({
    ...task,
    relationships: relationships.get(task.task_id) || [],
    resources: (tables['TASKRSRC'] || [])
      .filter(r => r.task_id === task.task_id)
  }));

  // Get project date range
  const startDates = processedTasks.map(task => new Date(task.target_start_date));
  const endDates = processedTasks.map(task => new Date(task.target_end_date));
  
  const minStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
  const maxEndDate = new Date(Math.max(...endDates.map(d => d.getTime())));

  // Process chart data
  const chartData = {
    timeline: processTimelineData(processedTasks, isBaseline),
    progress: processProgressData(processedTasks),
    taskTypes: processTaskTypeData(processedTasks)
  };

  if (onProgress) onProgress(100);

  return {
    chartData,
    tableData: processedTasks,
    projectDates: {
      minStartDate: minStartDate.toISOString().split('T')[0],
      maxEndDate: maxEndDate.toISOString().split('T')[0]
    }
  };
}

function processTimelineData(data: Task[], isBaseline: boolean) {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.target_end_date).getTime() - new Date(b.target_end_date).getTime()
  );

  const taskCodes = new Set(sortedData.map(task => task.task_code));
  const totalTasks = taskCodes.size;

  const dates = sortedData.map(task => new Date(task.target_end_date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const months: string[] = [];
  let currentDate = new Date(minDate);
  while (currentDate <= maxDate) {
    months.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const monthlyCompletedTasks = new Map<string, Set<string>>();
  months.forEach(month => monthlyCompletedTasks.set(month, new Set()));

  sortedData.forEach(task => {
    const endDate = new Date(task.target_end_date);
    const monthKey = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    let currentMonthIndex = months.indexOf(monthKey);
    if (currentMonthIndex >= 0) {
      for (let i = currentMonthIndex; i < months.length; i++) {
        monthlyCompletedTasks.get(months[i])?.add(task.task_code);
      }
    }
  });

  const cumulativeData = months.map(month => {
    const completedTaskCodes = monthlyCompletedTasks.get(month) || new Set();
    const percentage = (completedTaskCodes.size / totalTasks) * 100;

    return {
      total: Number(percentage.toFixed(2)),
      tasks: sortedData
        .filter(task => {
          const taskDate = new Date(task.target_end_date);
          const monthDate = new Date(month + ' 1');
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          return taskDate >= monthDate && taskDate <= monthEnd;
        })
        .map(task => ({
          code: task.task_code,
          name: task.task_name,
          date: task.target_end_date
        }))
    };
  });

  return {
    labels: months,
    datasets: [{
      label: isBaseline ? 'Baseline Progress' : 'Current Progress',
      data: cumulativeData.map(d => d.total),
      borderColor: isBaseline ? '#FFD700' : '#118DFF',
      backgroundColor: isBaseline ? 'rgba(255, 215, 0, 0.1)' : 'rgba(17, 141, 255, 0.1)',
      tension: 0.4,
      fill: true,
      activities: cumulativeData.map(d => d.tasks)
    }]
  };
}

function processProgressData(data: Task[]) {
  const startDates = data.map(task => new Date(task.target_start_date));
  const endDates = data.map(task => new Date(task.target_end_date));
  
  const minStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
  const maxEndDate = new Date(Math.max(...endDates.map(d => d.getTime())));
  
  const dataDate = new Date(Math.min(new Date().getTime(), maxEndDate.getTime()));
  
  const statusCategories = {
    'Not Started': data.filter(task => new Date(task.target_start_date) > dataDate).length,
    'In Progress': data.filter(task => {
      const startDate = new Date(task.target_start_date);
      const endDate = new Date(task.target_end_date);
      return startDate <= dataDate && endDate >= dataDate;
    }).length,
    'Completed': data.filter(task => new Date(task.target_end_date) < dataDate).length
  };
  
  return {
    labels: Object.keys(statusCategories),
    datasets: [{
      data: Object.values(statusCategories),
      backgroundColor: [
        'rgba(255, 159, 67, 0.8)',
        'rgba(17, 141, 255, 0.8)',
        'rgba(46, 213, 115, 0.8)'
      ]
    }]
  };
}

function processTaskTypeData(data: Task[]) {
  const taskTypes = data.reduce((acc: { [key: string]: number }, task) => {
    const type = task.task_type || 'Undefined';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(taskTypes),
    datasets: [{
      data: Object.values(taskTypes),
      backgroundColor: [
        'rgba(17, 141, 255, 0.8)',
        'rgba(59, 161, 255, 0.8)',
        'rgba(100, 181, 255, 0.8)',
        'rgba(255, 107, 107, 0.8)',
        'rgba(255, 159, 67, 0.8)',
        'rgba(46, 213, 115, 0.8)',
        'rgba(165, 94, 234, 0.8)',
        'rgba(45, 152, 218, 0.8)'
      ],
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 2
    }]
  };
}