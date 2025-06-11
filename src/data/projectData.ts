export const constructionProjectData = {
  timeline: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Baseline Progress (%)',
        data: [2, 5, 10, 20, 35, 55, 75, 88, 95, 98, 99, 100],
        borderColor: '#118DFF',
        backgroundColor: 'rgba(17, 141, 255, 0.1)',
        tension: 0.4,
        fill: true,
        milestones: [
          { month: 'Jan', milestone: 'Project Kickoff' },
          { month: 'Mar', milestone: 'Foundation Complete' },
          { month: 'Jun', milestone: 'Structure Complete' },
          { month: 'Sep', milestone: 'MEP Systems Installation' },
          { month: 'Dec', milestone: 'Project Completion' }
        ]
      },
      {
        label: 'Forecast Progress (%)',
        data: [1, 2, 4, 8, 15, 35, 55, 68, 82, 90, 95, 100],
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        tension: 0.4,
        fill: true,
        milestones: [
          { month: 'Jan', milestone: 'Delayed Start' },
          { month: 'Apr', milestone: 'Foundation Complete' },
          { month: 'Jul', milestone: 'Structure Complete' },
          { month: 'Oct', milestone: 'MEP Systems Installation' },
          { month: 'Dec', milestone: 'Project Completion' }
        ]
      }
    ]
  },
  budget: {
    labels: [
      'Foundation',
      'Structure',
      'MEP Systems',
      'Interior Finishes',
      'Exterior Works',
      'Equipment',
      'Labor',
      'Contingency'
    ],
    datasets: [{
      data: [1500000, 2800000, 1800000, 1200000, 900000, 700000, 2100000, 500000],
      backgroundColor: [
        'rgba(17, 141, 255, 0.8)',   // Primary blue
        'rgba(59, 161, 255, 0.8)',   // Secondary blue
        'rgba(100, 181, 255, 0.8)',  // Light blue
        'rgba(255, 107, 107, 0.8)',  // Red
        'rgba(255, 159, 67, 0.8)',   // Orange
        'rgba(46, 213, 115, 0.8)',   // Green
        'rgba(165, 94, 234, 0.8)',   // Purple
        'rgba(45, 152, 218, 0.8)'    // Dark blue
      ],
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 2
    }]
  },
  resources: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Labor (man-hours)',
        data: [240, 320, 280, 360, 420, 380],
        backgroundColor: 'rgba(17, 141, 255, 0.7)',
        borderColor: '#118DFF',
        borderWidth: 2,
        type: 'bar'
      },
      {
        label: 'Equipment (hours)',
        data: [160, 200, 180, 240, 280, 260],
        backgroundColor: 'rgba(46, 213, 115, 0.7)',
        borderColor: '#2ED573',
        borderWidth: 2,
        type: 'bar'
      },
      {
        label: 'Efficiency Index',
        data: [85, 92, 88, 95, 91, 89],
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        type: 'line',
        yAxisID: 'percentage',
        tension: 0.4
      }
    ]
  },
  risks: {
    labels: [
      'Weather Delays',
      'Supply Chain',
      'Labor Shortage',
      'Technical Issues',
      'Regulatory Compliance',
      'Budget Overrun',
      'Quality Control',
      'Safety Incidents'
    ],
    datasets: [
      {
        label: 'Risk Impact (1-10)',
        data: [7, 8, 6, 4, 5, 7, 6, 8],
        backgroundColor: 'rgba(17, 141, 255, 0.5)',
        borderColor: '#118DFF',
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Mitigation Effectiveness (1-10)',
        data: [6, 7, 8, 9, 8, 6, 8, 7],
        backgroundColor: 'rgba(46, 213, 115, 0.5)',
        borderColor: '#2ED573',
        borderWidth: 2,
        fill: true
      }
    ]
  }
};