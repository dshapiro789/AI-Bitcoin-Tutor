import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Hash, Clock, TrendingUp, Zap, 
  RefreshCw, AlertCircle, CheckCircle, 
  ArrowUp, ArrowDown, DollarSign, Users,
  Blocks, Gauge, Network, ChevronDown,
  ChevronUp, Info, Wifi, WifiOff, Timer,
  Globe, TrendingDown, Target, Coins
} from 'lucide-react';

// Enhanced data structure for Blockchain.com API
interface BlockchainInfoStats {
  // Network basics
  difficulty: number;
  blockHeight: number;
  latestHash: string;
  blockReward: number; // in BTC
  totalBitcoins: number; // in BTC
  
  // Mining stats
  probability: number;
  hashesToWin: number;
  nextRetarget: number;
  hashrate: number; // in GH/s
  
  // Transaction stats
  avgTxSize: number;
  avgTxValue: number; // in BTC
  avgTxNumber: number;
  unconfirmedCount: number;
  txCount24h: number;
  
  // Time estimates
  eta: number; // seconds until next block
  
  // Price data
  usdPrice: number;
  marketCap: number;
  
  // Calculated values
  totalBitcoinsUSD: number;
  avgTxValueUSD: number;
  blockRewardUSD: number;
}

interface ExchangeRates {
  [currency: string]: {
    '15m': number;
    last: number;
    buy: number;
    sell: number;
    symbol: string;
  };
}

interface ViewSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showAdvanced: boolean;
}

