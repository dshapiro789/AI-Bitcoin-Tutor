import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Hash, Clock, TrendingUp, Zap, 
  RefreshCw, AlertCircle, CheckCircle, 
  ArrowUp, ArrowDown, DollarSign, Users,
  Blocks, Gauge, Network, ChevronDown,
  ChevronUp, Filter, Search, Eye, EyeOff, Info,
  BarChart3, PieChart,
  TrendingDown, Wifi, WifiOff
} from 'lucide-react';
import { FeeDistributionChart } from './charts/FeeDistributionChart';
import { TransactionVolumeChart } from './charts/TransactionVolumeChart';

// Color Palette
const colors = {
  primary: '#f97316', // Orange-500
  primaryLight: '#fed7aa', // Orange-200
  primaryDark: '#ea580c', // Orange-600
  secondary: '#1f2937', // Gray-800
  secondaryLight: '#6b7280', // Gray-500
  accent: '#10b981', // Emerald-500
  accentDanger: '#ef4444', // Red-500
  background: '#fafafa', // Gray-50
  backgroundCard: '#ffffff',
  backgroundMuted: '#f3f4f6', // Gray-100
  text: '#111827', // Gray-900
  textMuted: '#6b7280', // Gray-500
  border: '#e5e7eb', // Gray-200
  borderLight: '#f3f4f6' // Gray-100
};

interface BlockData {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
  previousblockhash: string;
  nonce: number;
  bits: number;
  difficulty: number;
}

interface MempoolStats {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: number[][];
}

interface FeeEstimates {
  [key: string]: number;
}

interface ViewSettings {
  compactMode: boolean;
  autoRefresh: boolean;
  showAdvanced: boolean;
  refreshInterval: number;
}

