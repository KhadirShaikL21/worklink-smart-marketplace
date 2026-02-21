import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Loader2, Check, Ban, Shield, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Assuming we have i18n otherwise I'll remove

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/users`, { params: { page, search } });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
        fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [page, search]);

  const handleStatusChange = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action.replace('_', ' ')} this user?`)) return;
    
    setActionLoading(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { action });
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                   <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                     <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                     Loading users...
                   </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-gray-500">{user.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                        ${user.roles.includes('admin') ? 'bg-purple-100 text-purple-800' : 
                          user.roles.includes('worker') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {user.roles.join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${user.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {user.status || 'active'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {user.status !== 'banned' ? (
                            <button 
                                onClick={() => handleStatusChange(user._id, 'ban')}
                                disabled={actionLoading === user._id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Ban User"
                            >
                                <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                             <button
                                onClick={() => handleStatusChange(user._id, 'unban')}
                                disabled={actionLoading === user._id} 
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Unban User"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          {!user.verification?.adminApproved && (
                             <button 
                                onClick={() => handleStatusChange(user._id, 'verify_id')}
                                disabled={actionLoading === user._id}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Approve ID"
                             >
                                <Shield className="w-4 h-4" />
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
           >
             Previous
           </button>
           <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
           <button 
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
           >
             Next
           </button>
        </div>
      </div>
    </div>
  );
}
