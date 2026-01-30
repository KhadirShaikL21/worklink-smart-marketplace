import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Search, PlusCircle, Home } from 'lucide-react';

export default function ThankYou() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600 mb-8">
          The job has been successfully completed. We hope you had a great experience with WorkLink.
        </p>

        <div className="space-y-4">
          <Link
            to="/jobs"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Search className="w-5 h-5 mr-2" />
            Find More Jobs
          </Link>
          
          <Link
            to="/jobs/new"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Post a New Job
          </Link>

          <Link
            to="/"
            className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