export function OnChainDataDisplay() {
  const [blockchainStats, setBlockchainStats] = useState<BlockchainInfoStats | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number; currentItem: string }>({
    current: 0,
    total: 0,
    currentItem: ''
  });
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    autoRefresh: false, // Disabled by default due to rate limits
    refreshInterval: 180000, // 3 minutes minimum due to API constraints
    showAdvanced: false
  });

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

  // Helper function to add delay between API calls
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fetch data with retry mechanism
  const fetchWithRetry = async (url: string, maxRetries: number = 2): Promise<Response> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
          const delayTime = Math.pow(2, attempt) * 2000; // 2s, 4s
          console.log(`API request failed with ${response.status}, retrying in ${delayTime}ms...`);
          await delay(delayTime);
          continue;
        }
        
        return response;
      } catch (error) {
        if (attempt < maxRetries) {
          const delayTime = Math.pow(2, attempt) * 2000;
          console.log(`Network error, retrying in ${delayTime}ms...`);
          await delay(delayTime);
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded');
  };

  const fetchOnChainData = async () => {
    if (!isOnline) {
      setError('No internet connection');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      const baseUrl = '/api/blockchain';
      
      // Define all the data points we need to fetch
      const dataPoints = [
        { key: 'difficulty', endpoint: '/q/getdifficulty', label: 'Network Difficulty' },
        { key: 'blockHeight', endpoint: '/q/getblockcount', label: 'Block Height' },
        { key: 'latestHash', endpoint: '/q/latesthash', label: 'Latest Block Hash' },
        { key: 'blockReward', endpoint: '/q/bcperblock', label: 'Block Reward' },
        { key: 'totalBitcoins', endpoint: '/q/totalbc', label: 'Total Bitcoin Supply' },
        { key: 'probability', endpoint: '/q/probability', label: 'Mining Probability' },
        { key: 'hashesToWin', endpoint: '/q/hashestowin', label: 'Hashes to Win' },
        { key: 'nextRetarget', endpoint: '/q/nextretarget', label: 'Next Difficulty Retarget' },
        { key: 'avgTxSize', endpoint: '/q/avgtxsize', label: 'Average Transaction Size' },
        { key: 'avgTxValue', endpoint: '/q/avgtxvalue', label: 'Average Transaction Value' },
        { key: 'eta', endpoint: '/q/eta', label: 'Time to Next Block' },
        { key: 'avgTxNumber', endpoint: '/q/avgtxnumber', label: 'Average Transactions per Block' },
        { key: 'unconfirmedCount', endpoint: '/q/unconfirmedcount', label: 'Unconfirmed Transactions' },
        { key: 'usdPrice', endpoint: '/q/24hrprice', label: '24h USD Price' },
        { key: 'marketCap', endpoint: '/q/marketcap', label: 'Market Cap' },
        { key: 'txCount24h', endpoint: '/q/24hrtransactioncount', label: '24h Transaction Count' },
        { key: 'hashrate', endpoint: '/q/hashrate', label: 'Network Hashrate' }
      ];

      setFetchProgress({ current: 0, total: dataPoints.length + 1, currentItem: 'Starting...' });

      const stats: Partial<BlockchainInfoStats> = {};

      // Fetch each data point with 10-second delays
      for (let i = 0; i < dataPoints.length; i++) {
        const dataPoint = dataPoints[i];
        setFetchProgress({ 
          current: i + 1, 
          total: dataPoints.length + 1, 
          currentItem: dataPoint.label 
        });

        try {
          const response = await fetchWithRetry(`${baseUrl}${dataPoint.endpoint}?cors=true`);
          
          if (!response.ok) {
            console.warn(`Failed to fetch ${dataPoint.key}: ${response.status}`);
            continue;
          }

          const rawValue = await response.text();
          let parsedValue: number | string = rawValue.trim();

          // Parse numeric values
          if (dataPoint.key !== 'latestHash') {
            parsedValue = parseFloat(parsedValue as string);
            if (isNaN(parsedValue)) {
              console.warn(`Invalid numeric value for ${dataPoint.key}: ${rawValue}`);
              continue;
            }
          }

          // Convert Satoshi values to BTC where applicable
          if (['totalBitcoins', 'avgTxValue'].includes(dataPoint.key)) {
            parsedValue = (parsedValue as number) / 100000000;
          }

          (stats as any)[dataPoint.key] = parsedValue;

          // Add delay between requests (10 seconds as per API requirements)
          if (i < dataPoints.length - 1) {
            await delay(10000);
          }
        } catch (err) {
          console.warn(`Error fetching ${dataPoint.key}:`, err);
        }
      }

      // Fetch exchange rates (final request)
      setFetchProgress({ 
        current: dataPoints.length + 1, 
        total: dataPoints.length + 1, 
        currentItem: 'Exchange Rates' 
      });

      try {
        const ratesResponse = await fetchWithRetry(`${baseUrl}/ticker?cors=true`);
        if (ratesResponse.ok) {
          const rates = await ratesResponse.json();
          setExchangeRates(rates);
          
          // Use USD price from ticker if available, fallback to 24hrprice
          if (rates.USD?.last) {
            stats.usdPrice = rates.USD.last;
          }
        }
      } catch (err) {
        console.warn('Error fetching exchange rates:', err);
      }

      // Calculate USD values
      if (stats.usdPrice) {
        stats.totalBitcoinsUSD = (stats.totalBitcoins || 0) * stats.usdPrice;
        stats.avgTxValueUSD = (stats.avgTxValue || 0) * stats.usdPrice;
        stats.blockRewardUSD = (stats.blockReward || 0) * stats.usdPrice;
      }

      setBlockchainStats(stats as BlockchainInfoStats);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      setFetchProgress({ current: 0, total: 0, currentItem: '' });
    }
  };

  // Auto-refresh functionality (disabled by default due to rate limits)
  useEffect(() => {
    fetchOnChainData();
    
    if (viewSettings.autoRefresh && isOnline) {
      const interval = setInterval(fetchOnChainData, viewSettings.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [viewSettings.autoRefresh, viewSettings.refreshInterval, isOnline]);

  // Utility functions
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatUSDDetailed = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatUSDCompact = (amount: number) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return formatUSD(amount);
  };

  const formatBTC = (amount: number) => {
    // For large amounts like total supply, show fewer decimals
    if (amount >= 1000000) {
      return `${amount.toFixed(0)} BTC`;
    } else if (amount >= 1000) {
      return `${amount.toFixed(2)} BTC`;
    } else if (amount >= 1) {
      return `${amount.toFixed(4)} BTC`;
    } else {
      return `${amount.toFixed(8)} BTC`;
    }
  };

  const formatHashRate = (hashrate: number) => {
    if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} EH/s`;
    if (hashrate >= 1e6) return `${(hashrate / 1e6).toFixed(2)} PH/s`;
    if (hashrate >= 1e3) return `${(hashrate / 1e3).toFixed(2)} TH/s`;
    return `${hashrate.toFixed(2)} GH/s`;
  };

  const formatTimeEstimate = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
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

  // Loading state with progress
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="relative mb-6">
            <RefreshCw className="h-8 w-8 sm:h-12 sm:w-12 text-orange-500 animate-spin mx-auto" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Loading Bitcoin Network Data
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Fetching real-time blockchain information...
          </p>
          
          {fetchProgress.total > 0 && (
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-orange-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-sm text-gray-500">
                {fetchProgress.current} of {fetchProgress.total} - {fetchProgress.currentItem}
              </div>
              <div className="text-xs text-gray-400">
                Due to API rate limits, this may take up to 3 minutes
              </div>
            </div>
          )}
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
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
              <p className="text-xs sm:text-sm text-gray-600">Real-time blockchain analytics via Blockchain.com</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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

            <div className="text-xs sm:text-sm text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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
            This feature is currently in beta. Due to API rate limits (1 request per 10 seconds), 
            full data refresh takes approximately 3 minutes. Thank you for your patience!
          </p>
        </div>
      </motion.div>

      {/* Current Network Status Hero Section */}
      {blockchainStats && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl sm:rounded-2xl shadow-2xl"
        >
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
                  <div className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Current Block Height</div>
                  <div className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                    #{blockchainStats.blockHeight?.toLocaleString()}
                  </div>
                  <div className="flex items-center text-orange-100 text-xs sm:text-sm">
                    <Timer className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
                    <span>Next block in ~{formatTimeEstimate(blockchainStats.eta || 600)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Bitcoin Price</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {blockchainStats.usdPrice ? formatUSD(blockchainStats.usdPrice) : 'Loading...'}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Market Cap</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {blockchainStats.marketCap ? formatUSD(blockchainStats.marketCap) : 'Loading...'}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Block Reward</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {blockchainStats.blockReward ? formatBTC(blockchainStats.blockReward) : 'Loading...'}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-orange-200 text-xs sm:text-sm font-medium">Difficulty</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {blockchainStats.difficulty ? `${(blockchainStats.difficulty / 1e12).toFixed(1)}T` : 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Latest Block Hash */}
              <div className="p-3 sm:p-4 bg-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <div className="text-orange-200 text-xs sm:text-sm font-medium mb-2">Latest Block Hash</div>
                <div className="font-mono text-white text-xs sm:text-sm break-all">
                  {blockchainStats.latestHash || 'Loading...'}
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
          icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
          expanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Total Bitcoin Supply */}
            <MetricCard
              title="Bitcoin Supply"
              icon={<Coins className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />}
              value={blockchainStats?.totalBitcoins ? formatBTC(blockchainStats.totalBitcoins) : 'Loading...'}
              label="Total in Circulation"
              subValue={blockchainStats?.totalBitcoinsUSD ? formatUSD(blockchainStats.totalBitcoinsUSD) : undefined}
              details={[
                { label: 'Max Supply', value: '21,000,000 BTC' },
                { label: 'Remaining', value: `${(21000000 - (blockchainStats?.totalBitcoins || 0)).toLocaleString()} BTC` }
              ]}
            />

            {/* Network Hashrate */}
            <MetricCard
              title="Network Hashrate"
              icon={<Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />}
              value={blockchainStats?.hashrate ? formatHashRate(blockchainStats.hashrate) : 'Loading...'}
              label="Current Hashrate"
            />

            {/* Mempool Activity */}
            <MetricCard
              title="Mempool Activity"
              icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />}
              value={blockchainStats?.unconfirmedCount ? formatLargeNumber(blockchainStats.unconfirmedCount) : 'Loading...'}
              label="Unconfirmed Transactions"
              details={[
                { label: '24h Transactions', value: blockchainStats?.txCount24h ? formatLargeNumber(blockchainStats.txCount24h) : 'Loading...' },
                { label: 'Avg per Block', value: blockchainStats?.avgTxNumber ? Math.round(blockchainStats.avgTxNumber).toLocaleString() : 'Loading...' }
              ]}
            />
          </div>
        </CollapsibleSection>

        {/* Transaction Statistics */}
        <CollapsibleSection
          id="transactions"
          title="Transaction Statistics"
          icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
          expanded={expandedSections.has('transactions')}
          onToggle={() => toggleSection('transactions')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Average Transaction Value */}
            <MetricCard
              title="Average Transaction Value"
              icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />}
              value={blockchainStats?.avgTxValue ? formatBTC(blockchainStats.avgTxValue) : 'Loading...'}
              label="Per Transaction (1000 blocks avg)"
              subValue={blockchainStats?.avgTxValueUSD ? formatUSDDetailed(blockchainStats.avgTxValueUSD) : undefined}
            />

            {/* Average Transaction Size */}
            <MetricCard
              title="Average Transaction Size"
              icon={<Hash className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />}
              value={blockchainStats?.avgTxSize ? `${Math.round(blockchainStats.avgTxSize)} bytes` : 'Loading...'}
              label="Per Transaction (1000 blocks avg)"
            />

            {/* Block Reward */}
            <MetricCard
              title="Current Block Reward"
              icon={<Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />}
              value={blockchainStats?.blockReward ? formatBTC(blockchainStats.blockReward) : 'Loading...'}
              label="Per Block Mined"
              subValue={blockchainStats?.blockRewardUSD ? formatUSDDetailed(blockchainStats.blockRewardUSD) : undefined}
            />
          </div>
        </CollapsibleSection>

        {/* Mining Information */}
        <CollapsibleSection
          id="mining"
          title="Mining Information"
          icon={<Gauge className="h-4 w-4 sm:h-5 sm:w-5" />}
          expanded={expandedSections.has('mining')}
          onToggle={() => toggleSection('mining')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Current Block Reward */}
            <MetricCard
              title="Current Block Reward"
              icon={<Target className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />}
              value={blockchainStats?.blockReward ? formatBTC(blockchainStats.blockReward) : 'Loading...'}
              label="Per Block Mined"
              subValue={blockchainStats?.blockRewardUSD ? formatUSDDetailed(blockchainStats.blockRewardUSD) : undefined}
            />

            {/* Network Difficulty */}
            <MetricCard
              title="Network Difficulty"
              icon={<Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />}
              value={blockchainStats?.difficulty ? `${(blockchainStats.difficulty / 1e12).toFixed(1)}T` : 'Loading...'}
              label="Current Difficulty"
              details={[
                { label: 'Full Value', value: blockchainStats?.difficulty ? blockchainStats.difficulty.toLocaleString() : 'Loading...' }
              ]}
            />

            {/* Next Difficulty Retarget */}
            <MetricCard
              title="Next Difficulty Retarget"
              icon={<Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />}
              value={blockchainStats?.nextRetarget ? `Block #${blockchainStats.nextRetarget.toLocaleString()}` : 'Loading...'}
              label="Retarget Block Height"
              details={[
                { 
                  label: 'Blocks Remaining', 
                  value: blockchainStats?.nextRetarget && blockchainStats?.blockHeight 
                    ? `${(blockchainStats.nextRetarget - blockchainStats.blockHeight).toLocaleString()}` 
                    : 'Loading...' 
                },
                { 
                  label: 'Est. Time', 
                  value: blockchainStats?.nextRetarget && blockchainStats?.blockHeight 
                    ? `~${Math.round((blockchainStats.nextRetarget - blockchainStats.blockHeight) * 10 / 60)} hours`
                    : 'Loading...' 
                }
              ]}
            />
          </div>
        </CollapsibleSection>

        {/* Advanced Mining Information */}
        {viewSettings.showAdvanced && (
          <CollapsibleSection
            id="advanced-mining"
            title="Advanced Mining Information"
            icon={<Gauge className="h-4 w-4 sm:h-5 sm:w-5" />}
            expanded={expandedSections.has('advanced-mining')}
            onToggle={() => toggleSection('advanced-mining')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Advanced Hashrate Details */}
              <MetricCard
                title="Advanced Hashrate Details"
                icon={<Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />}
                value={blockchainStats?.hashrate ? formatHashRate(blockchainStats.hashrate) : 'Loading...'}
                label="Detailed Hashrate Information"
                details={[
                  { label: 'In Gigahash', value: blockchainStats?.hashrate ? `${blockchainStats.hashrate.toLocaleString()} GH/s` : 'Loading...' }
                ]}
              />

              {/* Mining Statistics */}
              <MetricCard
                title="Mining Statistics"
                icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />}
                value={blockchainStats?.probability ? blockchainStats.probability.toExponential(2) : 'Loading...'}
                label="Mining Probability (Scientific)"
                details={[
                  { label: 'Percentage', value: blockchainStats?.probability ? `${(blockchainStats.probability * 100).toFixed(10)}%` : 'Loading...' }
                ]}
              />
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* API Information Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Network className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-orange-700">
              <p className="font-medium mb-1">Data Source & Limitations</p>
              <ul className="space-y-1 text-xs">
                <li>• Real-time data from Blockchain.com API</li>
                <li>• Rate limit: 1 request per 10 seconds</li>
                <li>• Full refresh takes ~3 minutes</li>
                <li>• Auto-refresh: {viewSettings.autoRefresh ? 'Enabled' : 'Disabled'} ({viewSettings.refreshInterval / 60000}min interval)</li>
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
            
            <button
              onClick={() => setViewSettings(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                viewSettings.autoRefresh
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-orange-700 hover:bg-orange-100'
              }`}
            >
              Auto-refresh: {viewSettings.autoRefresh ? 'ON' : 'OFF'}
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

// Enhanced Metric Card Component
interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  subValue?: string;
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
}

function MetricCard({ title, icon, value, label, subValue, trend, details }: MetricCardProps) {
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
          {subValue && (
            <div className="text-sm sm:text-base font-semibold text-orange-600 mt-1">{subValue}</div>
          )}
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
              {trend.value}{trend.suffix}
            </span>
          </div>
        )}

        {details && details.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="space-y-1">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">{detail.label}:</span>
                  <span className={`font-medium ${detail.color || 'text-gray-900'}`}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}