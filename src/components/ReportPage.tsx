import { useState, useMemo, useRef } from 'react';
import { ProjectChart } from './ProjectChart';
import { constructionProjectData } from '../data/projectData';
import { Filter, RefreshCw, Download, AlertTriangle, BarChart2, ClipboardList } from 'lucide-react';
import { XERUpload } from './XERUpload';
import { DCMAReport } from './DCMAReport';
import { DCMAAnalyzer } from '../services/dcmaAnalyzer';
import { chatService } from '../services/chatService';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

interface LookAheadActivity {
  task_code: string;
  task_name: string;
  target_start_date: string;
  target_end_date: string;
  baseline_start_date?: string;
  baseline_end_date?: string;
  start_variance_days?: number;
  end_variance_days?: number;
  driving_path_flag: string;
  task_type: string;
}

const MOVAR_LOGO_URL = '/movar-logo.png';

type DashboardView = 'overview' | 'analysis' | 'register';
	export function ReportPage() {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    department: 'all',
    status: 'all',
    search: '',
    criticalPath: 'all'
  });
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [xerData, setXerData] = useState<any>(null);
  const [baselineData, setBaselineData] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [dcmaResults, setDcmaResults] = useState<any>(null);
  const [taskDifferences, setTaskDifferences] = useState<TaskDifference[]>([]);
  const [projectNarrative, setProjectNarrative] = useState<string>('');
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [narrativePrompt, setNarrativePrompt] = useState('');
  const [varianceAnalysis, setVarianceAnalysis] = useState<{
    activityCountDifference: number;
    totalDelayDays: number;
    criticalPathDelayDays: number;
  } | null>(null);
  const [lookAheadData, setLookAheadData] = useState<{
    currentActivities: LookAheadActivity[];
    baselineActivities: LookAheadActivity[];
    summary: {
      totalActivitiesStarting: number;
      totalActivitiesEnding: number;
      criticalActivitiesStarting: number;
      criticalActivitiesEnding: number;
      averageStartVariance: number;
      averageEndVariance: number;
    };
  } | null>(null);

  const getTaskStatus = (task: any) => {
    // Use actual start/end dates for more factual status determination
    const hasActualStart = task.act_start_date && task.act_start_date.trim() !== '';
    const hasActualEnd = task.act_end_date && task.act_end_date.trim() !== '';

    if (hasActualEnd) {
      return 'Completed';
    } else if (hasActualStart) {
      return 'In Progress';
    } else {
      return 'Not Started';
    }
  };

  const filteredTableData = useMemo(() => {
    return tableData.filter(row => {
      const matchesSearch = filters.search === '' ||
        Object.values(row).some(value =>
          String(value ?? '').toLowerCase().includes(filters.search.toLowerCase())
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

  const generateProjectNarrative = async (data: any, promptOverride?: string, variance?: typeof varianceAnalysis) => {
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
        milestones: data.tableData.filter((task: any) => task.task_type === 'TT_Mile').length,
        completedTasks: data.tableData.filter((task: any) => getTaskStatus(task) === 'Completed').length
      };

      // Use passed variance or fallback to state
      const varianceData = variance || varianceAnalysis;
      
      // Add variance analysis if baseline data is available
      const varianceSection = varianceData ? `
### Schedule Variance Analysis
- Activity Count Difference: ${varianceData.activityCountDifference > 0 ? '+' : ''}${varianceData.activityCountDifference} activities compared to baseline
- Total Schedule Delay: ${varianceData.totalDelayDays} days (accounting for float)
- Critical Path Delay: ${varianceData.criticalPathDelayDays} days` : '';

      const tailoredSection = promptOverride && promptOverride.trim().length > 0
        ? `\n\n### Tailoring Instructions\n${promptOverride.trim()}`
        : '';

      const prompt = `As a project management expert, analyze this project schedule data and provide a markdown-formatted summary with the following structure:

## Project Overview
[Provide a brief overview of the project timeline and scope]

### Key Statistics
- Start Date: ${projectSummary.startDate}
- End Date: ${projectSummary.endDate}
- Total Tasks: ${projectSummary.totalTasks}
- Critical Path Tasks: ${projectSummary.criticalTasks}
- Milestones: ${projectSummary.milestones}${varianceSection}

### Task Distribution
${projectSummary.taskTypes.map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Analysis
[Provide analysis of schedule characteristics, risk areas, and patterns${varianceData ? ', including variance analysis insights' : ''}]

## Recommendations
[List 2-3 key recommendations based on the schedule structure${varianceData ? ' and variance analysis' : ''}]

Please format the response maintaining the markdown structure, but replace the bracketed sections with actual analysis. Keep the total response concise but informative.${tailoredSection}`;

      const response = await chatService.sendMessage([{ role: 'user', content: prompt }]);
      setProjectNarrative(response);
    } catch (error) {
      console.error('Error generating narrative:', error);
      setProjectNarrative('# Narrative Unavailable\nConfigure Azure OpenAI environment variables and try again.');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const handleXERData = async (data: any) => {
    setXerData(data);
    setTableData(data.tableData);

    const dcmaAnalyzer = new DCMAAnalyzer(
      {
        tasks: data.tableData,
        projectInfo: data.projectInfo
      },
      baselineData
        ? {
            tasks: baselineData.tableData,
            projectInfo: baselineData.projectInfo
          }
        : undefined
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

    let variance = null;
    if (baselineData) {
      compareWithBaseline(data.tableData, baselineData.tableData);
      variance = calculateVarianceAnalysis(data.tableData, baselineData.tableData);

      // Calculate 4-week look ahead with baseline comparison
      const lookAhead = calculateFourWeekLookAhead(data.tableData, baselineData.tableData);
      setLookAheadData(lookAhead);
    } else {
      // Reset variance analysis if no baseline
      setVarianceAnalysis(null);

      // Calculate 4-week look ahead without baseline
      const lookAhead = calculateFourWeekLookAhead(data.tableData);
      setLookAheadData(lookAhead);
    }

    await generateProjectNarrative(data, narrativePrompt, variance);
  };

  const handleBaselineData = async (data: any) => {
    setBaselineData(data);

    if (xerData) {
      const dcmaAnalyzer = new DCMAAnalyzer(
        {
          tasks: xerData.tableData,
          projectInfo: xerData.projectInfo
        },
        {
          tasks: data.tableData,
          projectInfo: data.projectInfo
        }
      );
      setDcmaResults({
        metrics: dcmaAnalyzer.analyze(),
        timestamp: new Date().toISOString(),
        projectName: 'Project Schedule (with Baseline)'
      });

      compareWithBaseline(xerData.tableData, data.tableData);
      const variance = calculateVarianceAnalysis(xerData.tableData, data.tableData);

      // Calculate 4-week look ahead with baseline comparison
      const lookAhead = calculateFourWeekLookAhead(xerData.tableData, data.tableData);
      setLookAheadData(lookAhead);

      await generateProjectNarrative(xerData, narrativePrompt, variance);
    }
  };

  const calculateFourWeekLookAhead = (currentData: any[], baselineData?: any[]) => {
    const now = new Date();
    const fourWeeksFromNow = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));

    // Get activities starting or ending in the next 4 weeks
    const currentActivities: LookAheadActivity[] = currentData
      .filter(task => {
        const startDate = new Date(task.target_start_date);
        const endDate = new Date(task.target_end_date);
        return (startDate >= now && startDate <= fourWeeksFromNow) ||
               (endDate >= now && endDate <= fourWeeksFromNow);
      })
      .map(task => {
        const activity: LookAheadActivity = {
          task_code: task.task_code,
          task_name: task.task_name,
          target_start_date: task.target_start_date,
          target_end_date: task.target_end_date,
          driving_path_flag: task.driving_path_flag,
          task_type: task.task_type
        };

        // Add baseline comparison if available
        if (baselineData) {
          const baselineTask = baselineData.find(bt => bt.task_code === task.task_code);
          if (baselineTask) {
            activity.baseline_start_date = baselineTask.target_start_date;
            activity.baseline_end_date = baselineTask.target_end_date;

            const currentStart = new Date(task.target_start_date);
            const baselineStart = new Date(baselineTask.target_start_date);
            const currentEnd = new Date(task.target_end_date);
            const baselineEnd = new Date(baselineTask.target_end_date);

            activity.start_variance_days = Math.round((currentStart.getTime() - baselineStart.getTime()) / (1000 * 60 * 60 * 24));
            activity.end_variance_days = Math.round((currentEnd.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        return activity;
      });

    // Get baseline activities for comparison (if baseline exists)
    const baselineActivities: LookAheadActivity[] = baselineData
      ? baselineData
          .filter(task => {
            const startDate = new Date(task.target_start_date);
            const endDate = new Date(task.target_end_date);
            return (startDate >= now && startDate <= fourWeeksFromNow) ||
                   (endDate >= now && endDate <= fourWeeksFromNow);
          })
          .map(task => ({
            task_code: task.task_code,
            task_name: task.task_name,
            target_start_date: task.target_start_date,
            target_end_date: task.target_end_date,
            driving_path_flag: task.driving_path_flag,
            task_type: task.task_type
          }))
      : [];

    // Calculate summary statistics
    const activitiesStarting = currentActivities.filter(a => {
      const startDate = new Date(a.target_start_date);
      return startDate >= now && startDate <= fourWeeksFromNow;
    });

    const activitiesEnding = currentActivities.filter(a => {
      const endDate = new Date(a.target_end_date);
      return endDate >= now && endDate <= fourWeeksFromNow;
    });

    const criticalActivitiesStarting = activitiesStarting.filter(a => a.driving_path_flag === 'Y').length;
    const criticalActivitiesEnding = activitiesEnding.filter(a => a.driving_path_flag === 'Y').length;

    // Calculate average variances (only for activities with baseline data)
    const activitiesWithStartVariance = currentActivities.filter(a => a.start_variance_days !== undefined);
    const activitiesWithEndVariance = currentActivities.filter(a => a.end_variance_days !== undefined);

    const averageStartVariance = activitiesWithStartVariance.length > 0
      ? Math.round(activitiesWithStartVariance.reduce((sum, a) => sum + (a.start_variance_days || 0), 0) / activitiesWithStartVariance.length)
      : 0;

    const averageEndVariance = activitiesWithEndVariance.length > 0
      ? Math.round(activitiesWithEndVariance.reduce((sum, a) => sum + (a.end_variance_days || 0), 0) / activitiesWithEndVariance.length)
      : 0;

    return {
      currentActivities,
      baselineActivities,
      summary: {
        totalActivitiesStarting: activitiesStarting.length,
        totalActivitiesEnding: activitiesEnding.length,
        criticalActivitiesStarting,
        criticalActivitiesEnding,
        averageStartVariance,
        averageEndVariance
      }
    };
  };

  const calculateVarianceAnalysis = (currentData: any[], baselineData: any[]) => {
    // Calculate activity count difference
    const activityCountDifference = currentData.length - baselineData.length;

    // Calculate total delay (accounting for float) by comparing finish dates
    let totalDelayDays = 0;
    let criticalPathDelayDays = 0;

    const currentMap = new Map(currentData.map(task => [task.task_code, task]));
    const baselineMap = new Map(baselineData.map(task => [task.task_code, task]));

    // Compare tasks that exist in both schedules
    currentMap.forEach((currentTask, taskCode) => {
      const baselineTask = baselineMap.get(taskCode);
      
      if (baselineTask && currentTask.target_end_date && baselineTask.target_end_date) {
        const currentEndDate = new Date(currentTask.target_end_date);
        const baselineEndDate = new Date(baselineTask.target_end_date);
        
        // Calculate delay in days (positive = delay, negative = ahead)
        let delayDays = Math.ceil((currentEndDate.getTime() - baselineEndDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Subtract float from the delay (convert float from hours to days)
        if (delayDays > 0 && currentTask.total_float_hr_cnt) {
          const floatDays = parseFloat(currentTask.total_float_hr_cnt) / 8;
          delayDays = Math.max(0, delayDays - floatDays);
        }
        
        // Only count delays (positive values after accounting for float)
        if (delayDays > 0) {
          totalDelayDays += delayDays;
          
          // Track critical path delays separately (critical path has no float by definition)
          if (currentTask.driving_path_flag === 'Y') {
            criticalPathDelayDays += delayDays;
          }
        }
      }
    });

    // Round the total delay days to avoid decimal places
    totalDelayDays = Math.round(totalDelayDays);
    criticalPathDelayDays = Math.round(criticalPathDelayDays);

    return {
      activityCountDifference,
      totalDelayDays,
      criticalPathDelayDays
    };
  };

  const compareWithBaseline = (currentData: any[], baselineDataSet: any[]) => {
    const differences: TaskDifference[] = [];

    const currentMap = new Map(currentData.map(task => [task.task_code, task]));
    const baselineMap = new Map(baselineDataSet.map(task => [task.task_code, task]));

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

    // Calculate variance analysis
    const variance = calculateVarianceAnalysis(currentData, baselineDataSet);
    setVarianceAnalysis(variance);
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
      'Changes': diff.changes ? diff.changes.map(c => `${c.field}: ${c.baseline} → ${c.current}`).join('; ') : ''
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

  const displayedDifferences = useMemo(() => taskDifferences.slice(0, 20), [taskDifferences]);
  const displayedActivities = useMemo(() => filteredTableData.slice(0, 30), [filteredTableData]);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const sCurveRef = useRef<HTMLDivElement>(null);
  const narrativeRef = useRef<HTMLDivElement>(null);
  const dcmaRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const lookAheadRef = useRef<HTMLDivElement>(null);
  const activityRegisterRef = useRef<HTMLDivElement>(null);

  const summaryStats = useMemo(() => {
    const total = tableData.length;
    const completed = tableData.filter(task => getTaskStatus(task) === 'Completed').length;
    const inProgress = tableData.filter(task => getTaskStatus(task) === 'In Progress').length;
    const notStarted = Math.max(total - completed - inProgress, 0);
    const critical = tableData.filter(task => task.driving_path_flag === 'Y').length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      critical
    };
  }, [tableData]);

  const completionPercent = summaryStats.total ? ((summaryStats.completed / summaryStats.total) * 100).toFixed(1) : '0.0';
  const inProgressPercent = summaryStats.total ? ((summaryStats.inProgress / summaryStats.total) * 100).toFixed(1) : '0.0';
  const criticalPercent = summaryStats.total ? ((summaryStats.critical / summaryStats.total) * 100).toFixed(1) : '0.0';

  const scheduleDataDate = xerData?.projectInfo?.dataDate;
  const dataDateLabel = scheduleDataDate ? new Date(scheduleDataDate).toLocaleString() : 'Awaiting schedule upload';
  const projectNameLabel = xerData?.projectInfo?.shortName || 'Project Schedule';
  const lastUpdatedLabel = dcmaResults?.timestamp ? new Date(dcmaResults.timestamp).toLocaleString() : null;
  const hasScheduleData = Boolean(xerData);

  const handleDownloadSectionPDF = async (sectionRef: React.RefObject<HTMLDivElement>, sectionName: string) => {
    if (!sectionRef.current) {
      console.warn(`Section ref for ${sectionName} is not available`);
      return;
    }

    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const footerHeight = 50;
      const contentAreaHeight = pageHeight - margin * 2 - footerHeight;
      
      // Capture the section content
      const canvas = await html2canvas(sectionRef.current, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      let imgWidth = pageWidth - margin * 2;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Special handling for DCMA and other single-page sections
      const singlePageSections = ['dcma-assessment', 'metrics', 's-curve', 'charts', 'narrative'];
      const isSinglePageSection = singlePageSections.some(section => sectionName.toLowerCase().includes(section));
      
      if (isSinglePageSection && imgHeight > contentAreaHeight) {
        // Scale down to fit on one page
        const scaleFactor = contentAreaHeight / imgHeight;
        imgHeight = contentAreaHeight;
        imgWidth = imgWidth * scaleFactor;
        
        // Center the scaled image horizontally
        const xOffset = (pageWidth - imgWidth) / 2;
        
        // Set background color for the page
        pdf.setFillColor(15, 23, 42); // #0f172a in RGB
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add the scaled content
        pdf.addImage(
          imgData,
          'PNG',
          xOffset,
          margin,
          imgWidth,
          imgHeight,
          undefined,
          'FAST',
          0
        );
        
        // Add footer at page bottom
        addFooterToPDF(pdf, pageHeight - footerHeight + 10, pageWidth);
      } else if (imgHeight <= contentAreaHeight) {
        // Content fits on one page
        // Set background color for the page
        pdf.setFillColor(15, 23, 42); // #0f172a in RGB
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add the content
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          margin,
          imgWidth,
          imgHeight,
          undefined,
          'FAST',
          0
        );
        
        // Position footer at the bottom of content or page bottom
        const contentBottom = margin + imgHeight;
        const footerY = Math.max(contentBottom + 40, pageHeight - footerHeight);
        
        // Add footer
        addFooterToPDF(pdf, footerY, pageWidth);
      } else {
        // Multi-page content (for sections like activity register)
        const totalPages = Math.ceil(imgHeight / contentAreaHeight);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          // Set background color for the page
          pdf.setFillColor(15, 23, 42); // #0f172a in RGB
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          
          // Calculate the portion of image to show on this page
          const yOffset = page * contentAreaHeight;
          
          // Add the content image with proper clipping
          if (page === totalPages - 1) {
            // Last page - might need less height
            const remainingHeight = imgHeight - (page * contentAreaHeight);
            const displayHeight = Math.min(remainingHeight, contentAreaHeight);
            
            // Create a clipped version for the last page
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = (displayHeight * canvas.width) / imgWidth;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
              tempCtx.drawImage(
                canvas,
                0,
                (yOffset * canvas.width) / imgWidth,
                canvas.width,
                tempCanvas.height,
                0,
                0,
                canvas.width,
                tempCanvas.height
              );
              
              const pageImgData = tempCanvas.toDataURL('image/png');
              pdf.addImage(
                pageImgData,
                'PNG',
                margin,
                margin,
                imgWidth,
                displayHeight
              );
            }
            
            // Position footer at the bottom of content or page bottom
            const contentBottom = margin + displayHeight;
            const footerY = Math.max(contentBottom + 40, pageHeight - footerHeight);
            
            // Add footer
            addFooterToPDF(pdf, footerY, pageWidth);
          } else {
            // Full page
            // Create a clipped version of the image for this page
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = (contentAreaHeight * canvas.width) / imgWidth;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
              tempCtx.drawImage(
                canvas,
                0,
                (yOffset * canvas.width) / imgWidth,
                canvas.width,
                tempCanvas.height,
                0,
                0,
                canvas.width,
                tempCanvas.height
              );
              
              const pageImgData = tempCanvas.toDataURL('image/png');
              pdf.addImage(
                pageImgData,
                'PNG',
                margin,
                margin,
                imgWidth,
                contentAreaHeight
              );
            }
            
            // Add footer at page bottom
            addFooterToPDF(pdf, pageHeight - footerHeight + 10, pageWidth);
          }
        }
      }

      const fileName = `movar-${sectionName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error(`Failed to generate PDF for ${sectionName}`, error);
    }
  };

  const addFooterToPDF = (pdf: jsPDF, yPosition: number, pageWidth: number) => {
    // Add footer line
    pdf.setDrawColor(255, 255, 255, 0.1);
    pdf.setLineWidth(0.5);
    pdf.line(40, yPosition - 10, pageWidth - 40, yPosition - 10);
    
    // Add footer text
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    
    // Create footer with logo
    const footerText = 'powered by';
    const footerX = pageWidth - 140;
    pdf.text(footerText, footerX, yPosition + 10);
    
    // Add Movar text as logo representation
    pdf.setFontSize(14);
    pdf.setTextColor(100, 150, 200); // Primary color
    pdf.text('Movar', footerX + 55, yPosition + 10);
    
    // Try to add the actual logo image if available
    try {
      // Create a temporary image element to load the logo
      const img = new Image();
      img.src = MOVAR_LOGO_URL;
      
      // Note: In a real implementation, you'd need to wait for the image to load
      // For now, we'll just use the text representation
    } catch (error) {
      // Fallback to text-only footer
      console.log('Logo image not available for PDF footer');
    }
  };

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current || !hasScheduleData) {
      return;
    }
    await handleDownloadSectionPDF(dashboardRef, 'dashboard');
  };

  const handleRegenerateNarrative = async () => {
    if (!xerData) return;
    await generateProjectNarrative(xerData, narrativePrompt, varianceAnalysis);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 no-print">
          <XERUpload onDataProcessed={handleXERData} label="Upload Current Schedule (.xer)" />
          <XERUpload onDataProcessed={handleBaselineData} isBaseline label="Upload Baseline Schedule (.xer)" />
        </div>

        <div className="flex flex-col gap-4 mb-6 no-print lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview' as DashboardView, label: 'Overview' },
              { key: 'analysis' as DashboardView, label: 'Variance & DCMA' },
              { key: 'register' as DashboardView, label: 'Activity Register' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                  activeView === key
                    ? 'bg-primary/30 border-primary/40 text-primary'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-primary/40 hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={!hasScheduleData}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
              hasScheduleData
                ? 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30'
                : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        <div ref={dashboardRef} className="space-y-8">
          {activeView === 'overview' && (
            <>
              <section ref={metricsRef} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg space-y-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <img src={MOVAR_LOGO_URL} alt="Movar logo" className="h-12 w-auto" />
                    <div>
                      <h1 className="text-2xl font-semibold">Movar Project Performance Dashboard</h1>
                      <p className="text-white/60 text-sm">Data date: {dataDateLabel}</p>
                      {lastUpdatedLabel && <p className="text-white/40 text-xs">Last updated {lastUpdatedLabel}</p>}
                    </div>
                  </div>
                  {hasScheduleData && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white/80 font-semibold text-lg">{projectNameLabel}</p>
                        {baselineData && <p className="text-primary text-sm">Baseline uploaded</p>}
                      </div>
                      <button
                        onClick={() => handleDownloadSectionPDF(metricsRef, 'metrics')}
                        className="no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                        title="Download Metrics as PDF"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 ${varianceAnalysis ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-4`}>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm text-white/60">Total Activities</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{summaryStats.total.toLocaleString()}</p>
                    <p className="text-xs text-white/40 mt-1">Across the current schedule</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-200/80">Completed</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-300">{summaryStats.completed.toLocaleString()}</p>
                    <p className="text-xs text-emerald-200/70 mt-1">{completionPercent}% of total</p>
                  </div>
                  <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
                    <p className="text-sm text-sky-200/80">In Progress</p>
                    <p className="mt-2 text-3xl font-semibold text-sky-300">{summaryStats.inProgress.toLocaleString()}</p>
                    <p className="text-xs text-sky-200/70 mt-1">{inProgressPercent}% of total</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-200/80">Critical Path</p>
                    <p className="mt-2 text-3xl font-semibold text-amber-300">{summaryStats.critical.toLocaleString()}</p>
                    <p className="text-xs text-amber-200/70 mt-1">{criticalPercent}% of total activities</p>
                  </div>
                  {varianceAnalysis && (
                    <>
                      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
                        <p className="text-sm text-rose-200/80">Schedule Delay</p>
                        <p className="mt-2 text-3xl font-semibold text-rose-300">{varianceAnalysis.totalDelayDays.toLocaleString()}</p>
                        <p className="text-xs text-rose-200/70 mt-1">Days (accounting for float)</p>
                      </div>
                      <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4">
                        <p className="text-sm text-purple-200/80">Activity Variance</p>
                        <p className="mt-2 text-3xl font-semibold text-purple-300">
                          {varianceAnalysis.activityCountDifference > 0 ? '+' : ''}{varianceAnalysis.activityCountDifference.toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-200/70 mt-1">vs baseline schedule</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">Privacy & Security Notice</h3>
                    <p className="text-white/80 text-sm mt-1">
                      Schedule data is processed locally in your browser and is discarded when you refresh the page. Optional narrative generation uses the Azure OpenAI credentials you provide via environment variables; prompts are sent directly to your tenant.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div ref={sCurveRef} className="relative">
                  <ProjectChart type="line" data={timelineData} title={hasScheduleData ? 'Activity S-Curve' : 'Sample Project Timeline'} />
                  {hasScheduleData && (
                    <button
                      onClick={() => handleDownloadSectionPDF(sCurveRef, 's-curve')}
                      className="no-print absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                      title="Download S-Curve as PDF"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div ref={narrativeRef} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold text-white">Project Narrative</h2>
                    </div>
                    {hasScheduleData && projectNarrative && (
                      <button
                        onClick={() => handleDownloadSectionPDF(narrativeRef, 'narrative')}
                        className="no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                        title="Download Narrative as PDF"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isGeneratingNarrative ? (
                    <div className="flex items-center gap-3 text-white/60">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating analysis...</span>
                    </div>
                  ) : projectNarrative ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{projectNarrative}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">
                      Upload a schedule (and optional baseline) to generate AI-supported insights summarising performance, risk, and next steps.
                    </p>
                  )}
                  <div className="no-print space-y-3 border-t border-white/10 pt-4">
                    <label className="block text-sm font-medium text-white/70" htmlFor="narrative-prompt">
                      Tailor the narrative (optional)
                    </label>
                    <textarea
                      id="narrative-prompt"
                      value={narrativePrompt}
                      onChange={(e) => setNarrativePrompt(e.target.value)}
                      placeholder="Add context, focus areas, or tone guidance for the narrative..."
                      className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRegenerateNarrative}
                        disabled={!hasScheduleData || isGeneratingNarrative}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                          hasScheduleData && !isGeneratingNarrative
                            ? 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30'
                            : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <RefreshCw className={`w-4 h-4 ${isGeneratingNarrative ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingNarrative ? 'Generating...' : 'Regenerate Narrative'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeView === 'analysis' && (
            <section className="space-y-6">
              {lookAheadData && (
                <div ref={lookAheadRef} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold text-white">4-Week Look Ahead</h2>
                    </div>
                    <button
                      onClick={() => handleDownloadSectionPDF(lookAheadRef, '4-week-look-ahead')}
                      className="no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                      title="Download 4-Week Look Ahead as PDF"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                      <p className="text-sm text-emerald-200/80">Activities Starting</p>
                      <p className="mt-2 text-3xl font-semibold text-emerald-300">{lookAheadData.summary.totalActivitiesStarting}</p>
                      <p className="text-xs text-emerald-200/70 mt-1">Next 4 weeks</p>
                    </div>
                    <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
                      <p className="text-sm text-sky-200/80">Activities Ending</p>
                      <p className="mt-2 text-3xl font-semibold text-sky-300">{lookAheadData.summary.totalActivitiesEnding}</p>
                      <p className="text-xs text-sky-200/70 mt-1">Next 4 weeks</p>
                    </div>
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                      <p className="text-sm text-amber-200/80">Critical Starting</p>
                      <p className="mt-2 text-3xl font-semibold text-amber-300">{lookAheadData.summary.criticalActivitiesStarting}</p>
                      <p className="text-xs text-amber-200/70 mt-1">Critical path activities</p>
                    </div>
                    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
                      <p className="text-sm text-rose-200/80">Critical Ending</p>
                      <p className="mt-2 text-3xl font-semibold text-rose-300">{lookAheadData.summary.criticalActivitiesEnding}</p>
                      <p className="text-xs text-rose-200/70 mt-1">Critical path activities</p>
                    </div>
                  </div>

                  {baselineData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4">
                        <p className="text-sm text-purple-200/80">Avg Start Variance</p>
                        <p className="mt-2 text-3xl font-semibold text-purple-300">
                          {lookAheadData.summary.averageStartVariance > 0 ? '+' : ''}{lookAheadData.summary.averageStartVariance}
                        </p>
                        <p className="text-xs text-purple-200/70 mt-1">Days vs baseline</p>
                      </div>
                      <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4">
                        <p className="text-sm text-indigo-200/80">Avg End Variance</p>
                        <p className="mt-2 text-3xl font-semibold text-indigo-300">
                          {lookAheadData.summary.averageEndVariance > 0 ? '+' : ''}{lookAheadData.summary.averageEndVariance}
                        </p>
                        <p className="text-xs text-indigo-200/70 mt-1">Days vs baseline</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Upcoming Activities</h3>
                    {lookAheadData.currentActivities.slice(0, 10).map((activity, index) => (
                      <div key={`${activity.task_code}-${index}`} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">{activity.task_code}</span>
                              {activity.driving_path_flag === 'Y' && (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-rose-500/15 text-rose-300">
                                  Critical
                                </span>
                              )}
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-white/10 text-white/60">
                                {activity.task_type}
                              </span>
                            </div>
                            <p className="text-white/80 text-sm mb-3">{activity.task_name}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-white/60">Start: </span>
                                <span className="text-white/90">{new Date(activity.target_start_date).toLocaleDateString()}</span>
                                {activity.baseline_start_date && (
                                  <>
                                    <span className="text-white/60"> (vs baseline: </span>
                                    <span className="text-white/70">{new Date(activity.baseline_start_date).toLocaleDateString()}</span>
                                    {activity.start_variance_days !== undefined && (
                                      <span className={`ml-1 ${activity.start_variance_days > 0 ? 'text-rose-300' : activity.start_variance_days < 0 ? 'text-emerald-300' : 'text-white/60'}`}>
                                        {activity.start_variance_days > 0 ? '+' : ''}{activity.start_variance_days}d
                                      </span>
                                    )}
                                    <span className="text-white/60">)</span>
                                  </>
                                )}
                              </div>
                              <div>
                                <span className="text-white/60">End: </span>
                                <span className="text-white/90">{new Date(activity.target_end_date).toLocaleDateString()}</span>
                                {activity.baseline_end_date && (
                                  <>
                                    <span className="text-white/60"> (vs baseline: </span>
                                    <span className="text-white/70">{new Date(activity.baseline_end_date).toLocaleDateString()}</span>
                                    {activity.end_variance_days !== undefined && (
                                      <span className={`ml-1 ${activity.end_variance_days > 0 ? 'text-rose-300' : activity.end_variance_days < 0 ? 'text-emerald-300' : 'text-white/60'}`}>
                                        {activity.end_variance_days > 0 ? '+' : ''}{activity.end_variance_days}d
                                      </span>
                                    )}
                                    <span className="text-white/60">)</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {lookAheadData.currentActivities.length > 10 && (
                      <p className="text-center text-sm text-white/50">
                        Showing the first 10 of {lookAheadData.currentActivities.length} activities in the 4-week window.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div ref={comparisonRef} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-white">Top Schedule Differences</h2>
                  </div>
                  {taskDifferences.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleDownloadComparison} className="flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30">
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSectionPDF(comparisonRef, 'comparison')}
                        className="no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                        title="Download Comparison as PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}
                </div>

                {taskDifferences.length > 0 ? (
                  <div className="space-y-4">
                    {displayedDifferences.map((diff, index) => (
                      <div key={`${diff.task_code}-${index}`} className={`rounded-xl border p-4 ${
                        diff.type === 'added' ? 'border-emerald-400/40 bg-emerald-500/10' :
                        diff.type === 'removed' ? 'border-rose-400/40 bg-rose-500/10' :
                        'border-amber-400/40 bg-amber-500/10'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${
                                diff.type === 'added' ? 'text-emerald-300' :
                                diff.type === 'removed' ? 'text-rose-300' :
                                'text-amber-300'
                              }`} />
                              <span className="font-medium text-white">{diff.task_code} — {diff.task_name}</span>
                            </div>
                            <p className="text-white/60 text-sm mt-1">
                              {diff.type === 'added' ? 'New activity added to current schedule' :
                               diff.type === 'removed' ? 'Activity removed versus baseline' :
                               'Activity modified since baseline'}
                            </p>
                          </div>
                        </div>
                        {diff.changes && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {diff.changes.map((change, changeIndex) => (
                              <div key={changeIndex} className="text-sm">
                                <span className="text-white/60">{change.field}: </span>
                                <span className="text-rose-300">{change.baseline || '—'}</span>
                                <span className="text-white/60"> → </span>
                                <span className="text-emerald-300">{change.current || '—'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {taskDifferences.length > 20 && (
                      <p className="text-center text-sm text-white/50">Showing the top 20 of {taskDifferences.length.toLocaleString()} changes. Export for the full comparison.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">Upload a baseline schedule to compare against the current plan. Differences will be summarised here and in the exported comparison.</p>
                )}
              </div>

              {dcmaResults ? (
                <div ref={dcmaRef} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BarChart2 className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold text-white">DCMA 14-Point Assessment</h2>
                    </div>
                    <button
                      onClick={() => handleDownloadSectionPDF(dcmaRef, 'dcma-assessment')}
                      className="no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                      title="Download DCMA Assessment as PDF"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <DCMAReport metrics={dcmaResults.metrics} projectName={projectNameLabel} timestamp={dcmaResults.timestamp} totalTasks={tableData.length} />
                </div>
              ) : (
                <p className="text-white/60 text-sm">Upload a schedule to run the DCMA 14-point quality checks.</p>
              )}
            </section>
          )}
 
          {activeView === 'register' && (
            <section ref={activityRegisterRef} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Activity Register</h2>
                  <p className="text-white/60 text-sm">Showing the first 30 filtered activities. Export the CSV for the full list.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDownloadCSV} className="flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30">
                    <Download className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                  {hasScheduleData && (
                    <button
                      onClick={() => handleDownloadSectionPDF(activityRegisterRef, 'activity-register')}
                      className="no-print flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
                      title="Download Activity Register as PDF"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <Filter className="w-4 h-4 text-primary" />
                    <span>Filters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    <span className="text-white/40 px-1">–</span>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-[160px] appearance-none rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    style={{
                      backgroundImage:
                        "url('data:image/svg+xml,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 20 20\\'%3e%3cpath stroke=\\'%23ffffff\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1.5\\' d=\\'M6 8l4 4 4-4\\'/%3e%3c/svg%3e')",
                      backgroundPosition: 'right 0.65rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25rem',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <select
                    value={filters.criticalPath}
                    onChange={(e) => setFilters(prev => ({ ...prev, criticalPath: e.target.value }))}
                    className="w-[200px] appearance-none rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    style={{
                      backgroundImage:
                        "url('data:image/svg+xml,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 20 20\\'%3e%3cpath stroke=\\'%23ffffff\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1.5\\' d=\\'M6 8l4 4 4-4\\'/%3e%3c/svg%3e')",
                      backgroundPosition: 'right 0.65rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25rem',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="all">All Activities</option>
                    <option value="Yes">Critical Path Only</option>
                    <option value="No">Non-Critical Path Only</option>
                  </select>
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search activities..."
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Task Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Task Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Start</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Finish</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Critical</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-white/70">Free Float (d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {displayedActivities.map((row, index) => (
                      <tr key={`${row.task_code}-${index}`} className="hover:bg-white/5">
                        <td className="px-3 py-2 text-sm text-white/90">{row.task_code}</td>
                        <td className="px-3 py-2 text-sm text-white/90">{row.task_name}</td>
                        <td className="px-3 py-2 text-sm text-white/80">{row.target_start_date}</td>
                        <td className="px-3 py-2 text-sm text-white/80">{row.target_end_date}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            getTaskStatus(row) === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : getTaskStatus(row) === 'In Progress'
                              ? 'bg-sky-500/15 text-sky-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {getTaskStatus(row)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            row.driving_path_flag === 'Y'
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-white/10 text-white/50'
                          }`}>
                            {row.driving_path_flag === 'Y' ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-white/80">{row.task_type}</td>
                        <td className="px-3 py-2 text-sm text-white/80">{row.free_float_hr_cnt ? (parseInt(row.free_float_hr_cnt, 10) / 8).toFixed(1) : '0.0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTableData.length > displayedActivities.length && (
                  <p className="px-3 py-2 text-xs text-white/50">Showing {displayedActivities.length} of {filteredTableData.length.toLocaleString()} activities. Export the CSV for the complete data set.</p>
                )}
              </div>
            </section>
          )}

          <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row">
            <span>{hasScheduleData ? 'Dashboard generated with live schedule data.' : 'Waiting for schedule upload to populate dashboard.'}</span>
            <div className="flex items-center gap-2 text-white/60">
              <span>powered by </span>
              <img src={MOVAR_LOGO_URL} alt="Movar" className="h-6 w-auto" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
