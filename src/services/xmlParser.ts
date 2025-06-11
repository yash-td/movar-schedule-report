import { DOMParser } from 'xmldom';

interface XMLTask {
  Id: string;
  Name: string;
  ObjectId: string;
  Type: string;
  Status: string;
  StartDate: string;
  FinishDate: string;
  Duration: string;
  TotalFloat: string;
  FreeFloat: string;
  IsCritical: string;
  Relationships?: XMLRelationship[];
  Resources?: XMLResource[];
}

interface XMLRelationship {
  PredecessorObjectId: string;
  Type: string;
  Lag: string;
}

interface XMLResource {
  ResourceObjectId: string;
  Units: string;
}

export async function parseXMLFile(file: File, onProgress?: (progress: number) => void): Promise<any> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Extract relationships
  const relationships = new Map<string, any[]>();
  const relationshipNodes = xmlDoc.getElementsByTagName('Relationship');

  for (let i = 0; i < relationshipNodes.length; i++) {
    const node = relationshipNodes[i];
    const taskId = getElementText(node, 'SuccessorObjectId');
    const rel = {
      predecessor_id: getElementText(node, 'PredecessorObjectId'),
      pred_type: convertRelationType(getElementText(node, 'Type')),
      lag_hr_cnt: parseInt(getElementText(node, 'Lag') || '0')
    };

    if (!relationships.has(taskId)) {
      relationships.set(taskId, []);
    }
    relationships.get(taskId)!.push(rel);
  }

  // Process activities with relationships
  const activities = parseActivities(xmlDoc).map(activity => ({
    task_id: activity.ObjectId,
    task_code: activity.Id,
    task_name: activity.Name,
    task_type: activity.Type,
    target_start_date: activity.StartDate,
    target_end_date: activity.FinishDate,
    target_drtn_hr_cnt: convertDurationToHours(activity.Duration),
    total_float_hr_cnt: convertDurationToHours(activity.TotalFloat),
    free_float_hr_cnt: convertDurationToHours(activity.FreeFloat),
    driving_path_flag: activity.IsCritical === 'true' ? 'Y' : 'N',
    status: activity.Status,
    relationships: relationships.get(activity.ObjectId) || []
  }));

  // Get project date range
  const startDates = activities.map(task => new Date(task.target_start_date));
  const endDates = activities.map(task => new Date(task.target_end_date));
    
  const minStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
  const maxEndDate = new Date(Math.max(...endDates.map(d => d.getTime())));

  // Create chart data
  const chartData = {
    timeline: processTimelineData(activities),
    progress: processProgressData(activities),
    taskTypes: processTaskTypeData(activities)
  };

  return {
    chartData,
    tableData: activities,
    projectDates: {
      minStartDate: minStartDate.toISOString().split('T')[0],
      maxEndDate: maxEndDate.toISOString().split('T')[0]
    }
  };
}

function parseActivities(doc: Document): XMLTask[] {
  const activities: XMLTask[] = [];
  const activityNodes = doc.getElementsByTagName('Activity');

  for (let i = 0; i < activityNodes.length; i++) {
    const node = activityNodes[i];
    activities.push({
      Id: getElementText(node, 'Id'),
      Name: getElementText(node, 'Name'),
      ObjectId: getElementText(node, 'ObjectId'),
      Type: getElementText(node, 'Type'),
      Status: getElementText(node, 'Status'),
      StartDate: getElementText(node, 'StartDate'),
      FinishDate: getElementText(node, 'FinishDate'),
      Duration: getElementText(node, 'PlannedDuration'),
      TotalFloat: getElementText(node, 'TotalFloat'),
      FreeFloat: getElementText(node, 'FreeFloat'),
      IsCritical: getElementText(node, 'IsCritical')
    });
  }

  return activities;
}

function getElementText(node: Element, tagName: string): string {
  return node.getElementsByTagName(tagName)[0]?.textContent || '';
}

function convertRelationType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'FinishToStart': 'PR_FS',
    'StartToStart': 'PR_SS',
    'FinishToFinish': 'PR_FF',
    'StartToFinish': 'PR_SF'
  };
  return typeMap[type] || 'PR_FS';
}

function convertDurationToHours(duration: string): string {
  if (!duration) return '0';
  // Assuming duration is in days, convert to hours
  return (parseFloat(duration) * 8).toString();
}

function processTimelineData(data: any[]) {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.target_start_date).getTime() - new Date(b.target_start_date).getTime()
  );

  const months = getUniqueMonths(sortedData);
  const { progressData, activities } = calculateCumulativeProgress(sortedData, months);

  return {
    labels: months,
    datasets: [{
      label: 'Progress',
      data: progressData,
      borderColor: '#118DFF',
      backgroundColor: 'rgba(17, 141, 255, 0.1)',
      tension: 0.4,
      fill: true,
      activities
    }]
  };
}

function getUniqueMonths(data: any[]): string[] {
  const months = new Set<string>();
  data.forEach(task => {
    const startDate = new Date(task.target_start_date);
    const endDate = new Date(task.target_end_date);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      months.add(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  });

  return Array.from(months).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
}

function calculateCumulativeProgress(data: any[], months: string[]): {
  progressData: number[],
  activities: { code: string; name: string; date: string }[][]
} {
  const totalTasks = data.length;
  const progressByMonth = months.map(month => {
    const monthDate = new Date(month);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    let completedTasks = 0;
    const monthActivities: { code: string; name: string; date: string }[] = [];

    data.forEach(task => {
      const taskStart = new Date(task.target_start_date);
      if (taskStart <= monthEnd) {
        completedTasks++;
        monthActivities.push({
          code: task.task_code,
          name: task.task_name,
          date: task.target_start_date
        });
      }
    });

    return {
      progress: (completedTasks / totalTasks) * 100,
      activities: monthActivities
    };
  });

  return {
    progressData: progressByMonth.map(m => Number(m.progress.toFixed(2))),
    activities: progressByMonth.map(m => m.activities)
  };
}

function processProgressData(data: any[]) {
  const statusCounts = {
    'Not Started': 0,
    'In Progress': 0,
    'Completed': 0
  };

  data.forEach(task => {
    statusCounts[task.status as keyof typeof statusCounts]++;
  });

  return {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: [
        'rgba(255, 159, 67, 0.8)',
        'rgba(17, 141, 255, 0.8)',
        'rgba(46, 213, 115, 0.8)'
      ]
    }]
  };
}

function processTaskTypeData(data: any[]) {
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
      ]
    }]
  };
}