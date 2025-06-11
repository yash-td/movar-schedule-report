import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Search, Sparkles, HelpCircle, MousePointer2, Timer, Gamepad2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { CursorGame } from './CursorGame';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface HomePageProps {
  onOpenChat: (message?: string) => void;
}

interface RegistrationData {
  name: string;
  email: string;
  organization: string;
  role: string;
  phone: string;
  help_description: string;
}

const suggestions = {
  visual: [
    "visual Show me the project timeline visualization",
    "visual Display the budget allocation breakdown",
    "visual Show resource utilization chart",
    "visual Display the risk assessment radar chart",
    "visual Show me the project progress chart"
  ],
  text: [
    "How can Movar help me implement a Digital PMO for my organisation?",
    "How can Movar help me resolve data silos?",
    "How can Movar help me automate my reporting process?",
    "What AI solutions does Movar offer?",
    "How can Movar help me with data analytics?",
    "Tell me about your automated reporting systems",
    "What Power Platform solutions do you provide?",
    "How do you handle project risk assessment?",
    "Can you explain your AI Workers capabilities?",
    "What makes Movar's Digital PMO different?",
    "How do you ensure data security?",
    "What industries do you specialize in?",
    "How do you handle change management?",
    "What's your approach to process automation?",
    "How can AI improve our project delivery?"
  ]
};

export function HomePage({ onOpenChat }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [clickCount, setClickCount] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [showVictory, setShowVictory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    organization: '',
    role: '',
    phone: '',
    help_description: ''
  });
  const [showForm, setShowForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const allSuggestions = [...suggestions.visual, ...suggestions.text];

  useEffect(() => {
    if (isGameActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsGameActive(false);
      setClickCount(0);
    }
  }, [isGameActive, timeLeft]);

  const handleGameStart = () => {
    if (!isGameActive) {
      setIsGameActive(true);
      setTimeLeft(5);
      setClickCount(0);
      setShowVictory(false);
    }
  };

  const handleClick = () => {
    if (isGameActive && timeLeft > 0) {
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);
      
      if (newClickCount >= 30) {
        setIsGameActive(false);
        setShowVictory(true);
        setTimeout(() => {
          setShowVictory(false);
          setClickCount(0);
        }, 3000);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenChat(searchQuery);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onOpenChat(suggestion);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(allSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const { error } = await supabase
        .from('registrations')
        .insert([formData]);

      if (error) throw error;

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        organization: '',
        role: '',
        phone: '',
        help_description: ''
      });
      setTimeout(() => {
        setShowForm(false);
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedSuggestionIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col" onClick={handleClick}>
      <CursorGame />
      <Header showHomeButton={false} />

      {isGameActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-3 border border-white/20 backdrop-blur-sm">
          <Timer className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-bold">{timeLeft}s</span>
          <span className="text-white/90">|</span>
          <span className="text-white">{clickCount}/30 clicks</span>
        </div>
      )}

      {showVictory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-2xl shadow-2xl text-center animate-bounce">
            <h2 className="text-2xl font-bold text-white mb-4">🎉 Victory! 🎉</h2>
            <p className="text-white/90">Now get back to work, you procrastinator! 😄</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-dark-lighter/95 rounded-2xl shadow-2xl w-full max-w-lg border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Register Interest</h2>
              <p className="text-white/70 mt-2">Tell us about your needs and how we can help</p>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-white/70 mb-1">Organization</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  required
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white/70 mb-1">Role</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Project Manager"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-1">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="+44 7700 900000"
                />
              </div>

              <div>
                <label htmlFor="help_description" className="block text-sm font-medium text-white/70 mb-1">How can Movar help you?</label>
                <textarea
                  id="help_description"
                  name="help_description"
                  required
                  value={formData.help_description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Tell us about your needs and how we can help..."
                />
              </div>

              {submitStatus && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  submitStatus === 'success' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {submitStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <p>Thank you for your interest! We'll be in touch soon.</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>Something went wrong. Please try again later.</p>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-lg px-6 py-2 font-medium disabled:opacity-50 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-5 h-5" />
                      <span>Submit</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
            <div className="text-center mb-12">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Transform Your Business
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  With Automation and AI
                </span>
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
                Unlock the power of safe artificial intelligence, data analytics and automation to drive innovation and growth for your organisation
              </p>

              <div className="max-w-2xl mx-auto relative mb-8">
                <form onSubmit={handleSearch} className="relative group">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask 'Compass' our AI assistant, about our services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-12 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg hover:border-primary/50 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors"
                    aria-label="Submit search"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                {showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-gradient-to-br from-gray-900/95 to-blue-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto"
                  >
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
                      <h3 className="text-white/90 text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Visualization Prompts
                      </h3>
                    </div>
                    {suggestions.visual.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full text-left px-4 py-3 text-white/80 transition-all duration-200 relative group
                          ${index === selectedSuggestionIndex ? 'bg-gradient-to-r from-primary/20 to-secondary/20' : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10'}`}
                      >
                        <div className="relative z-10">
                          {suggestion}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-secondary/0 group-hover:from-primary/5 group-hover:to-secondary/5 transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
                      <h3 className="text-white/90 text-sm font-medium flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        General Questions
                      </h3>
                    </div>
                    {suggestions.text.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full text-left px-4 py-3 text-white/80 transition-all duration-200 relative group
                          ${index + suggestions.visual.length === selectedSuggestionIndex ? 'bg-gradient-to-r from-primary/20 to-secondary/20' : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10'}`}
                      >
                        <div className="relative z-10">
                          {suggestion}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-secondary/0 group-hover:from-primary/5 group-hover:to-secondary/5 transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative inline-block group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200 animate-gradient-x"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur opacity-30 group-hover:opacity-75 mix-blend-screen transition-all duration-500"></div>
                <button
                  onClick={() => setShowForm(true)}
                  className="relative inline-flex items-center gap-2 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-x text-white rounded-full px-8 py-4 text-lg font-medium shadow-[0_0_20px_rgba(17,141,255,0.3)] hover:shadow-[0_0_25px_rgba(17,141,255,0.5)] transition-all duration-300 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="font-semibold tracking-wide">Register Interest</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl" />
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-secondary/20 rounded-full filter blur-3xl" />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 bg-dark-lighter/80 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <p className="text-white/40">&copy; 2025 Movar Group. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGameStart}
              disabled={isGameActive}
              className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:hover:bg-white/10"
            >
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span className="text-white/90 font-medium">Fidget Clicker</span>
            </button>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-primary" />
              <span className="text-white/90 font-medium">{clickCount} clicks</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}