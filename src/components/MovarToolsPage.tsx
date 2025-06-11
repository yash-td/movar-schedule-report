import { Header } from './Header';
import { ExternalLink } from 'lucide-react';

const tools = [
  {
    id: 'data-mapper',
    name: 'Data Mapper',
    description: 'Map data between unrelated tables using semantic matching and entity categorization. Perfect for assigning cost codes to activity names in project schedules.',
    url: 'https://movar-data-mapper.netlify.app/',
    icon: '🔄'
  },
  {
    id: 'find-tool',
    name: 'Find a Tool',
    description: 'Discover the perfect tool for your needs. Simply describe what you\'re looking for, and we\'ll find the best product recommendations.',
    url: 'https://findatool.netlify.app/',
    icon: '🔍'
  },
  {
    id: 'movar-reports',
    name: 'Movar Reports',
    description: 'Interactive and insightful reports built on freely available open source data.',
    url: 'https://movar-reports.netlify.app',
    icon: '📊'
  },
  {
    id: 'schedule-analyser',
    name: 'Schedule Analyser',
    description: 'Upload XER files to get a comprehensive 4-week look ahead and detailed breakdown of all schedule tables. Perfect for project planning and analysis.',
    url: 'https://movar-schedule-analyser.netlify.app',
    icon: '📅'
  }
];

export function MovarToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      <Header showToolsButton={false} />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Movar Tools
          </h1>
          <p className="text-lg text-white/70">
            Powerful tools developed by Movar to enhance your project management capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="group bg-dark-lighter/80 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl filter drop-shadow-lg">{tool.icon}</div>
                  <h3 className="text-xl font-semibold text-white">
                    {tool.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-secondary transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="px-6 pb-6">
                <p className="text-white/60">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-auto border-t border-white/5 py-8 bg-dark-lighter/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40">
          <p>&copy; 2025 Movar Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}