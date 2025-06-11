import { Link, useLocation } from 'react-router-dom';
import { Home, FlaskConical } from 'lucide-react';

interface HeaderProps {
  showHomeButton?: boolean;
}

const MovarLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 404.933 72.162" className="h-12 w-auto">
    <g>
      <circle fill="#0073FF" cx="394.675" cy="61.914" r="10.258"/>
      <g>
        <path fill="currentColor" d="M78.798,0.005c-1.669,0-0.894,0-2.563,0c-8.613,0-16.09,2.462-21.513,6.919 C49.207,2.466,41.682,0.005,33.23,0.005c-1.669,0-0.895,0-2.563,0C12.971,0.005,0,10.325,0,27.214v43.52h18.55V31.977 c0-9.454,5.751-14.611,13.51-14.765c7.758,0.154,13.509,5.311,13.509,14.765v38.757h18.55V31.977 c0-9.454,5.751-14.611,13.51-14.765c7.758,0.154,13.509,5.311,13.509,14.765v38.757h18.55v-43.52 C109.687,10.325,96.163,0.005,78.798,0.005z"/>
        <g>
          <path fill="currentColor" d="M153.545,0c21.294,0,37.026,15.661,37.026,36.086c0,20.498-15.732,36.086-37.026,36.086 c-21.216,0-37.021-15.588-37.021-36.086C116.524,15.661,132.329,0,153.545,0z M153.545,55.429 c10.898,0,18.623-8.227,18.623-19.343c0-11.042-7.725-19.27-18.623-19.27c-10.825,0-18.618,8.227-18.618,19.27 C134.927,47.202,142.72,55.429,153.545,55.429z"/>
          <path fill="currentColor" d="M263.392,35.942C263.392,14.939,277.757,0,296.81,0c10.752,0,18.042,4.114,22.588,9.814l0.361-8.371h18.115v69.286h-18.115l-0.361-8.371c-4.546,5.774-11.836,9.814-22.588,9.814C277.757,72.172,263.392,56.945,263.392,35.942z M300.418,16.528c-11.113,0-18.623,8.371-18.623,19.414c0,11.116,7.51,19.775,18.623,19.775c11.04,0,18.911-8.66,18.911-19.775 C319.329,24.9,311.458,16.528,300.418,16.528z"/>
          <path fill="currentColor" d="M244.843,1.443l-16.699,49c-0.421,1.199-2.117,1.199-2.538,0l-16.699-49h-19.634l22.522,60.679 c2.295,6.037,8.075,10.033,14.533,10.048c0,0,0.396,0.001,0.547,0.001c0.158,0,0.547-0.001,0.547-0.001 c6.458-0.015,12.238-4.012,14.533-10.048l22.522-60.679H244.843z"/>
        </g>
        <path fill="currentColor" d="M387.205,0.047c-0.38-0.012-1.795-0.042-3.463-0.042c-17.695,0-34.32,9.861-34.32,30.679v40.05h18.55V31.977 c0-10.388,7.333-14.527,19.234-14.527V0.047z"/>
      </g>
    </g>
  </svg>
);

export function Header({ showHomeButton = true }: HeaderProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-white/5 backdrop-blur-sm bg-dark/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-white hover:text-white/90 transition-colors">
            <MovarLogo />
          </Link>
          <nav className="flex items-center gap-2">
            {showHomeButton && (
              <>
                <Link 
                  to="/"
                  className={`relative group overflow-hidden px-4 py-2 rounded-full transition-all duration-300 text-sm flex items-center gap-2 ${
                    isActive('/') ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Home className="w-4 h-4" />
                  <span className="font-medium">Home</span>
                </Link>
                <div className="h-6 w-px bg-white/10" />
              </>
            )}
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10">
              <Link 
                to="/services"
                className={`relative group overflow-hidden px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isActive('/services') ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className={`relative z-10 font-medium ${
                  isActive('/services') ? '' : 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                }`}>Services</span>
              </Link>
              <Link 
                to="/report"
                className={`relative group overflow-hidden px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isActive('/report') ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className={`relative z-10 font-medium ${
                  isActive('/report') ? '' : 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                }`}>Demo Report</span>
              </Link>
              <Link 
                to="/tools"
                className={`relative group overflow-hidden px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isActive('/tools') ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className={`relative z-10 font-medium ${
                  isActive('/tools') ? '' : 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                }`}>AI Tools</span>
              </Link>
              <Link 
                to="/movar-tools"
                className={`relative group overflow-hidden px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isActive('/movar-tools') ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className={`relative z-10 font-medium flex items-center gap-2 ${
                  isActive('/movar-tools') ? 'text-white' : 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                }`}>
                  <FlaskConical className={isActive('/movar-tools') ? 'text-white' : 'text-primary'} size={16} />
                  <span>Movar Dev Lab</span>
                </div>
              </Link>
              <Link 
                to="/ai-policy"
                className={`relative group overflow-hidden px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isActive('/ai-policy') ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className={`relative z-10 font-medium ${
                  isActive('/ai-policy') ? '' : 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                }`}>AI Policy</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}