// Responsive breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export function OnChainDataDisplay() {
  const [currentBlock, setCurrentBlock] = useState<BlockData | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<BlockData[]>([]);
  const [mempoolStats, setMempoolStats] = useState<MempoolStats | null>(null);
  const [feeEstimates, setFeeEstimates] = useState<FeeEstimates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [searchTerm, setSearchTerm] = useState('');
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    compactMode: false,
    autoRefresh: true,
    showAdvanced: false,
    refreshInterval: 30000
  });

  // Retry mechanism with exponential backoff
  const getCleanErrorMessage = async (response: Response, prefix: string): Promise<string> => {
    try {
      const text = await response.text();
      
      // Check if response is HTML
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        // Try to extract title or h1 content
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        const h1Match = text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        
        if (titleMatch && titleMatch[1]) {
          return `${prefix}: ${titleMatch[1].trim()}`;
        } else if (h1Match && h1Match[1]) {
          return `${prefix}: ${h1Match[1].trim()}`;
        } else {
          return `${prefix}: Server error (${response.status})`;
        }
      }
      
      // If not HTML, truncate long responses
      const truncatedText = text.length > 200 ? text.substring(0, 200) + '...' : text;
      return `${prefix}: ${truncatedText}`;
    } catch (error) {
      return `${prefix}: ${response.status} ${response.statusText}`;
    }
  };

  const fetchWithRetry = async (url: string, maxRetries: number = 3): Promise<Response> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        // If we get a 5xx error, retry
        if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`API request failed with ${response.status}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return response;
      } catch (error) {
        // Network errors (like "Failed to fetch")
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error('Max retries exceeded');
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchOnChainData = async () => {
    if (!isOnline) {
      setError('No internet connection');
      return;
    }

    try {
      setError(null);
      
      // Use Vite proxy for Blockstream API calls
      const baseUrl = '/api/blockstream';
      
      // Fetch current block height
      const heightResponse = await fetchWithRetry(`${baseUrl}/blocks/tip/height`);
      if (!heightResponse.ok) {
        const errorMessage = await getCleanErrorMessage(heightResponse, 'Failed to fetch block height');
        throw new Error(errorMessage);
      }
      const currentHeight = await heightResponse.json();

      // Fetch recent blocks
      const blocksResponse = await fetchWithRetry(`${baseUrl}/blocks/${currentHeight}`);
      if (!blocksResponse.ok) {
        const errorMessage = await getCleanErrorMessage(blocksResponse, 'Failed to fetch blocks');
        throw new Error(errorMessage);
      }
      const blocks = await blocksResponse.json();
      
      setCurrentBlock(blocks[0]);
      setRecentBlocks(blocks.slice(0, 10));

      // Fetch mempool stats
      const mempoolResponse = await fetchWithRetry(`${baseUrl}/mempool`);
      if (!mempoolResponse.ok) {
        const errorMessage = await getCleanErrorMessage(mempoolResponse, 'Failed to fetch mempool data');
        throw new Error(errorMessage);
      }
      const mempool = await mempoolResponse.json();
      setMempoolStats(mempool);

      // Fetch fee estimates
      const feesResponse = await fetchWithRetry(`${baseUrl}/fee-estimates`);
      if (!feesResponse.ok) {
        const errorMessage = await getCleanErrorMessage(feesResponse, 'Failed to fetch fee estimates');
        throw new Error(errorMessage);
      }
      const fees = await feesResponse.json();
      setFeeEstimates(fees);

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching on-chain data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    fetchOnChainData();
    
    if (viewSettings.autoRefresh && isOnline) {
      const interval = setInterval(fetchOnChainData, viewSettings.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [viewSettings.autoRefresh, viewSettings.refreshInterval, isOnline]);

  // Utility function to format hash by removing leading zeros
  const formatHashForDisplay = (hash: string): string => {
    if (!hash) return '';
    // Remove leading zeros but keep at least one character
    const formatted = hash.replace(/^0+/, '');
    return formatted || '0';
  };

  // Utility functions
  const formatHashRate = (hashrate: number) => {
    if (hashrate >= 1e18) return `${(hashrate / 1e18).toFixed(2)} EH/s`;
    if (hashrate >= 1e15) return `${(hashrate / 1e15).toFixed(2)} PH/s`;
    if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
    return `${hashrate.toFixed(2)} H/s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} bytes`;
  };

  const formatSats = (sats: number) => {
    if (sats >= 1e8) return `${(sats / 1e8).toFixed(4)} BTC`;
    if (sats >= 1e3) return `${(sats / 1e3).toFixed(0)}k sats`;
    return `${sats} sats`;
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getFeeColor = (fee: number) => {
    if (fee < 10) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (fee < 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (fee < 100) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <RefreshCw 
              className="h-8 w-8 sm:h-12 sm:w-12 text-orange-500 animate-spin mx-auto" 
              style={{ color: colors.primary }}
            />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Loading Bitcoin Network Data</h3>
          <p className="text-sm sm:text-base text-gray-600">Fetching real-time blockchain information...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-6 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            {isOnline ? (
              <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />
            ) : (
              <WifiOff className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
            {isOnline ? 'Data Loading Error' : 'Connection Lost'}
          </h3>
          <p className="text-sm sm:text-base text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchOnChainData}
            disabled={!isOnline}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
          >
            {isOnline ? 'Retry' : 'Waiting for connection...'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" style={{ backgroundColor: colors.background }}>
      {/* Enhanced Header with Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              <div className={`absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}></div>
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Bitcoin Network Monitor</h3>
              <p className="text-xs sm:text-sm text-gray-600">Real-time blockchain analytics</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              {isOnline ? (
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Last Update */}
            <div className="text-xs sm:text-sm text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={fetchOnChainData}
                disabled={loading || !isOnline}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Beta Notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-start gap-3"
      >
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs sm:text-sm text-blue-700">
          <p className="font-medium mb-1">Beta Feature Notice</p>
          <p>
            This feature is currently in beta. You might experience occasional loading issues due to external API dependencies. Thank you for your patience!
          </p>
        </div>
      </motion.div>

      {/* Current Block Hero Section - Mobile Optimized */}
      {currentBlock && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl sm:rounded-2xl shadow-2xl"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>
          
          <div className="relative p-4 sm:p-8">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                  <Blocks className="h-6 w-6 sm:h-12 sm:w-12 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Latest Block</div>
                  <div className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 truncate">
                    #{currentBlock.height.toLocaleString()}
                  </div>
                  <div className="flex items-center text-orange-100 text-xs sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">Confirmed {getTimeAgo(currentBlock.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Transactions</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{currentBlock.tx_count.toLocaleString()}</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Block Size</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{formatBytes(currentBlock.size)}</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Weight</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{(currentBlock.weight / 1000).toFixed(0)}k WU</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Difficulty</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {(currentBlock.difficulty / 1e12).toFixed(1)}T
                  </div>
                </div>
              </div>

              {/* Block Hash - Mobile Optimized */}
              <div className="p-3 sm:p-4 bg-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <div className="text-orange-200 text-xs sm:text-sm font-medium mb-2">Block Hash</div>
                <div className="font-mono text-white text-xs sm:text-sm break-all">
                  {formatHashForDisplay(currentBlock.id)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-3 sm:space-y-4">
        {/* Network Overview */}
        <CollapsibleSection
          id="overview"
          title="Network Overview"
          icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />}
          expanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Mempool Stats */}
            {mempoolStats && (
              <MetricCard
                title="Mempool Activity"
                icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />}
                value={mempoolStats.count.toLocaleString()}
                label="Pending Transactions"
                trend={{ value: 5.2, direction: 'up' }}
                details={[
                  { label: 'Total Size', value: formatBytes(mempoolStats.vsize) },
                  { label: 'Total Fees', value: formatSats(mempoolStats.total_fee) }
                ]}
                compact={viewSettings.compactMode}
              />
            )}

            {/* Fee Estimates */}
            {feeEstimates && (
              <MetricCard
                title="Fee Estimates"
                icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />}
                value={`${(feeEstimates['1'] || 0).toFixed(2)} sat/vB`}
                label="Next Block"
                details={Object.entries(feeEstimates)
                  .filter(([blocks]) => ['6', '144'].includes(blocks))
                  .map(([blocks, fee]) => ({
                    label: blocks === '6' ? '~1 hour' : '~1 day',
                    value: `${fee.toFixed(2)} sat/vB`,
                    color: getFeeColor(fee)
                  }))}
                compact={viewSettings.compactMode}
              />
            )}

            {/* Network Health */}
            <MetricCard
              title="Network Health"
              icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />}
              value="Excellent"
              label="Overall Status"
              trend={{ value: 99.9, direction: 'up', suffix: '% uptime' }}
              details={[
                { label: 'Avg Block Time', value: '~10 min' },
                { label: 'Chain Tip Age', value: getTimeAgo(currentBlock?.timestamp || 0) }
              ]}
              compact={viewSettings.compactMode}
            />

            {/* Mining Difficulty */}
            <MetricCard
              title="Mining Difficulty"
              icon={<Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />}
              value={currentBlock ? `${(currentBlock.difficulty / 1e12).toFixed(2)}T` : 'Loading...'}
              label="Current Difficulty"
              trend={{ value: 2.1, direction: 'up', suffix: '% from last adjustment' }}
              details={[
                { label: 'Next Adjustment', value: '~12 days' },
                { label: 'Blocks Remaining', value: '~1,680' }
              ]}
              compact={viewSettings.compactMode}
            />
          </div>
        </CollapsibleSection>

        {/* Recent Blocks */}
        <CollapsibleSection
          id="blocks"
          title="Recent Blocks"
          icon={<Hash className="h-4 w-4 sm:h-5 sm:w-5" />}
          expanded={expandedSections.has('blocks')}
          onToggle={() => toggleSection('blocks')}
        >
          <RecentBlocksTable 
            blocks={recentBlocks} 
            compact={viewSettings.compactMode}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CollapsibleSection>

        {/* Advanced Metrics */}
        {viewSettings.showAdvanced && (
          <CollapsibleSection
            id="advanced"
            title="Advanced Metrics"
            icon={<PieChart className="h-4 w-4 sm:h-5 sm:w-5" />}
            expanded={expandedSections.has('advanced')}
            onToggle={() => toggleSection('advanced')}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Fee Distribution Chart */}
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Fee Distribution</h4>
                <div className="h-64 sm:h-80">
                  {mempoolStats?.fee_histogram ? (
                    <FeeDistributionChart 
                      feeHistogram={mempoolStats.fee_histogram}
                      isDarkMode={false}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500 text-xs sm:text-sm">Loading fee distribution data...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Volume Chart */}
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Transaction Volume</h4>
                <div className="h-64 sm:h-80">
                  {recentBlocks.length > 0 ? (
                    <TransactionVolumeChart 
                      blocks={recentBlocks}
                      isDarkMode={false}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500 text-xs sm:text-sm">Loading transaction volume data...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Settings Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Network className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-orange-700">
              <p className="font-medium mb-1">Data Source & Settings</p>
              <ul className="space-y-1 text-xs">
                <li>• Real-time data from Blockstream API via CORS proxy</li>
                <li>• Auto-refresh: {viewSettings.autoRefresh ? 'Enabled' : 'Disabled'}</li>
                <li>• Refresh interval: {viewSettings.refreshInterval / 1000}s</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewSettings(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                viewSettings.showAdvanced
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-orange-700 hover:bg-orange-100'
              }`}
            >
              {viewSettings.showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ id, title, icon, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
        aria-expanded={expanded}
        aria-controls={`section-${id}`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {icon}
          <h4 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h4>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`section-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6 pt-0 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    suffix?: string;
  };
  details?: Array<{
    label: string;
    value: string;
    color?: string;
  }>;
  compact?: boolean;
}

function MetricCard({ title, icon, value, label, trend, details, compact }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">{title}</h5>
        {icon}
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{value}</div>
          <div className="text-xs sm:text-sm text-gray-600">{label}</div>
        </div>

        {trend && (
          <div className="flex items-center gap-1">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            )}
            <span className={`text-xs sm:text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.value}{trend.suffix || '%'}
            </span>
          </div>
        )}

        {!compact && details && (
          <div className="space-y-1 sm:space-y-2 pt-2 border-t border-gray-100">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{detail.label}</span>
                <span className={`text-xs font-medium break-words ${detail.color || 'text-gray-900'}`}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Recent Blocks Table Component
interface RecentBlocksTableProps {
  blocks: BlockData[];
  compact: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

function RecentBlocksTable({ blocks, compact, searchTerm, onSearchChange }: RecentBlocksTableProps) {
  const filteredBlocks = blocks.filter(block => 
    block.height.toString().includes(searchTerm) ||
    block.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Utility function to format hash by removing leading zeros
  const formatHashForDisplay = (hash: string): string => {
    if (!hash) return '';
    // Remove leading zeros but keep at least one character
    const formatted = hash.replace(/^0+/, '');
    return formatted || '0';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search blocks by height or hash..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm sm:text-base"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Height
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Txs
              </th>
              {!compact && (
                <>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBlocks.map((block, index) => (
              <motion.tr
                key={block.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${index === 0 ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors duration-200`}
              >
                <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {index === 0 && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-2 animate-pulse"></div>}
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">
                      {block.height.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                  {getTimeAgo(block.timestamp)}
                </td>
                <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  {block.tx_count.toLocaleString()}
                </td>
                {!compact && (
                  <>
                    <td className="hidden sm:table-cell px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {formatBytes(block.size)}
                    </td>
                    <td className="sm:table-cell px-2 sm:px-4 py-3 sm:py-4 text-xs font-mono text-gray-600 break-all">
                      {formatHashForDisplay(block.id)}
                    </td>
                  </>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBlocks.length === 0 && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-gray-500 text-sm sm:text-base">No blocks found matching your search.</p>
        </div>
      )}
    </div>
  );
}

// Utility function to get time ago
function getTimeAgo(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Utility function to format bytes
function formatBytes(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
  return `${bytes} bytes`;
}