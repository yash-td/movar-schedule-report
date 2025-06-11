import { Header } from './Header';
import { Bar, Pie } from 'react-chartjs-2';
import { ExternalLink, Shield, Lock, UserCheck, Scale, Brain, Zap, FileCheck, AlertTriangle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function AIPolicyPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const adoptionData = {
    labels: ['Performance Analysis', 'Data Analysis', 'Administrative Tasks', 'Strategic Decision Support'],
    datasets: [{
      data: [28, 26, 25, 20],
      backgroundColor: [
        'rgba(17, 141, 255, 0.8)',   // Primary blue
        'rgba(59, 161, 255, 0.8)',   // Secondary blue
        'rgba(100, 181, 255, 0.8)',  // Light blue
        'rgba(141, 201, 255, 0.8)'   // Lighter blue
      ],
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 2
    }]
  };

  const benefitsData = {
    labels: ['Improved Project Outcomes', 'Enhanced Decision Making', 'Increased Efficiency', 'Other Benefits'],
    datasets: [{
      data: [70, 65, 60, 45],
      backgroundColor: [
        'rgba(46, 213, 115, 0.8)',   // Green
        'rgba(17, 141, 255, 0.8)',   // Blue
        'rgba(255, 159, 67, 0.8)',   // Orange
        'rgba(165, 94, 234, 0.8)'    // Purple
      ],
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  const policySection = (id: string, title: string, content: React.ReactNode) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <ChevronDown 
          className={`w-6 h-6 text-white/60 transition-transform ${
            expandedSections.includes(id) ? 'rotate-180' : ''
          }`} 
        />
      </button>
      {expandedSections.includes(id) && (
        <div className="px-8 pb-8">
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Policy & Guidelines
          </h1>
          <p className="text-lg text-white/70">
            Our commitment to responsible and secure AI implementation
          </p>
        </div>

        <div className="space-y-6">
          {/* Purpose & Scope */}
          {policySection('purpose', 'Purpose & Scope', (
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <p className="text-white/90">
                  Movar delivers project‐controls, data, and digital services to high‑value infrastructure programmes in defence, utilities, energy, rail, and other safety‑critical sectors. This policy sets the minimum requirements for the safe, secure, fair, and innovative use of artificial‑intelligence (AI) systems across Movar's operations and client engagements.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Core Principles
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      Preserves client trust and confidentiality
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      Complies with applicable law and regulation
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      Aligns with recognised ethical principles
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI Systems Covered
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      Generative LLM services via Azure OpenAI
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      ML models in project-controls tools
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      RPA bots with ML capabilities
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      AI-powered decision support
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {/* Data Security */}
          {policySection('security', 'Data Security & Governance', (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Data Protection
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      Azure-managed keys (AES-256)
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      TLS v1.2+ for data in transit
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      RBAC with least-privilege
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Compliance
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      UK GDPR & Data Protection Act 2018
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      ISO/IEC 27001:2022
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      NCSC Cloud Security Principles
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Critical Security Measures
                </h3>
                <ul className="space-y-2">
                  <li className="text-white/80">• All production AI workloads run inside Movar's Azure subscription in UK/EU regions</li>
                  <li className="text-white/80">• Private link endpoints block public-internet access</li>
                  <li className="text-white/80">• Privileged access requires PIM and MFA</li>
                  <li className="text-white/80">• 24-month immutable audit logging</li>
                </ul>
              </div>
            </div>
          ))}

          {/* Fair Use */}
          {policySection('fair-use', 'Fair & Ethical Use', (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Permitted Uses
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      Project planning insights
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      Schedule risk simulation
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      Cost-estimate generation
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      Document summarisation
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-xl text-white/90 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Prohibited Uses
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      Autonomous safety decisions
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      Deepfakes or deception
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      Unauthorized surveillance
                    </li>
                    <li className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      Public LLM data sharing
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {/* Industry Insights */}
          {policySection('insights', 'Industry Insights', (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-xl text-white/90 mb-6">AI Adoption in Project Management</h3>
                  <div className="h-[300px]">
                    <Bar data={adoptionData} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-xl text-white/90 mb-6">Benefits of AI Implementation</h3>
                  <div className="h-[300px]">
                    <Pie data={benefitsData} options={chartOptions} />
                  </div>
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <p className="text-white/90">
                  According to recent industry surveys, 70% of UK project managers have already integrated AI into their processes, 
                  with the majority reporting improved project outcomes. The UK's robust digital infrastructure and supportive 
                  regulatory environment position it as a leader in leveraging AI for infrastructure delivery.
                </p>
              </div>
            </div>
          ))}

          {/* Innovation Framework */}
          {policySection('innovation', 'Innovation & Adoption Framework', (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['Explore', 'Pilot', 'Scale', 'Evolve'].map((stage, index) => (
                  <div key={stage} className="bg-white/5 p-6 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <h3 className="text-xl text-white/90">{stage}</h3>
                    </div>
                    <p className="text-white/80">
                      {stage === 'Explore' && 'Ideate & prototype rapidly in a segregated sandbox.'}
                      {stage === 'Pilot' && 'Validate value & risk on limited scope.'}
                      {stage === 'Scale' && 'Deploy to production environments.'}
                      {stage === 'Evolve' && 'Continuous improvement & monitoring.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* References */}
          {policySection('references', 'References & Sources', (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a 
                href="https://www.apm.org.uk/news/seven-in-10-project-managers-have-benefited-from-the-implementation-of-artificial-intelligence-finds-latest-apm-survey/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 p-6 rounded-lg border border-white/10 group hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white/90 font-medium mb-2">Association for Project Management (APM)</h3>
                    <p className="text-white/60 text-sm">Seven in 10 project managers benefit from AI implementation</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-primary group-hover:text-secondary transition-colors" />
                </div>
              </a>

              <a 
                href="https://www.gov.uk/government/publications/data-analytics-and-ai-in-government-project-delivery"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 p-6 rounded-lg border border-white/10 group hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white/90 font-medium mb-2">UK Government</h3>
                    <p className="text-white/60 text-sm">Data Analytics and AI in Government Project Delivery</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-primary group-hover:text-secondary transition-colors" />
                </div>
              </a>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 bg-dark-lighter/80 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40">
          <p>&copy; 2025 Movar Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}