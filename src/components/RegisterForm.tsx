import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Header } from './Header';
import { Send, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface FormData {
  name: string;
  email: string;
  organization: string;
  role: string;
  phone: string;
  help_description: string;
}

const countryCodes = [
  // Europe
  { code: '+44', country: 'United Kingdom' },
  { code: '+353', country: 'Ireland' },
  { code: '+33', country: 'France' },
  { code: '+49', country: 'Germany' },
  { code: '+34', country: 'Spain' },
  { code: '+39', country: 'Italy' },
  { code: '+31', country: 'Netherlands' },
  { code: '+32', country: 'Belgium' },
  { code: '+352', country: 'Luxembourg' },
  { code: '+41', country: 'Switzerland' },
  { code: '+43', country: 'Austria' },
  { code: '+46', country: 'Sweden' },
  { code: '+47', country: 'Norway' },
  { code: '+45', country: 'Denmark' },
  { code: '+358', country: 'Finland' },
  { code: '+354', country: 'Iceland' },
  { code: '+48', country: 'Poland' },
  { code: '+420', country: 'Czech Republic' },
  { code: '+421', country: 'Slovakia' },
  { code: '+36', country: 'Hungary' },
  { code: '+40', country: 'Romania' },
  { code: '+30', country: 'Greece' },
  { code: '+351', country: 'Portugal' },
  { code: '+359', country: 'Bulgaria' },
  { code: '+385', country: 'Croatia' },
  { code: '+386', country: 'Slovenia' },
  { code: '+372', country: 'Estonia' },
  { code: '+371', country: 'Latvia' },
  { code: '+370', country: 'Lithuania' },
  
  // North America
  { code: '+1', country: 'United States' },
  { code: '+1', country: 'Canada' },
  { code: '+52', country: 'Mexico' },
  
  // Asia
  { code: '+81', country: 'Japan' },
  { code: '+82', country: 'South Korea' },
  { code: '+86', country: 'China' },
  { code: '+852', country: 'Hong Kong' },
  { code: '+886', country: 'Taiwan' },
  { code: '+65', country: 'Singapore' },
  { code: '+60', country: 'Malaysia' },
  { code: '+66', country: 'Thailand' },
  { code: '+84', country: 'Vietnam' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+971', country: 'UAE' },
  { code: '+972', country: 'Israel' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+974', country: 'Qatar' },
  
  // Oceania
  { code: '+61', country: 'Australia' },
  { code: '+64', country: 'New Zealand' },
  
  // South America
  { code: '+55', country: 'Brazil' },
  { code: '+54', country: 'Argentina' },
  { code: '+56', country: 'Chile' },
  { code: '+57', country: 'Colombia' },
  { code: '+51', country: 'Peru' },
  { code: '+58', country: 'Venezuela' },
  
  // Africa
  { code: '+27', country: 'South Africa' },
  { code: '+20', country: 'Egypt' },
  { code: '+234', country: 'Nigeria' },
  { code: '+254', country: 'Kenya' },
  { code: '+212', country: 'Morocco' },
  { code: '+216', country: 'Tunisia' }
].sort((a, b) => a.country.localeCompare(b.country));

export function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    organization: '',
    role: '',
    phone: '',
    help_description: ''
  });
  const [selectedCountryCode, setSelectedCountryCode] = useState('+44');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const submissionData = {
      ...formData,
      phone: selectedCountryCode + ' ' + formData.phone.replace(/^\+\d+\s*/, '')
    };

    try {
      const { error } = await supabase
        .from('registrations')
        .insert([submissionData]);

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
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'countryCode') {
      setSelectedCountryCode(value);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Register Interest</h1>
          <p className="text-xl text-white/70">
            Let us know how Movar can help transform your business
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-white/70 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  required
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white/70 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Project Manager"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-2">
                  Phone
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      name="countryCode"
                      value={selectedCountryCode}
                      onChange={handleChange}
                      className="appearance-none bg-white/10 border border-white/20 rounded-lg pl-3 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {countryCodes.map(({ code, country }) => (
                        <option key={`${code}-${country}`} value={code} className="bg-gray-900">
                          {code} {country}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="7700 900000"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="help_description" className="block text-sm font-medium text-white/70 mb-2">
                How can Movar help you?
              </label>
              <textarea
                id="help_description"
                name="help_description"
                required
                value={formData.help_description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tell us about your needs and how we can help..."
              />
            </div>

            <div className="mt-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-lg blur-xl opacity-50 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200 animate-gradient-x"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-lg blur opacity-30 group-hover:opacity-75 mix-blend-screen transition-all duration-500"></div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-x text-white rounded-lg px-6 py-4 flex items-center justify-center gap-2 font-medium shadow-[0_0_20px_rgba(17,141,255,0.3)] hover:shadow-[0_0_25px_rgba(17,141,255,0.5)] transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-semibold tracking-wide">
                        Submitting...
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="font-semibold tracking-wide">
                        Submit Registration
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {submitStatus && (
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
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
          </div>
        </form>
      </main>
    </div>
  );
}