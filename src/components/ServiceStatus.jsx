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
      // More compact format for mobile
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const StatusCard = ({ icon: Icon, label, value, colorClass, bgClass }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className={`p-2 rounded-full ${bgClass} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <p className={`text-xs ${colorClass} truncate`} title={value}>
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="card">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Service Status
      </h2>

      {/* Mobile-optimized 2x2 grid, then responsive to larger screens */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={Server}
          label="Service"
          value={status === 'healthy' ? 'Online' : 'Offline'}
          colorClass={status === 'healthy' ? 'text-green-600' : 'text-red-600'}
          bgClass={status === 'healthy' ? 'bg-green-100' : 'bg-red-100'}
        />

        <StatusCard
          icon={Database}
          label="Database"
          value={database || 'Connected'}
          colorClass="text-blue-600"
          bgClass="bg-blue-100"
        />

        <StatusCard
          icon={HardDrive}
          label="Storage"
          value={storage || 'Available'}
          colorClass="text-purple-600"
          bgClass="bg-purple-100"
        />

        <StatusCard
          icon={Clock}
          label="Last Check"
          value={timestamp ? formatTimestamp(timestamp) : 'Just now'}
          colorClass="text-gray-600"
          bgClass="bg-gray-100"
        />
      </div>

      {/* Service Name - More compact on mobile */}
      {service && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 truncate" title={service}>
            <span className="font-medium">Service:</span> {service}
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceStatus;