import { ExternalLink, Search } from 'lucide-react';
import { tools } from '../data/tools';
import { useState } from 'react';
import { Header } from './Header';

export function AIToolsDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header showToolsButton={false} />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Verified AI Tools Directory
          </h1>
          <p className="text-lg text-white/70">
            A curated collection of AI tools tested and verified by Movar experts
          </p>
        </div>

        <div className="relative max-w-xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search AI tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="group bg-dark-lighter/80 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4 p-6">
                <h3 className="text-xl font-semibold text-white">
                  {tool.name}
                </h3>
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
                <p className="text-white/60 mb-4">{tool.description}</p>
                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary/90"
                    >
                      {tag}
                    </span>
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