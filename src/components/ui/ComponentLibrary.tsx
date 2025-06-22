import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, CheckCircle, AlertCircle, Info, 
  Loader, RefreshCw, Search, Filter, Eye,
  EyeOff, ChevronDown, ChevronUp, X, Plus,
  Minus, ArrowUp, ArrowDown, TrendingUp,
  TrendingDown, Zap, Clock, DollarSign
} from 'lucide-react';

// Component Library showcasing all UI elements in various states
export function ComponentLibrary() {
  const [activeTab, setActiveTab] = useState('buttons');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const tabs = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'cards', label: 'Cards' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'data', label: 'Data Display' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bitcoin On-Chain UI Component Library
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive showcase of all UI components in their various states, 
            designed for optimal user experience across all devices.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Component Sections */}
        <div className="space-y-8">
          {/* Buttons */}
          {activeTab === 'buttons' && (
            <ComponentSection title="Buttons" description="Interactive button components with various states and styles">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Primary Buttons */}
                <ComponentDemo title="Primary Buttons">
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Primary Button
                    </button>
                    <button className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl opacity-50 cursor-not-allowed font-medium">
                      Disabled State
                    </button>
                    <button 
                      className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center"
                      onClick={() => setLoading(!loading)}
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Click for Loading'
                      )}
                    </button>
                  </div>
                </ComponentDemo>

                {/* Secondary Buttons */}
                <ComponentDemo title="Secondary Buttons">
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium">
                      Secondary Button
                    </button>
                    <button className="w-full px-4 py-3 border-2 border-orange-500 text-orange-500 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium">
                      Outline Button
                    </button>
                    <button className="w-full px-4 py-3 text-orange-500 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium">
                      Ghost Button
                    </button>
                  </div>
                </ComponentDemo>

                {/* Icon Buttons */}
                <ComponentDemo title="Icon Buttons">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200">
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200">
                        <Search className="h-5 w-5" />
                      </button>
                      <button className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </div>
                    <button className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 font-medium flex items-center justify-center">
                      <Activity className="h-5 w-5 mr-2" />
                      With Icon
                    </button>
                  </div>
                </ComponentDemo>
              </div>
            </ComponentSection>
          )}

          {/* Cards */}
          {activeTab === 'cards' && (
            <ComponentSection title="Cards" description="Card components for displaying data and content">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <ComponentDemo title="Metric Cards">
                  <div className="space-y-4">
                    <MetricCard
                      title="Network Activity"
                      icon={<Activity className="h-6 w-6 text-purple-500" />}
                      value="1,234"
                      label="Active Nodes"
                      trend={{ value: 5.2, direction: 'up' }}
                    />
                    <MetricCard
                      title="Fee Estimates"
                      icon={<DollarSign className="h-6 w-6 text-green-500" />}
                      value="25 sat/vB"
                      label="Next Block"
                      trend={{ value: 2.1, direction: 'down' }}
                    />
                  </div>
                </ComponentDemo>

                {/* Status Cards */}
                <ComponentDemo title="Status Cards">
                  <div className="space-y-4">
                    <StatusCard
                      status="success"
                      title="Network Healthy"
                      description="All systems operational"
                    />
                    <StatusCard
                      status="warning"
                      title="High Fees"
                      description="Network congestion detected"
                    />
                    <StatusCard
                      status="error"
                      title="Connection Lost"
                      description="Unable to fetch data"
                    />
                  </div>
                </ComponentDemo>

                {/* Interactive Cards */}
                <ComponentDemo title="Interactive Cards">
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Hover Card</h3>
                        <Zap className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="text-gray-600 text-sm">
                        This card responds to hover interactions with smooth animations.
                      </p>
                    </motion.div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Expandable Card</h3>
                          <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          </motion.div>
                        </div>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: expanded ? 'auto' : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 border-t border-gray-100">
                          <p className="text-gray-600 text-sm">
                            This content is revealed when the card is expanded. 
                            Perfect for showing additional details on demand.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </ComponentDemo>
              </div>
            </ComponentSection>
          )}

          {/* Inputs */}
          {activeTab === 'inputs' && (
            <ComponentSection title="Input Components" description="Form inputs and interactive controls">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComponentDemo title="Text Inputs">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Blocks
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter block height or hash..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Error State
                      </label>
                      <input
                        type="text"
                        placeholder="Invalid input"
                        className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      />
                      <p className="text-red-600 text-sm mt-1">This field is required</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Success State
                      </label>
                      <input
                        type="text"
                        value="Valid input"
                        readOnly
                        className="w-full px-4 py-3 border-2 border-green-300 rounded-xl bg-green-50 transition-all duration-200"
                      />
                      <p className="text-green-600 text-sm mt-1">Input validated successfully</p>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo title="Toggle Controls">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Auto Refresh
                      </label>
                      <ToggleSwitch />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        View Options
                      </label>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium">
                          Table
                        </button>
                        <button className="flex-1 px-4 py-2 text-gray-600 font-medium">
                          Grid
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Filter Options
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                          <span className="ml-2 text-sm text-gray-700">Show confirmed blocks only</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                          <span className="ml-2 text-sm text-gray-700">Include mempool data</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </ComponentDemo>
              </div>
            </ComponentSection>
          )}

          {/* Feedback */}
          {activeTab === 'feedback' && (
            <ComponentSection title="Feedback Components" description="Loading states, alerts, and user feedback">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComponentDemo title="Loading States">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading blockchain data...</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                            className="w-2 h-2 bg-orange-500 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">Processing...</span>
                    </div>
                  </div>
                </ComponentDemo>

                <ComponentDemo title="Alert Messages">
                  <div className="space-y-4">
                    <Alert
                      type="success"
                      title="Data Updated"
                      message="Blockchain data has been successfully refreshed."
                    />
                    <Alert
                      type="warning"
                      title="High Network Fees"
                      message="Current network fees are above average. Consider waiting for lower fees."
                    />
                    <Alert
                      type="error"
                      title="Connection Failed"
                      message="Unable to connect to the blockchain API. Please check your internet connection."
                    />
                    <Alert
                      type="info"
                      title="New Block Detected"
                      message="Block #750,000 has been mined and added to the blockchain."
                    />
                  </div>
                </ComponentDemo>
              </div>
            </ComponentSection>
          )}

          {/* Navigation */}
          {activeTab === 'navigation' && (
            <ComponentSection title="Navigation Components" description="Navigation and menu components">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComponentDemo title="Tab Navigation">
                  <TabNavigation />
                </ComponentDemo>

                <ComponentDemo title="Breadcrumbs">
                  <Breadcrumbs />
                </ComponentDemo>
              </div>
            </ComponentSection>
          )}

          {/* Data Display */}
          {activeTab === 'data' && (
            <ComponentSection title="Data Display" description="Components for displaying blockchain data">
              <div className="space-y-6">
                <ComponentDemo title="Data Table">
                  <DataTable />
                </ComponentDemo>

                <ComponentDemo title="Progress Indicators">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Progress Bars</h4>
                      <div className="space-y-4">
                        <ProgressBar value={75} label="Block Sync Progress" />
                        <ProgressBar value={45} label="Mempool Processing" color="blue" />
                        <ProgressBar value={90} label="Network Health" color="green" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Circular Progress</h4>
                      <div className="flex gap-6">
                        <CircularProgress value={75} size="lg" />
                        <CircularProgress value={45} size="md" color="blue" />
                        <CircularProgress value={90} size="sm" color="green" />
                      </div>
                    </div>
                  </div>
                </ComponentDemo>
              </div>
            </ComponentSection>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ComponentSection({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ComponentDemo({ title, children }: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MetricCard({ title, icon, value, label, trend }: {
  title: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  trend?: { value: number; direction: 'up' | 'down' };
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-semibold text-gray-900 text-sm">{title}</h5>
        {icon}
      </div>
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ status, title, description }: {
  status: 'success' | 'warning' | 'error';
  title: string;
  description: string;
}) {
  const statusConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      titleColor: 'text-green-800',
      descColor: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      titleColor: 'text-yellow-800',
      descColor: 'text-yellow-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <X className="h-5 w-5 text-red-500" />,
      titleColor: 'text-red-800',
      descColor: 'text-red-600'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div>
          <h4 className={`font-medium ${config.titleColor}`}>{title}</h4>
          <p className={`text-sm ${config.descColor} mt-1`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

function Alert({ type, title, message }: {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}) {
  const alertConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="h-5 w-5 text-blue-500" />,
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  };

  const config = alertConfig[type];

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <h4 className={`font-medium ${config.titleColor} mb-1`}>{title}</h4>
          <p className={`text-sm ${config.messageColor}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch() {
  const [enabled, setEnabled] = useState(false);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        enabled ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function TabNavigation() {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'blocks', label: 'Blocks' },
    { id: 'transactions', label: 'Transactions' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Breadcrumbs() {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <a href="#" className="text-gray-400 hover:text-gray-500">
            Home
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronUp className="h-5 w-5 text-gray-400 rotate-90" />
            <a href="#" className="ml-4 text-gray-400 hover:text-gray-500">
              Resources
            </a>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronUp className="h-5 w-5 text-gray-400 rotate-90" />
            <span className="ml-4 text-gray-500">On-Chain Data</span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

function DataTable() {
  const data = [
    { height: 750000, time: '2m ago', txs: 2847, size: '1.2 MB' },
    { height: 749999, time: '12m ago', txs: 3156, size: '1.4 MB' },
    { height: 749998, time: '18m ago', txs: 2934, size: '1.1 MB' }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Height
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transactions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={row.height} className={index === 0 ? 'bg-orange-50' : 'hover:bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {index === 0 && <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>}
                  <span className="font-medium text-gray-900">{row.height.toLocaleString()}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {row.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {row.txs.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {row.size}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ value, label, color = 'orange' }: {
  value: number;
  label: string;
  color?: 'orange' | 'blue' | 'green';
}) {
  const colorClasses = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CircularProgress({ value, size = 'md', color = 'orange' }: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'blue' | 'green';
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const colorClasses = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    green: 'text-green-500'
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx="25"
          cy="25"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-700">{value}%</span>
      </div>
    </div>
  );
}