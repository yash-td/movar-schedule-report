export class DCMAAnalyzer {
  private data: any[];
  private baselineData?: any[];
  private taskPred: any[] = [];
  private taskRsrc: any[] = [];

  constructor(data: any[], baselineData?: any[]) {
    this.data = data;
    this.baselineData = baselineData;
    this.taskPred = this.extractTaskPred();
    this.taskRsrc = this.extractTaskRsrc();
  }

  private isIncomplete(task: any): boolean {
    const status = (task.status || '').toLowerCase();
    return !['complete', 'completed', 'tk_complete'].includes(status);
  }

  private getTaskDuration(task: any): number {
    const durationHours = parseFloat(task.target_drtn_hr_cnt || '0');
    return durationHours / 8; // Convert to working days (8-hour days)
  }

  private getTaskFloat(task: any): number {
    const floatHours = parseFloat(task.total_float_hr_cnt || '0');
    return floatHours / 8; // Convert to working days (8-hour days)
  }

  private isCritical(task: any): boolean {
    return task.driving_path_flag === 'Y';
  }

  private extractTaskPred(): any[] {
    const relationships: any[] = [];
    
    this.data.forEach(task => {
      if (task.relationships) {
        task.relationships.forEach((rel: any) => {
          relationships.push({
            task_id: task.task_id,
            pred_task_id: rel.predecessor_id,
            pred_type: rel.pred_type || 'PR_FS',
            lag_hr_cnt: parseInt(rel.lag_hr_cnt || '0')
          });
        });
      }
    });

    return relationships;
  }

  private extractTaskRsrc(): any[] {
    return this.data.filter(task => task.resources && task.resources.length > 0);
  }

  private calculateLogicIndex(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task));
    
    if (incompleteTasks.length === 0) {
      return {
        value: 100,
        threshold: 90,
        status: 'pass',
        description: 'No incomplete tasks to analyze'
      };
    }

    let missingLogicCount = 0;
    incompleteTasks.forEach(task => {
      const hasPred = this.taskPred.some(rel => rel.task_id === task.task_id);
      const hasSucc = this.taskPred.some(rel => rel.pred_task_id === task.task_id);
      
      if (!hasPred || !hasSucc) {
        missingLogicCount++;
      }
    });

    const logicIndex = ((incompleteTasks.length - missingLogicCount) / incompleteTasks.length) * 100;

    return {
      value: Math.round(logicIndex),
      threshold: 90,
      status: logicIndex >= 90 ? 'pass' : logicIndex >= 80 ? 'warning' : 'fail',
      description: `${missingLogicCount} out of ${incompleteTasks.length} tasks missing logic`
    };
  }

  private calculateMissingLogic(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task));
    
    const predCount = new Map<string, number>();
    const succCount = new Map<string, number>();

    this.taskPred.forEach(rel => {
      predCount.set(rel.task_id, (predCount.get(rel.task_id) || 0) + 1);
      succCount.set(rel.pred_task_id, (succCount.get(rel.pred_task_id) || 0) + 1);
    });

    const tasksWithoutLogic = incompleteTasks.filter(task => 
      !predCount.has(task.task_id) || !succCount.has(task.task_id)
    ).length;

    return {
      value: tasksWithoutLogic,
      threshold: '5% of total tasks',
      status: (tasksWithoutLogic / incompleteTasks.length * 100) <= 5 ? 'pass' : 'fail',
      description: 'Number of tasks missing predecessors or successors'
    };
  }

  private calculateHighFloat(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task));
    const highFloatTasks = incompleteTasks.filter(task => this.getTaskFloat(task) > 44).length;

    return {
      value: highFloatTasks,
      threshold: '5% of total tasks',
      status: (highFloatTasks / incompleteTasks.length * 100) <= 5 ? 'pass' : 'warning',
      description: 'Tasks with total float greater than 44 working days'
    };
  }

  private calculateNegativeFloat(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task));
    const negativeFloatTasks = incompleteTasks.filter(task => this.getTaskFloat(task) < 0).length;

    return {
      value: negativeFloatTasks,
      threshold: '0',
      status: negativeFloatTasks === 0 ? 'pass' : 'fail',
      description: 'Tasks with negative float'
    };
  }

  private calculateHighDuration(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task));
    const highDurationTasks = incompleteTasks.filter(task => this.getTaskDuration(task) > 44).length;

    return {
      value: highDurationTasks,
      threshold: '5% of total tasks',
      status: (highDurationTasks / incompleteTasks.length * 100) <= 5 ? 'pass' : 'warning',
      description: 'Tasks with duration greater than 44 working days'
    };
  }

  private calculateLinkTypes(): any {
    const validLinks = this.taskPred.filter(link => link.pred_type);
    const totalLinks = validLinks.length;
    
    if (totalLinks === 0) {
      return {
        value: { fs: 0, ss: 0, ff: 0, sf: 0 },
        threshold: 'FS > 90%',
        status: 'fail',
        description: 'No relationship types found'
      };
    }

    const counts = {
      fs: validLinks.filter(link => link.pred_type === 'PR_FS').length,
      ss: validLinks.filter(link => link.pred_type === 'PR_SS').length,
      ff: validLinks.filter(link => link.pred_type === 'PR_FF').length,
      sf: validLinks.filter(link => link.pred_type === 'PR_SF').length
    };

    const percentages = {
      fs: (counts.fs / totalLinks * 100).toFixed(1),
      ss: (counts.ss / totalLinks * 100).toFixed(1),
      ff: (counts.ff / totalLinks * 100).toFixed(1),
      sf: (counts.sf / totalLinks * 100).toFixed(1)
    };

    return {
      value: percentages,
      threshold: 'FS > 90%, SS < 5%, FF < 5%, SF = 0%',
      status: counts.fs / totalLinks >= 0.9 ? 'pass' : 'warning',
      description: `Distribution of ${totalLinks} relationship types`
    };
  }

  private calculateInvalidDates(): any {
    const invalidDateTasks = this.data.filter(task => {
      const start = new Date(task.target_start_date);
      const end = new Date(task.target_end_date);
      return isNaN(start.getTime()) || isNaN(end.getTime()) || start > end;
    }).length;

    return {
      value: invalidDateTasks,
      threshold: '0',
      status: invalidDateTasks === 0 ? 'pass' : 'fail',
      description: 'Tasks with invalid dates or start date after end date'
    };
  }

  private calculateResourcesLoaded(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task)).length;
    const resourcedTasks = this.taskRsrc.filter(task => this.isIncomplete(task)).length;
    const percentage = (resourcedTasks / incompleteTasks) * 100;

    return {
      value: Math.round(percentage),
      threshold: '95%',
      status: percentage >= 95 ? 'pass' : percentage >= 85 ? 'warning' : 'fail',
      description: 'Percentage of tasks with resources assigned'
    };
  }

  private calculateMissedTasks(): any {
    const dataDate = new Date();
    const missedTasks = this.data.filter(task =>
      this.isIncomplete(task) && new Date(task.target_end_date) < dataDate
    ).length;

    return {
      value: missedTasks,
      threshold: '0',
      status: missedTasks === 0 ? 'pass' : 'fail',
      description: 'Tasks with end date in the past but not completed'
    };
  }

  private calculateCriticalPath(): any {
    const incompleteTasks = this.data.filter(task => this.isIncomplete(task));
    const criticalTasks = incompleteTasks.filter(task => this.isCritical(task)).length;

    return {
      value: criticalTasks,
      threshold: '5% of total tasks',
      status: (criticalTasks / incompleteTasks.length * 100) >= 5 ? 'pass' : 'warning',
      description: 'Number of tasks on the critical path'
    };
  }

  private calculateCriticalPathTest(): any {
    const criticalTasks = this.data
      .filter(task => this.isCritical(task))
      .sort((a, b) => new Date(a.target_start_date) - new Date(b.target_start_date));

    let hasGaps = false;
    for (let i = 1; i < criticalTasks.length; i++) {
      const prevTask = criticalTasks[i - 1];
      const currentTask = criticalTasks[i];
      
      const prevEnd = new Date(prevTask.target_end_date);
      const currentStart = new Date(currentTask.target_start_date);
      
      if (currentStart > prevEnd) {
        hasGaps = true;
        break;
      }
    }

    return {
      value: hasGaps ? 'Failed' : 'Passed',
      threshold: 'No gaps in critical path',
      status: !hasGaps ? 'pass' : 'fail',
      description: 'Continuous logic through the critical path'
    };
  }

  private calculateCriticalPathLength(): any {
    const criticalTasks = this.data.filter(task => this.isCritical(task));
    const totalDuration = criticalTasks.reduce((sum, task) => sum + this.getTaskDuration(task), 0);

    return {
      value: Math.round(totalDuration),
      threshold: 'Project dependent',
      status: 'info',
      description: 'Length of the critical path in working days'
    };
  }

  private calculateCriticalPathLengthIndex(): any {
    const cpLength = this.calculateCriticalPathLength().value;
    const endDates = this.data.map(task => new Date(task.target_end_date));
    const projectEndDate = new Date(Math.max(...endDates));
    
    const now = new Date();
    const remainingDuration = Math.ceil(
      (projectEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const cpli = cpLength / Math.max(remainingDuration, 1);

    return {
      value: cpli.toFixed(2),
      threshold: '0.95',
      status: cpli >= 0.95 ? 'pass' : cpli >= 0.85 ? 'warning' : 'fail',
      description: 'Critical Path Length Index (CPLI)'
    };
  }

  private calculateBaselineExecution(): any {
    if (!this.baselineData) {
      return {
        value: 'N/A',
        threshold: 'Project dependent',
        status: 'info',
        description: 'Baseline schedule not provided'
      };
    }

    const completedTasks = this.data.filter(task => !this.isIncomplete(task)).length;
    const totalTasks = this.data.length;
    const percentage = (completedTasks / totalTasks) * 100;

    return {
      value: `${percentage.toFixed(1)}%`,
      threshold: 'Project dependent',
      status: 'info',
      description: 'Percentage of tasks completed against baseline'
    };
  }

  private calculateBaselineExecutionIndex(): any {
    if (!this.baselineData) {
      return {
        value: 'N/A',
        threshold: '0.95',
        status: 'warning',
        description: 'Baseline schedule not provided for BEI calculation'
      };
    }

    const completedTasks = this.data.filter(task => !this.isIncomplete(task)).length;
    const plannedTasks = this.baselineData.filter(task => {
      const end = new Date(task.target_end_date);
      return end <= new Date();
    }).length;

    const bei = plannedTasks > 0 ? completedTasks / plannedTasks : 0;
    
    return {
      value: bei.toFixed(2),
      threshold: '0.95',
      status: bei >= 0.95 ? 'pass' : bei >= 0.85 ? 'warning' : 'fail',
      description: 'Baseline Execution Index (BEI)'
    };
  }

  private calculateBaselineVariance(): any {
    if (!this.baselineData) {
      return {
        value: 'N/A',
        threshold: '±10%',
        status: 'warning',
        description: 'Baseline schedule not provided'
      };
    }

    const currentTaskCodes = new Set(this.data.map(task => task.task_code));
    const baselineTaskCodes = new Set(this.baselineData.map(task => task.task_code));

    const addedTasks = [...currentTaskCodes].filter(code => !baselineTaskCodes.has(code)).length;
    const removedTasks = [...baselineTaskCodes].filter(code => !currentTaskCodes.has(code)).length;
    const totalBaselineTasks = baselineTaskCodes.size;
    const variance = ((addedTasks + removedTasks) / totalBaselineTasks) * 100;

    return {
      value: `${variance.toFixed(1)}%`,
      threshold: '±10%',
      status: variance <= 10 ? 'pass' : variance <= 20 ? 'warning' : 'fail',
      description: 'Percentage of tasks added or removed compared to baseline'
    };
  }

  analyze() {
    return {
      logicIndex: this.calculateLogicIndex(),
      missingLogic: this.calculateMissingLogic(),
      highFloat: this.calculateHighFloat(),
      negativeFloat: this.calculateNegativeFloat(),
      highDuration: this.calculateHighDuration(),
      invalidDates: this.calculateInvalidDates(),
      resourcesLoaded: this.calculateResourcesLoaded(),
      missedTasks: this.calculateMissedTasks(),
      criticalPath: this.calculateCriticalPath(),
      criticalPathTest: this.calculateCriticalPathTest(),
      criticalPathLength: this.calculateCriticalPathLength(),
      criticalPathLengthIndex: this.calculateCriticalPathLengthIndex(),
      baselineExecution: this.calculateBaselineExecution(),
      baselineExecutionIndex: this.calculateBaselineExecutionIndex(),
      baselineVariance: this.calculateBaselineVariance(),
      linkTypes: this.calculateLinkTypes()
    };
  }
}