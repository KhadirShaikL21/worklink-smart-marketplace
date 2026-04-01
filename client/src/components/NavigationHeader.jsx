import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable header component with back button and breadcrumbs
 * @param {string} title - Page title
 * @param {array} breadcrumbs - Array of {label, path} objects for breadcrumb navigation
 * @param {boolean} showBack - Whether to show back button
 * @param {function} onBackClick - Custom back handler (defaults to useNavigate(-1))
 */
export default function NavigationHeader({ 
  title, 
  breadcrumbs = [], 
  showBack = true, 
  onBackClick = null,
  subtitle = null 
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = onBackClick || (() => navigate(-1));

  return (
    <div className="mb-8">
      {/* Back Button and Title */}
      <div className="flex items-center gap-3 mb-6">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center text-sm text-gray-600 gap-1 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path || index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              {crumb.path ? (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-gray-700 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
