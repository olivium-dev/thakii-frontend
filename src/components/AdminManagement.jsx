import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiUsers, 
  FiUserPlus, 
  FiEdit, 
  FiTrash2, 
  FiShield, 
  FiUserCheck,
  FiUserX,
  FiLoader,
  FiRefreshCw,
  FiStar
} from 'react-icons/fi';

function AdminManagement() {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [adminStats, setAdminStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin',
    description: ''
  });

  // Super admin emails (read-only)
  const SUPER_ADMINS = ['ouday.khaled@gmail.com', 'appsaawt@gmail.com'];
  const isSuperAdmin = SUPER_ADMINS.includes(currentUser?.email);

  useEffect(() => {
    fetchAdmins();
    fetchAdminStats();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      toast.error('Failed to fetch admins');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await apiService.getAdminStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.addAdmin(formData);
      
      if (result.success) {
        toast.success(result.message);
        setShowAddModal(false);
        resetForm();
        fetchAdmins();
        fetchAdminStats();
      } else {
        toast.error(result.error || 'Failed to add admin');
      }
    } catch (error) {
      console.error('Failed to add admin:', error);
      toast.error('Failed to add admin');
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.updateAdmin(editingAdmin.id, formData);
      
      if (result.success) {
        toast.success(result.message);
        setEditingAdmin(null);
        resetForm();
        fetchAdmins();
        fetchAdminStats();
      } else {
        toast.error(result.error || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Failed to update admin:', error);
      toast.error('Failed to update admin');
    }
  };

  const handleRemoveAdmin = async (adminId, adminEmail) => {
    if (SUPER_ADMINS.includes(adminEmail)) {
      toast.error('Cannot remove super admin');
      return;
    }

    if (!confirm(`Are you sure you want to remove admin "${adminEmail}"?`)) {
      return;
    }

    try {
      const result = await apiService.removeAdmin(adminId);
      
      if (result.success) {
        toast.success(result.message);
        fetchAdmins();
        fetchAdminStats();
      } else {
        toast.error(result.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Failed to remove admin:', error);
      toast.error('Failed to remove admin');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      role: 'admin',
      description: ''
    });
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      role: admin.role,
      description: admin.description || ''
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingAdmin(null);
    resetForm();
  };

  const getStatusIcon = (status, isSuperAdmin) => {
    if (isSuperAdmin) {
      return <FiStar className="text-yellow-500" title="Super Admin" />;
    }
    
    switch (status) {
      case 'active':
        return <FiUserCheck className="text-green-500" />;
      case 'removed':
        return <FiUserX className="text-red-500" />;
      default:
        return <FiLoader className="text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status, isSuperAdmin) => {
    if (isSuperAdmin) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'moderator':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  // Show message if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="text-center py-8">
          <FiShield className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">Super Admin Access Required</p>
          <p className="text-sm text-gray-400">Only super admins can manage admin users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <FiUsers className="mr-2" />
            Admin Users Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage admin users and their permissions
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => { fetchAdmins(); fetchAdminStats(); }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiUserPlus className="mr-2" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Admin Stats */}
      {adminStats.total_admins !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiUsers className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-blue-600">Total Admins</p>
                <p className="text-xl font-semibold text-blue-900">{adminStats.total_admins}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiUserCheck className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-green-600">Active</p>
                <p className="text-xl font-semibold text-green-900">{adminStats.active_admins}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiStar className="text-yellow-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-yellow-600">Super Admins</p>
                <p className="text-xl font-semibold text-yellow-900">{adminStats.super_admins}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiUserX className="text-red-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-red-600">Removed</p>
                <p className="text-xl font-semibold text-red-900">{adminStats.removed_admins}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <FiLoader className="animate-spin text-2xl text-gray-400" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-8">
          <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No admin users found</p>
          <p className="text-sm text-gray-400">Add your first admin to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {admin.is_super_admin && <FiStar className="text-yellow-500 mr-2" />}
                        {admin.email}
                      </div>
                      {admin.description && (
                        <div className="text-sm text-gray-500">
                          {admin.description}
                        </div>
                      )}
                      {admin.added_by && (
                        <div className="text-xs text-gray-400">
                          Added by: {admin.added_by}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(admin.role)}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(admin.status, admin.is_super_admin)}`}>
                      {getStatusIcon(admin.status, admin.is_super_admin)}
                      <span className="ml-1 capitalize">{admin.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {formatDate(admin.last_login)}
                      {admin.login_count > 0 && (
                        <div className="text-xs text-gray-400">
                          {admin.login_count} logins
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(admin.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!admin.is_super_admin && admin.status === 'active' && (
                        <>
                          <button
                            onClick={() => openEditModal(admin)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Admin"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove Admin"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                      {admin.is_super_admin && (
                        <span className="text-gray-400 text-xs">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Admin Modal */}
      {(showAddModal || editingAdmin) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModals}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        disabled={!!editingAdmin}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        placeholder="admin@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional description of this admin's role"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingAdmin ? 'Update Admin' : 'Add Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagement;