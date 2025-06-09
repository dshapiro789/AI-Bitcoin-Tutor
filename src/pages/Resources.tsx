import React, { useState } from 'react';
import { Search, Tag, ExternalLink, Filter, ArrowUpRight, Bookmark, ShoppingCart, Zap, Globe, Shield, Code, Wallet, CreditCard, BookOpen, MessageSquare, Building, DollarSign, Landmark } from 'lucide-react';

interface Resource {
  name: string;
  description: string;
  url: string;
  type: 'exchange' | 'wallet' | 'lightning' | 'news' | 'education' | 'development' | 'payment' | 'gift-card' | 'merchant' | 'custody' | 'financial' | 'lending';
  tags: string[];
}

function Resources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Define the core tags that will be used across resources
  const CORE_TAGS = [
    'open-source',    // For open-source projects and tools
    'security',       // For security-focused resources
    'privacy',        // For privacy-enhancing tools and services
    'self-custody',   // For non-custodial solutions
    'lightning',      // For Lightning Network related resources
    'technical',      // For developer and technical resources
    'beginner',       // For newcomer-friendly resources
    'advanced',       // For advanced users and developers
    'business',       // For business solutions
    'mobile',         // For mobile-focused solutions
    'desktop',        // For desktop applications
    'hardware',       // For hardware solutions
    'enterprise',     // For enterprise solutions
    'lending',        // For lending services
    'yield'          // For yield-generating services
  ];

  const resources: Resource[] = [
    // Lending Services
    {
      name: 'Ledn',
      description: 'Bitcoin-focused financial services platform offering lending and savings products.',
      url: 'https://ledn.io',
      type: 'lending',
      tags: ['lending', 'yield', 'business', 'security']
    },
    {
      name: 'Hodl Hodl',
      description: 'P2P Bitcoin lending platform with non-custodial multisig contracts.',
      url: 'https://hodlhodl.com',
      type: 'lending',
      tags: ['lending', 'privacy', 'self-custody', 'advanced']
    },
    // Exchanges
    {
      name: 'Kraken',
      description: 'Established cryptocurrency exchange with high security standards and fiat on/off ramps.',
      url: 'https://kraken.com',
      type: 'exchange',
      tags: ['security', 'beginner']
    },
    {
      name: 'Bisq',
      description: 'Decentralized peer-to-peer exchange focused on privacy and security.',
      url: 'https://bisq.network',
      type: 'exchange',
      tags: ['open-source', 'privacy', 'security', 'advanced']
    },
    {
      name: 'River Financial',
      description: 'Bitcoin-only financial platform offering buying, selling, and custody services.',
      url: 'https://river.com',
      type: 'financial',
      tags: ['security', 'beginner', 'enterprise']
    },
    {
      name: 'Swan Bitcoin',
      description: 'Bitcoin savings platform focused on recurring purchases and education.',
      url: 'https://swanbitcoin.com',
      type: 'financial',
      tags: ['beginner', 'education']
    },

    // Wallets
    {
      name: 'BlueWallet',
      description: 'Bitcoin and Lightning Network wallet for mobile devices.',
      url: 'https://bluewallet.io',
      type: 'wallet',
      tags: ['lightning', 'self-custody', 'beginner', 'mobile']
    },
    {
      name: 'SeedSigner',
      description: 'Open-source DIY hardware wallet focused on security and privacy through air-gapped signing.',
      url: 'https://seedsigner.com',
      type: 'wallet',
      tags: ['open-source', 'security', 'privacy', 'self-custody', 'advanced', 'hardware']
    },
    {
      name: 'Cake Wallet',
      description: 'Open-source multi-currency wallet with built-in exchange functionality.',
      url: 'https://cakewallet.com',
      type: 'wallet',
      tags: ['open-source', 'privacy', 'self-custody', 'mobile']
    },
    {
      name: 'Aqua Wallet',
      description: 'User-friendly Bitcoin and Lightning wallet with built-in exchange features.',
      url: 'https://aquawallet.io',
      type: 'wallet',
      tags: ['lightning', 'self-custody', 'beginner', 'mobile']
    },
    {
      name: 'Sparrow Wallet',
      description: 'Desktop Bitcoin wallet focused on security and privacy with advanced features.',
      url: 'https://sparrowwallet.com',
      type: 'wallet',
      tags: ['privacy', 'security', 'self-custody', 'advanced', 'desktop']
    },
    {
      name: 'Coldcard',
      description: 'Security-focused hardware wallet with air-gapped operation capabilities.',
      url: 'https://coldcard.com',
      type: 'wallet',
      tags: ['security', 'privacy', 'self-custody', 'advanced', 'hardware']
    },
    {
      name: 'Bitbox02',
      description: 'Swiss-made hardware wallet with Bitcoin-only and multi-edition options.',
      url: 'https://shiftcrypto.ch',
      type: 'wallet',
      tags: ['security', 'self-custody', 'beginner', 'hardware']
    },
    {
      name: 'Passport',
      description: 'Open-source hardware wallet by Foundation Devices with air-gapped security.',
      url: 'https://foundationdevices.com',
      type: 'wallet',
      tags: ['open-source', 'security', 'self-custody', 'advanced', 'hardware']
    },
    {
      name: 'Muun Wallet',
      description: 'Self-custodial Bitcoin and Lightning wallet with simple user experience.',
      url: 'https://muun.com',
      type: 'wallet',
      tags: ['lightning', 'self-custody', 'beginner', 'mobile']
    },

    // Lightning Network
    {
      name: 'Lightning Labs',
      description: 'Lightning Network development and implementation.',
      url: 'https://lightning.engineering',
      type: 'lightning',
      tags: ['lightning', 'technical', 'advanced']
    },
    {
      name: 'Breez',
      description: 'Non-custodial Lightning Network wallet and payment platform.',
      url: 'https://breez.technology',
      type: 'lightning',
      tags: ['lightning', 'self-custody', 'beginner']
    },
    {
      name: 'Voltage',
      description: 'Lightning Network infrastructure and node hosting.',
      url: 'https://voltage.cloud',
      type: 'lightning',
      tags: ['lightning', 'enterprise', 'technical']
    },
    {
      name: 'LNBits',
      description: 'Free and open-source Lightning Network wallet/accounts system.',
      url: 'https://lnbits.com',
      type: 'lightning',
      tags: ['open-source', 'lightning', 'technical']
    },

    // Payment Solutions
    {
      name: 'BTCPay Server',
      description: 'Self-hosted, open-source cryptocurrency payment processor.',
      url: 'https://btcpayserver.org',
      type: 'payment',
      tags: ['open-source', 'self-custody', 'business', 'lightning']
    },
    {
      name: 'OpenNode',
      description: 'Bitcoin payment processing for businesses with Lightning Network support.',
      url: 'https://opennode.com',
      type: 'payment',
      tags: ['lightning', 'business', 'enterprise']
    },
    {
      name: 'Strike',
      description: 'Bitcoin payments and remittance service using Lightning Network.',
      url: 'https://strike.me',
      type: 'payment',
      tags: ['lightning', 'beginner']
    },
    {
      name: 'Cash App',
      description: 'Mobile payment service with Bitcoin buying and Lightning support.',
      url: 'https://cash.app',
      type: 'payment',
      tags: ['lightning', 'beginner', 'mobile']
    },

    // Gift Cards & Services
    {
      name: 'Bitrefill',
      description: 'Gift cards and mobile top-ups purchasable with Bitcoin and Lightning.',
      url: 'https://bitrefill.com',
      type: 'gift-card',
      tags: ['lightning', 'beginner']
    },
    {
      name: 'Coin Cards',
      description: 'Buy gift cards with Bitcoin and Lightning Network payments.',
      url: 'https://coincards.com',
      type: 'gift-card',
      tags: ['lightning', 'beginner']
    },

    // Merchant Solutions
    {
      name: 'IBEX Mercado',
      description: 'Bitcoin and Lightning Network payment solutions for merchants.',
      url: 'https://ibexmercado.com',
      type: 'merchant',
      tags: ['lightning', 'business', 'enterprise']
    },

    // Custody Solutions
    {
      name: 'Casa',
      description: 'Multi-signature Bitcoin custody solution for individuals and businesses.',
      url: 'https://casa.io',
      type: 'custody',
      tags: ['security', 'advanced', 'enterprise']
    },
    {
      name: 'Unchained Capital',
      description: 'Collaborative custody and financial services for Bitcoin.',
      url: 'https://unchained.com',
      type: 'custody',
      tags: ['security', 'enterprise', 'advanced']
    },

    // News and Information
    {
      name: 'Bitcoin Magazine',
      description: 'Leading publication covering Bitcoin news, technology, and culture.',
      url: 'https://bitcoinmagazine.com',
      type: 'news',
      tags: ['beginner', 'technical']
    },
    {
      name: 'CoinDesk',
      description: 'Digital media platform covering cryptocurrency news and markets.',
      url: 'https://coindesk.com',
      type: 'news',
      tags: ['beginner']
    },

    // Education
    {
      name: 'Bitcoin.org',
      description: 'Educational resource for Bitcoin beginners and developers.',
      url: 'https://bitcoin.org',
      type: 'education',
      tags: ['beginner', 'technical', 'open-source']
    },
    {
      name: 'Chaincode Labs',
      description: 'Bitcoin development education and resources.',
      url: 'https://chaincode.com',
      type: 'education',
      tags: ['technical', 'advanced']
    },

    // Development
    {
      name: 'Bitcoin Core',
      description: 'The reference implementation of Bitcoin protocol.',
      url: 'https://bitcoincore.org',
      type: 'development',
      tags: ['open-source', 'technical', 'advanced']
    },
    {
      name: 'Bitcoin Dev Kit',
      description: 'Library for building Bitcoin wallets and applications.',
      url: 'https://bitcoindevkit.org',
      type: 'development',
      tags: ['open-source', 'technical', 'advanced']
    }
  ];

  const allTags = CORE_TAGS;

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesTag = selectedTag === 'all' || resource.tags.includes(selectedTag);
    return matchesSearch && matchesType && matchesTag;
  });

  const resourceTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'exchange', label: 'Exchanges' },
    { value: 'wallet', label: 'Wallets' },
    { value: 'lightning', label: 'Lightning Network' },
    { value: 'payment', label: 'Payment Solutions' },
    { value: 'lending', label: 'Lending Services' },
    { value: 'gift-card', label: 'Gift Cards' },
    { value: 'merchant', label: 'Merchant Tools' },
    { value: 'custody', label: 'Custody Solutions' },
    { value: 'financial', label: 'Financial Services' },
    { value: 'news', label: 'News' },
    { value: 'education', label: 'Education' },
    { value: 'development', label: 'Development' }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exchange':
        return <DollarSign className="h-5 w-5" />;
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
      case 'lightning':
        return <Zap className="h-5 w-5" />;
      case 'payment':
        return <CreditCard className="h-5 w-5" />;
      case 'lending':
        return <Landmark className="h-5 w-5" />;
      case 'gift-card':
        return <ShoppingCart className="h-5 w-5" />;
      case 'merchant':
        return <Building className="h-5 w-5" />;
      case 'custody':
        return <Shield className="h-5 w-5" />;
      case 'financial':
        return <DollarSign className="h-5 w-5" />;
      case 'news':
        return <Globe className="h-5 w-5" />;
      case 'education':
        return <BookOpen className="h-5 w-5" />;
      case 'development':
        return <Code className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      exchange: 'bg-blue-100 text-blue-800',
      wallet: 'bg-green-100 text-green-800',
      lightning: 'bg-yellow-100 text-yellow-800',
      payment: 'bg-purple-100 text-purple-800',
      lending: 'bg-emerald-100 text-emerald-800',
      'gift-card': 'bg-pink-100 text-pink-800',
      merchant: 'bg-indigo-100 text-indigo-800',
      custody: 'bg-red-100 text-red-800',
      financial: 'bg-emerald-100 text-emerald-800',
      news: 'bg-sky-100 text-sky-800',
      education: 'bg-amber-100 text-amber-800',
      development: 'bg-violet-100 text-violet-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Bitcoin Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the best tools, services, and information to enhance your Bitcoin journey
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
            />
            <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 bg-white p-6 rounded-xl shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {resourceTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          selectedType === type.value
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {getTypeIcon(type.value)}
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedTag('all')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTag === 'all'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All Tags
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTag === tag
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                      {resourceTypes.find(t => t.value === resource.type)?.label}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-orange-500 transition-colors">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                  {resource.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {resource.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm flex items-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Visit Resource
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No resources found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Resources;