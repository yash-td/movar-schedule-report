import { useState, useMemo } from 'react';
import { Header } from './Header';
import { ProjectChart } from './ProjectChart';
import { constructionProjectData } from '../data/projectData';
import { Filter, RefreshCw, Search, Download, AlertTriangle, ChevronDown, BarChart2, ClipboardList, Table } from 'lucide-react';
import { XERUpload } from './XERUpload';
import { DCMAReport } from './DCMAReport';
import { DCMAAnalyzer } from '../services/dcmaAnalyzer';
import { chatService } from '../services/chatService';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';

interface FilterState {
  startDate: string;
  endDate: string;
  department: string;
  status: string;
  search: string;
  criticalPath: string;
}

interface TaskDifference {
  task_code: string;
  task_name: string;
  type: 'added' | 'removed' | 'modified';
  changes?: {
    field: string;
    baseline: string;
    current: string;
  }[];
}

export function ReportPage() {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    department: 'all',
    status: 'all',
    search: '',
    criticalPath: 'all'
  });
  const [showCharts, setShowCharts] = useState([true, true, true, true]);
  const [xerData, setXerData] = useState<any>(null);
  const [baselineData, setBaselineData] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [dcmaResults, setDcmaResults] = useState<any>(null);
  const [taskDifferences, setTaskDifferences] = useState<TaskDifference[]>([]);
  const [showDCMA, setShowDCMA] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [projectNarrative, setProjectNarrative] = useState<string>('');
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  const getTaskStatus = (task: any) => {
    const status = (task.status || '').toLowerCase();
    if (status.includes('complete')) return 'Completed';
    if (status.includes('progress') || status.includes('started')) return 'In Progress';
    return 'Not Started';
  };

  const filteredTableData = useMemo(() => {
    return tableData.filter(row => {
      const matchesSearch = filters.search === '' || 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(filters.search.toLowerCase())
        );
      
      const matchesStatus = filters.status === 'all' || 
        getTaskStatus(row) === filters.status;

      const matchesCriticalPath = filters.criticalPath === 'all' || 
        (filters.criticalPath === 'Yes' ? row.driving_path_flag === 'Y' : row.driving_path_flag === 'N');
      
      return matchesSearch && matchesStatus && matchesCriticalPath;
    });
  }, [tableData, filters.search, filters.status, filters.criticalPath]);

  const timelineData = useMemo(() => {
    if (!xerData?.chartData?.timeline) {
      return constructionProjectData.timeline;
    }

    return {
      ...xerData.chartData.timeline,
      datasets: [
        ...(xerData.chartData.timeline.datasets || []),
        ...(baselineData?.chartData.timeline.datasets || [])
      ]
    };
  }, [xerData, baselineData]);

  const generateProjectNarrative = async (data: any) => {
    setIsGeneratingNarrative(true);
    try {
      const projectSummary = {
        totalTasks: data.tableData.length,
        startDate: data.projectDates.minStartDate,
        endDate: data.projectDates.maxEndDate,
        criticalTasks: data.tableData.filter((task: any) => task.driving_path_flag === 'Y').length,
        taskTypes: Object.entries(
          data.tableData.reduce((acc: any, task: any) => {
            acc[task.task_type] = (acc[task.task_type] || 0) + 1;
            return acc;
          }, {})
        ),
        milestones: data.tableData.filter((task: any) => 
          task.task_type === 'TT_Mile'
        ).length,
        completedTasks: data.tableData.filter((task: any) => 
          getTaskStatus(task) === 'Completed'
        ).length
      };

      const prompt = `As a project management expert, analyze this project schedule data and provide a markdown-formatted summary with the following structure:

## Project Overview
[Provide a brief overview of the project timeline and scope]

### Key Statistics
- Start Date: ${projectSummary.startDate}
- End Date: ${projectSummary.endDate}
- Total Tasks: ${projectSummary.totalTasks}
- Critical Path Tasks: ${projectSummary.criticalTasks}
- Milestones: ${projectSummary.milestones}

### Task Distribution
${projectSummary.taskTypes.map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Analysis
[Provide analysis of schedule characteristics, risk areas, and patterns]

## Recommendations
[List 2-3 key recommendations based on the schedule structure]

Please format the response maintaining the markdown structure, but replace the bracketed sections with actual analysis. Keep the total response concise but informative.`;

      const response = await chatService.sendMessage([{ role: 'user', content: prompt }]);
      setProjectNarrative(response);
    } catch (error) {
      console.error('Error generating narrative:', error);
      setProjectNarrative('# Error\nUnable to generate project narrative at this time. Please try again later.');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const handleXERData = async (data: any) => {
    setXerData(data);
    setTableData(data.tableData);
    
    const dcmaAnalyzer = new DCMAAnalyzer(
      data.tableData,
      baselineData?.tableData
    );
    setDcmaResults({
      metrics: dcmaAnalyzer.analyze(),
      timestamp: new Date().toISOString(),
      projectName: baselineData ? 'Project Schedule (with Baseline)' : 'Project Schedule'
    });
    
    if (data.projectDates) {
      setFilters(prev => ({
        ...prev,
        startDate: data.projectDates.minStartDate,
        endDate: data.projectDates.maxEndDate
      }));
    }

    if (baselineData) {
      compareWithBaseline(data.tableData, baselineData.tableData);
    }
    
    setShowCharts([true, true, true, true]);
    await generateProjectNarrative(data);
  };

  const handleBaselineData = async (data: any) => {
    setBaselineData(data);
    
    if (xerData) {
      const dcmaAnalyzer = new DCMAAnalyzer(xerData.tableData, data.tableData);
      setDcmaResults({
        metrics: dcmaAnalyzer.analyze(),
        timestamp: new Date().toISOString(),
        projectName: 'Project Schedule (with Baseline)'
      });
      
      compareWithBaseline(xerData.tableData, data.tableData);
    }
  };

  const compareWithBaseline = (currentData: any[], baselineData: any[]) => {
    const differences: TaskDifference[] = [];
    
    const currentMap = new Map(currentData.map(task => [task.task_code, task]));
    const baselineMap = new Map(baselineData.map(task => [task.task_code, task]));

    currentMap.forEach((currentTask, taskCode) => {
      const baselineTask = baselineMap.get(taskCode);
      
      if (!baselineTask) {
        differences.push({
          task_code: taskCode,
          task_name: currentTask.task_name,
          type: 'added'
        });
      } else {
        const changes = [];
        
        const fieldsToCompare = [
          { key: 'task_name', label: 'Name' },
          { key: 'target_start_date', label: 'Start Date' },
          { key: 'target_end_date', label: 'End Date' },
          { key: 'driving_path_flag', label: 'Critical Path' },
          { key: 'task_type', label: 'Task Type' }
        ];

        for (const field of fieldsToCompare) {
          if (currentTask[field.key] !== baselineTask[field.key]) {
            changes.push({
              field: field.label,
              baseline: baselineTask[field.key],
              current: currentTask[field.key]
            });
          }
        }

        if (changes.length > 0) {
          differences.push({
            task_code: taskCode,
            task_name: currentTask.task_name,
            type: 'modified',
            changes
          });
        }
      }
    });

    baselineMap.forEach((baselineTask, taskCode) => {
      if (!currentMap.has(taskCode)) {
        differences.push({
          task_code: taskCode,
          task_name: baselineTask.task_name,
          type: 'removed'
        });
      }
    });

    setTaskDifferences(differences);
  };

  const handleDownloadCSV = () => {
    const csv = Papa.unparse(filteredTableData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'project_activities.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadComparison = () => {
    if (!taskDifferences.length) return;

    const csvData = taskDifferences.map(diff => ({
      'Task Code': diff.task_code,
      'Task Name': diff.task_name,
      'Change Type': diff.type.charAt(0).toUpperCase() + diff.type.slice(1),
      'Changes': diff.changes ? diff.changes.map(c => 
        `${c.field}: ${c.baseline} → ${c.current}`
      ).join('; ') : ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'schedule_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedDifferences = useMemo(() => 
    taskDifferences.slice(0, 20)
  , [taskDifferences]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">Privacy & Security Notice</h3>
              <p className="text-white/80">
                All data uploaded to this web app is processed locally in your browser and is not stored anywhere. 
                Everything is discarded as soon as the page is refreshed. Our Compass bot is powered by an LLM hosted on Movar's secure Azure environment - your prompts are not shared with any third parties, 
                nor do we save any of them. Enjoy this free tool!
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Project Performance Dashboard</h1>
            <p className="text-white/70">Interactive report showing real-time project metrics and KPIs</p>
          </div>
          <div className="flex gap-4">
            {xerData && (
              <>
                <button
                  onClick={() => setShowDCMA(!showDCMA)}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>DCMA Analysis</span>
                </button>
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Schedule Comparison</span>
                </button>
                <button
                  onClick={() => setShowTable(!showTable)}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors"
                >
                  <Table className="w-4 h-4" />
                  <span>Activity Table</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <XERUpload 
            onDataProcessed={handleXERData} 
            label="Upload Current Schedule (.xer)" 
          />
          <XERUpload 
            onDataProcessed={handleBaselineData}
            isBaseline={true}
            label="Upload Baseline Schedule (.xer)"
          />
        </div>

        {xerData && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Project Schedule Analysis</h2>
            </div>
            {isGeneratingNarrative ? (
              <div className="flex items-center gap-3 text-white/60">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating analysis...</span>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{projectNarrative}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {dcmaResults && showDCMA && (
          <div className="mb-8">
            <DCMAReport 
              metrics={dcmaResults.metrics}
              projectName={xerData?.projectName || 'Project Schedule'}
              timestamp={dcmaResults.timestamp}
              totalTasks={tableData.length}
            />
          </div>
        )}

        {taskDifferences.length > 0 && showComparison && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Schedule Comparison Analysis</h2>
              <button
                onClick={handleDownloadComparison}
                className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Comparison</span>
              </button>
            </div>

            <div className="space-y-4">
              {displayedDifferences.map((diff, index) => (
                <div 
                  key={`${diff.task_code}-${index}`}
                  className={`p-4 rounded-lg ${
                    diff.type === 'added' ? 'bg-green-500/10 border border-green-500/20' :
                    diff.type === 'removed' ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-yellow-500/10 border border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          diff.type === 'added' ? 'text-green-400' :
                          diff.type === 'removed' ? 'text-red-400' :
                          'text-yellow-400'
                        }`} />
                        <span className="font-medium text-white">
                          {diff.task_code} - {diff.task_name}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mt-1">
                        {diff.type === 'added' ? 'New task added' :
                         diff.type === 'removed' ? 'Task removed' :
                         'Task modified'}
                      </p>
                    </div>
                  </div>
                  {diff.changes && (
                    <div className="mt-3 space-y-2">
                      {diff.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="text-sm">
                          <span className="text-white/60">{change.field}: </span>
                          <span className="text-red-400">{change.baseline}</span>
                          <span className="text-white/60"> → </span>
                          <span className="text-green-400">{change.current}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {taskDifferences.length > 20 && (
              <div className="mt-4 text-center text-white/60">
                <p>Showing top 20 changes out of {taskDifferences.length}.</p>
                <p className="text-sm">Download the full comparison for complete details.</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 mb-8">
          <div className="p-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/70 text-sm whitespace-nowrap">
                <Filter className="w-4 h-4 text-primary" />
                Filters
              </div>

              <div className="flex items-center gap-1 min-w-[240px]">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-[120px] bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <span className="text-white/40 px-0.5">-</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-[120px] bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-[140px] bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={filters.criticalPath}
                onChange={(e) => setFilters(prev => ({ ...prev, criticalPath: e.target.value }))}
                className="w-[160px] bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2rem' }}
              >
                <option value="all">All Activities</option>
                <option value="Yes">Critical Path Only</option>
                <option value="No">Non-Critical Path Only</option>
              </select>

              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search activities..."
                className="flex-1 min-w-[200px] bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/40"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
          <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-1000 ${showCharts[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-xl font-semibold text-white mb-4">
              {xerData ? 'Activity S-Curve' : 'Project Timeline'}
            </h2>
            <ProjectChart 
              type="line" 
              data={timelineData} 
              title="Cumulative Progress" 
            />
          </div>

          {xerData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-1000 ${showCharts[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-xl font-semibold text-white mb-4">Activity Status</h2>
                <ProjectChart 
                  type="pie" 
                  data={xerData.chartData.progress} 
                  title="Status Distribution" 
                />
              </div>
              <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-1000 ${showCharts[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-xl font-semibold text-white mb-4">Task Types</h2>
                <ProjectChart 
                  type="pie" 
                  data={xerData.chartData.taskTypes} 
                  title="Task Type Distribution" 
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-1000 ${showCharts[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-xl font-semibold text-white mb-4">Budget Allocation</h2>
                <ProjectChart 
                  type="pie" 
                  data={constructionProjectData.budget} 
                  title="Budget Distribution" 
                />
              </div>
              <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-1000 ${showCharts[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-xl font-semibold text-white mb-4">Resource Utilization</h2>
                <ProjectChart 
                  type="bar" 
                  data={constructionProjectData.resources} 
                  title="Monthly Resources" 
                />
              </div>
            </div>
          )}
        </div>

        {xerData && showTable && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Activity Details</h2>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Full CSV
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-white/60">Task Code</th>
                  <th className="text-left p-2 text-white/60">Task Name</th>
                  <th className="text-left p-2 text-white/60">Start Date</th>
                  <th className="text-left p-2 text-white/60">End Date</th>
                  <th className="text-left p-2 text-white/60">Status</th>
                  <th className="text-left p-2 text-white/60">Critical</th>
                  <th className="text-left p-2 text-white/60">Type</th>
                  <th className="text-left p-2 text-white/60">Free Float (Days)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableData.map((row, index) => (
                  <tr 
                    key={`${row.task_code}-${index}`}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-2 text-white/90">{row.task_code}</td>
                    <td className="p-2 text-white/90">{row.task_name}</td>
                    <td className="p-2 text-white/90">{row.target_start_date}</td>
                    <td className="p-2 text-white/90">{row.target_end_date}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        getTaskStatus(row) === 'Completed' ? 'bg-green-500/20 text-green-400' :
                        getTaskStatus(row) === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {getTaskStatus(row)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        row.driving_path_flag === 'Y' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {row.driving_path_flag === 'Y' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-2 text-white/90">{row.task_type}</td>
                    <td className="p-2 text-white/90">{row.free_float_hr_cnt ? (parseInt(row.free_float_hr_cnt) / 8).toFixed(1) : '0'}</td>
                  
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}