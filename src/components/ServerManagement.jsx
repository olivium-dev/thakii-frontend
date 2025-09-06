import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiServer, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle, 
  FiLoader,
  FiRefreshCw,
  FiActivity
} from 'react-icons/fi';

function ServerManagement() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'processing',
    description: ''
  });

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getServers();
      setServers(data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      toast.error('Failed to fetch servers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddServer = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.addServer(formData);
      
      if (result.success) {
        toast.success(result.message);
        setShowAddModal(false);
        resetForm();
        fetchServers();
      } else {
        toast.error(result.error || 'Failed to add server');
      }
    } catch (error) {
      console.error('Failed to add server:', error);
      toast.error('Failed to add server');
    }
  };

  const handleUpdateServer = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.updateServer(editingServer.id, formData);
      
      if (result.success) {
        toast.success(result.message);
        setEditingServer(null);
        resetForm();
        fetchServers();
      } else {
        toast.error(result.error || 'Failed to update server');
      }
    } catch (error) {
      console.error('Failed to update server:', error);
      toast.error('Failed to update server');
    }
  };

  const handleRemoveServer = async (serverId, serverName) => {
    if (!confirm(`Are you sure you want to remove server "${serverName}"?`)) {
      return;
    }

    try {
      const result = await apiService.removeServer(serverId);
      
      if (result.success) {
        toast.success(result.message);
        fetchServers();
      } else {
        toast.error(result.error || 'Failed to remove server');
      }
    } catch (error) {
      console.error('Failed to remove server:', error);
      toast.error('Failed to remove server');
    }
  };

  const handleHealthCheck = async () => {
    setIsChecking(true);
    try {
      const result = await apiService.checkServersHealth();
      
      toast.success(
        `Health check complete: ${result.healthy_servers}/${result.total_servers} servers healthy`,
        { duration: 4000 }
      );
      
      fetchServers(); // Refresh the list
    } catch (error) {
      console.error('Failed to check servers health:', error);
      toast.error('Failed to check servers health');
    } finally {
      setIsChecking(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      type: 'processing',
      description: ''
    });
  };

  const openEditModal = (server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      url: server.url,
      type: server.type,
      description: server.description || ''
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingServer(null);
    resetForm();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FiCheckCircle className="text-green-500" />;
      case 'inactive':
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiLoader className="text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <FiServer className="mr-2" />
            Processing Servers Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage backend servers for distributed video processing workload
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleHealthCheck}
            disabled={isChecking}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isChecking ? (
              <FiLoader className="animate-spin mr-2" />
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            Health Check
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="mr-2" />
            Add Server
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <FiLoader className="animate-spin text-2xl text-gray-400" />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-8">
          <FiServer className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No servers configured yet</p>
          <p className="text-sm text-gray-400">Add your first processing server to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Server
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {servers.map((server) => (
                <tr key={server.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {server.name}
                      </div>
                      {server.description && (
                        <div className="text-sm text-gray-500">
                          {server.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={server.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {server.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                      {getStatusIcon(server.status)}
                      <span className="ml-1 capitalize">{server.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {server.health_status ? (
                      <div>
                        {server.health_status.healthy ? (
                          <span className="text-green-600">✓ Healthy</span>
                        ) : (
                          <span className="text-red-600">✗ {server.health_status.error}</span>
                        )}
                        {server.health_status.response_time && (
                          <div className="text-xs text-gray-400">
                            {Math.round(server.health_status.response_time * 1000)}ms
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {server.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(server)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleRemoveServer(server.id, server.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Server Modal */}
      {(showAddModal || editingServer) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModals}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={editingServer ? handleUpdateServer : handleAddServer}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingServer ? 'Edit Server' : 'Add New Server'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Server Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Production Server 1"
                      />
                    </div>

                    <div>
                      <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                        Server URL *
                      </label>
                      <input
                        type="url"
                        id="url"
                        required
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://server1.example.com:5001"
                      />
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Server Type
                      </label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="processing">Processing</option>
                        <option value="backup">Backup</option>
                        <option value="testing">Testing</option>
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
                        placeholder="Optional description of this server"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingServer ? 'Update Server' : 'Add Server'}
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

export default ServerManagement;