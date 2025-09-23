interface Task {
  task_id: string;
  task_name: string;
  task_code: string;
  // Planned dates
  target_start_date: string;
  target_end_date: string;
  target_drtn_hr_cnt: string;
  // Actual dates
  act_start_date?: string;
  act_end_date?: string;
  // Float values
  total_float_hr_cnt: string;
  free_float_hr_cnt: string;
  // Critical path
  driving_path_flag: string;
  // Status and type
  status_code?: string;
  status?: string;
  task_type: string;
  // Constraints
  cstr_type?: string;
  cstr_type2?: string;
  cstr_date?: string;
  cstr_date2?: string;
  // Early/Late dates
  early_start_date?: string;
  early_end_date?: string;
  late_start_date?: string;
  late_end_date?: string;
  // Remaining values
  remain_drtn_hr_cnt?: string;
  restart_date?: string;
  reend_date?: string;
  // Work quantities
  target_work_qty?: string;
  act_work_qty?: string;
  remain_work_qty?: string;
  // Percent complete
  phys_complete_pct?: string;
  complete_pct_type?: string;
  // Expected dates
  expect_end_date?: string;
  // Duration type
  duration_type?: string;
  // Calendar
  clndr_id?: string;
  // WBS
  wbs_id: string;
  // Project
  proj_id: string;
  // Relationships and resources
  relationships?: TaskRelationship[];
  resources?: TaskResource[];
}

interface TaskRelationship {
  pred_task_id: string;
  task_id: string;
  pred_type: string;
  lag_hr_cnt: string;
  comments?: string;
}

interface TaskResource {
  task_id: string;
  rsrc_id: string;
  target_qty: string;
  remain_qty: string;
  act_reg_qty?: string;
  cost_per_qty?: string;
  target_cost?: string;
  remain_cost?: string;
  act_reg_cost?: string;
}

interface ProjectInfo {
  projectId?: string;
  shortName?: string;
  planStartDate?: string;
  planFinishDate?: string;
  forecastFinishDate?: string;
  dataDate?: string;
  baselineProjectId?: string;
}

interface ParsedData {
  chartData: any;
  tableData: any[];
  projectDates: {
    minStartDate: string;
    maxEndDate: string;
  };
  projectInfo?: ProjectInfo;
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
  const relationships = new Map<string, TaskRelationship[]>();
  const taskPreds = tables['TASKPRED'] || [];

  taskPreds.forEach(pred => {
    const rel: TaskRelationship = {
      pred_task_id: pred.pred_task_id,
      task_id: pred.task_id,
      pred_type: pred.pred_type || 'PR_FS',
      lag_hr_cnt: pred.lag_hr_cnt || '0',
      comments: pred.comments
    };

    if (!relationships.has(pred.task_id)) {
      relationships.set(pred.task_id, []);
    }
    relationships.get(pred.task_id)!.push(rel);
  });

  // Extract resources from TASKRSRC table
  const resources = new Map<string, TaskResource[]>();
  const taskResources = tables['TASKRSRC'] || [];

  taskResources.forEach(rsrc => {
    const resource: TaskResource = {
      task_id: rsrc.task_id,
      rsrc_id: rsrc.rsrc_id,
      target_qty: rsrc.target_qty || '0',
      remain_qty: rsrc.remain_qty || '0',
      act_reg_qty: rsrc.act_reg_qty,
      cost_per_qty: rsrc.cost_per_qty,
      target_cost: rsrc.target_cost,
      remain_cost: rsrc.remain_cost,
      act_reg_cost: rsrc.act_reg_cost
    };

    if (!resources.has(rsrc.task_id)) {
      resources.set(rsrc.task_id, []);
    }
    resources.get(rsrc.task_id)!.push(resource);
  });

  // Process tasks with relationships and resources
  const processedTasks = (tables['TASK'] || []).map(task => ({
    ...task,
    relationships: relationships.get(task.task_id) || [],
    resources: resources.get(task.task_id) || []
  }));

  // Get project date range
  const startTimestamps = processedTasks
    .map(task => new Date(task.target_start_date).getTime())
    .filter(time => Number.isFinite(time));
  const endTimestamps = processedTasks
    .map(task => new Date(task.target_end_date).getTime())
    .filter(time => Number.isFinite(time));

  const fallbackTimestamp = Date.now();
  const minStartDate = new Date(startTimestamps.length ? Math.min(...startTimestamps) : fallbackTimestamp);
  const maxEndDate = new Date(endTimestamps.length ? Math.max(...endTimestamps) : fallbackTimestamp);

  const projectInfo = buildProjectInfo(tables['PROJECT']?.[0]);

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
    },
    projectInfo
  };
}

function buildProjectInfo(projectRow?: Record<string, string>): ProjectInfo | undefined {
  if (!projectRow) {
    return undefined;
  }

  const info: ProjectInfo = {
    projectId: projectRow.proj_id || undefined,
    shortName: projectRow.proj_short_name || undefined,
    planStartDate: projectRow.plan_start_date || undefined,
    planFinishDate: projectRow.plan_end_date || undefined,
    forecastFinishDate: projectRow.scd_end_date || undefined,
    dataDate: projectRow.last_schedule_date || projectRow.next_data_date || projectRow.last_recalc_date || undefined,
    baselineProjectId: projectRow.sum_base_proj_id || undefined,
  };

  return info;
}

function processTimelineData(data: Task[], isBaseline: boolean) {
  if (data.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

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
  if (data.length === 0) {
    return {
      labels: ['Not Started', 'In Progress', 'Completed'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          'rgba(255, 159, 67, 0.8)',
          'rgba(17, 141, 255, 0.8)',
          'rgba(46, 213, 115, 0.8)'
        ]
      }]
    };
  }

  const endTimestamps = data
    .map(task => new Date(task.target_end_date).getTime())
    .filter(time => Number.isFinite(time));
  const latestEnd = endTimestamps.length ? Math.max(...endTimestamps) : Date.now();
  const dataDate = new Date(Math.min(Date.now(), latestEnd));

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
