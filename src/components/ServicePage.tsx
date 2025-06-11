import { Header } from './Header';

const services = [
  {
    title: 'Data Analytics',
    description: 'Transform raw data into actionable insights with our advanced analytics solutions.',
    icon: '📊',
    features: [
      'Exploratory Data Analysis (EDA)',
      'Power BI Reporting',
      'Interactive Dashboards',
      'Data Visualization',
      'Statistical Analysis',
      'Performance Metrics & KPIs'
    ]
  },
  {
    title: 'Automated Reporting Systems',
    description: 'Streamline your reporting process with intelligent automation systems.',
    icon: '📈',
    features: [
      'Bronze Tier - Azure & Power BI Integration',
      'Silver Tier - Azure, Power BI, Power Apps',
      'AI Driven Insights',
      'Automated Data Processing',
      'Custom Report Generation',
      'Real-time Data Updates'
    ]
  },
  {
    title: 'Power Platform Solutions',
    description: 'Custom solutions built on Microsoft Power Platform to enhance business productivity.',
    icon: '⚡',
    features: [
      'Utility Power Apps Development',
      'Custom Business Applications',
      'Process Automation',
      'Workflow Integration',
      'Power Platform Consulting',
      'User Training and Support'
    ]
  },
  {
    title: 'AI & ML Solutions',
    description: 'Cutting-edge artificial intelligence and machine learning solutions for your business.',
    icon: '🤖',
    features: [
      'Custom Machine Learning Solutions',
      'Deep Learning Implementation',
      'Data Classification Systems',
      'Data Mapping Solutions',
      'Image Classification',
      'Predictive Analytics'
    ]
  },
  {
    title: 'AI Workers & Chatbots',
    description: 'Intelligent automation and conversational AI solutions for enhanced business operations.',
    icon: '🗣️',
    features: [
      'Custom Chatbot Development',
      'AI Agents Implementation',
      'Organization Data Integration',
      'Natural Language Processing',
      'Automated Customer Support',
      '24/7 Digital Assistance'
    ]
  },
  {
    title: 'Digital PMO',
    description: 'Modern project management office solutions for the digital age.',
    icon: '📱',
    features: [
      'Full Digital Project Management',
      'Resource Allocation',
      'Project Timeline Tracking',
      'Budget Management',
      'Risk Assessment',
      'Stakeholder Communication'
    ]
  }
];

export function ServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header showServicesButton={false} />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Our Service Offerings
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Comprehensive solutions to drive your digital transformation journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group bg-dark-lighter/80 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow"
            >
              <div className="p-6">
                <div className="text-4xl mb-4 filter drop-shadow-lg">{service.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {service.title}
                </h3>
                <p className="text-white/60 mb-6">
                  {service.description}
                </p>
                <div className="space-y-3">
                  {service.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 text-white/60 group-hover:text-white/70 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 bg-dark-lighter/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40">
          <p>&copy; 2025 Movar Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}