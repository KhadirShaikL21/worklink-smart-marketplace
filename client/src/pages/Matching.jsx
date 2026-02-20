import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { User, Star, MapPin, IndianRupee, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Matching() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [workersNeeded, setWorkersNeeded] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const j = await api.get(`/api/jobs/${jobId}`);
        setJob(j.data.job);
        setWorkersNeeded(j.data.job?.workersNeeded || 1);
        const r = await api.post(`/api/matching/${jobId}/rank`, {});
        setRanking(r.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load matching');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  const handleAssign = async (workerId) => {
    setAssigning(true);
    setError('');
    try {
      await api.post(`/api/jobs/${jobId}/assign`, { 
        count: 1,
        workerIds: [workerId] 
      });
      const j = await api.get(`/api/jobs/${jobId}`);
      setJob(j.data.job);
      alert('Worker assigned successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    setError('');
    try {
      await api.post(`/api/jobs/${jobId}/assign`, { count: Number(workersNeeded) || 1 });
      const j = await api.get(`/api/jobs/${jobId}`);
      setJob(j.data.job);
      alert('Auto-assignment complete!');
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleOptimize = async () => {
    if (!job.skillsRequired || job.skillsRequired.length === 0) {
      setError('Job has no required skills to optimize for.');
      return;
    }
    setOptimizing(true);
    setError('');
    try {
      // Create a role for each required skill
      const roles = job.skillsRequired.map(skill => ({ role: skill, skill: skill }));
      
      const res = await api.post(`/api/jobs/${jobId}/team/optimize`, { roles });
      
      const { assignments } = res.data;
      if (assignments && assignments.length > 0) {
          alert(`Team formed successfully with ${assignments.length} workers!`);
          const j = await api.get(`/api/jobs/${jobId}`);
          setJob(j.data.job);
      } else {
          alert('Could not find optimal assignments for all roles.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate(`/jobs/${jobId}`)}
        className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Job Details
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Job Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                <p className="mt-1 text-sm text-gray-900">{job.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">{job.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {job.status}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Required Skills</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(job.skillsRequired || []).map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Results */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Matching Candidates</h2>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                min="1" 
                value={workersNeeded} 
                onChange={e => setWorkersNeeded(e.target.value)}
                className="w-16 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              <button
                onClick={handleAutoAssign}
                disabled={assigning || optimizing || job.status !== 'open'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Auto-assign'}
              </button>
              <button
                onClick={handleOptimize}
                disabled={assigning || optimizing || job.status !== 'open'}
                className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {optimizing ? 'Optimizing...' : 'Optimize Team'}
              </button>
            </div>
          </div>

          {!ranking || !ranking.ranked?.length ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting job requirements or location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ranking.ranked.map(candidate => (
                <div key={candidate.workerId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                        {candidate.score > 80 ? 'A+' : candidate.score > 60 ? 'A' : 'B'}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Worker {(candidate.workerId || 'unknown').toString().slice(-4)}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            Match Score: {candidate.score}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            {candidate.distanceKm?.toFixed(1)} km away
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 flex items-center justify-end">
                        <IndianRupee className="w-4 h-4 text-gray-400" />
                        {candidate.hourlyRate}/hr
                      </div>
                      <button
                        onClick={() => handleAssign(candidate.workerId)}
                        disabled={assigning || job.status !== 'open'}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-primary-600 text-xs font-medium rounded text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Select & Assign
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(candidate.skills || []).map((skill, idx) => (
                        <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          job.skillsRequired?.includes(skill) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
