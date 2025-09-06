import React from 'react';
import { Server, Database, HardDrive, Clock } from 'lucide-react';

const ServiceStatus = ({ healthStatus }) => {
  if (!healthStatus) {
    return null;
  }

  const { service, status, database, storage, timestamp } = healthStatus;

  const formatTimestamp = (ts) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Service Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Service Status */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className={`p-2 rounded-full ${
            status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Server className={`w-5 h-5 ${
              status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Service</p>
            <p className={`text-xs ${
              status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {status === 'healthy' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 rounded-full bg-blue-100">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Database</p>
            <p className="text-xs text-blue-600">
              {database || 'Connected'}
            </p>
          </div>
        </div>

        {/* Storage Status */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 rounded-full bg-purple-100">
            <HardDrive className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Storage</p>
            <p className="text-xs text-purple-600">
              {storage || 'Available'}
            </p>
          </div>
        </div>

        {/* Last Check */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 rounded-full bg-gray-100">
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Last Check</p>
            <p className="text-xs text-gray-600">
              {timestamp ? formatTimestamp(timestamp) : 'Just now'}
            </p>
          </div>
        </div>
      </div>

      {/* Service Name */}
      {service && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Service:</span> {service}
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceStatus;