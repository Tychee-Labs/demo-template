/**
 * Vouchers Page - Browse and Redeem Vouchers
 */

'use client';

import { useState } from 'react';
import { useTychee } from '@/lib/tychee-provider';
import { Receipt, Tag, Clock, CheckCircle, Wallet, Search, Filter } from 'lucide-react';

interface Voucher {
    id: string;
    title: string;
    description: string;
    discount: string;
    partner: string;
    category: string;
    validUntil: string;
    status: 'available' | 'claimed' | 'used';
    pointsCost?: number;
}

export default function VouchersPage() {
    const { isConnected } = useTychee();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Demo vouchers data
    const vouchers: Voucher[] = [
        {
            id: '1',
            title: '20% Off on Electronics',
            description: 'Valid on all electronics purchases above ₹2,000',
            discount: '20% OFF',
            partner: 'TechMart',
            category: 'shopping',
            validUntil: '2026-03-15',
            status: 'available',
            pointsCost: 500,
        },
        {
            id: '2',
            title: 'Free Coffee',
            description: 'Get a free coffee at any participating cafe',
            discount: 'FREE',
            partner: 'CafeZone',
            category: 'dining',
            validUntil: '2026-02-28',
            status: 'available',
            pointsCost: 100,
        },
        {
            id: '3',
            title: '₹500 Off on Flights',
            description: 'Flat discount on domestic flight bookings',
            discount: '₹500 OFF',
            partner: 'SkyWays',
            category: 'travel',
            validUntil: '2026-04-30',
            status: 'claimed',
        },
        {
            id: '4',
            title: '15% Off on Groceries',
            description: 'Save on your weekly grocery shopping',
            discount: '15% OFF',
            partner: 'FreshMart',
            category: 'shopping',
            validUntil: '2026-02-15',
            status: 'available',
            pointsCost: 300,
        },
        {
            id: '5',
            title: 'Buy 1 Get 1 Free',
            description: 'BOGO offer on selected menu items',
            discount: 'BOGO',
            partner: 'BurgerKing',
            category: 'dining',
            validUntil: '2026-02-20',
            status: 'used',
        },
    ];

    const categories = ['all', 'shopping', 'dining', 'travel', 'entertainment'];

    const filteredVouchers = vouchers.filter((voucher) => {
        const matchesCategory = selectedCategory === 'all' || voucher.category === selectedCategory;
        const matchesSearch =
            voucher.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            voucher.partner.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getStatusColor = (status: Voucher['status']) => {
        switch (status) {
            case 'available': return 'text-green-400 bg-green-500/20';
            case 'claimed': return 'text-yellow-400 bg-yellow-500/20';
            case 'used': return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'shopping': return 'bg-blue-500/20 text-blue-400';
            case 'dining': return 'bg-orange-500/20 text-orange-400';
            case 'travel': return 'bg-purple-500/20 text-purple-400';
            case 'entertainment': return 'bg-pink-500/20 text-pink-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wallet className="w-10 h-10 text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
                    <p className="text-gray-400">
                        Connect your Stellar wallet to browse and claim vouchers.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Vouchers</h1>
                <p className="text-gray-400">
                    Browse and redeem vouchers using your reward points
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search vouchers..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition-colors ${selectedCategory === category
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vouchers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVouchers.map((voucher) => (
                    <div
                        key={voucher.id}
                        className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
                    >
                        {/* Voucher Header */}
                        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getCategoryColor(voucher.category)}`}>
                                    {voucher.category}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(voucher.status)}`}>
                                    {voucher.status}
                                </span>
                            </div>
                            <h3 className="font-semibold text-lg">{voucher.title}</h3>
                            <p className="text-gray-400 text-sm">{voucher.partner}</p>
                        </div>

                        {/* Discount Badge */}
                        <div className="p-6 flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                            <div className="text-center">
                                <Tag className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-violet-400">{voucher.discount}</div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-4">
                            <p className="text-gray-400 text-sm mb-4">{voucher.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Clock className="w-4 h-4" />
                                    Valid until {new Date(voucher.validUntil).toLocaleDateString()}
                                </div>

                                {voucher.status === 'available' && voucher.pointsCost && (
                                    <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors">
                                        {voucher.pointsCost} pts
                                    </button>
                                )}

                                {voucher.status === 'claimed' && (
                                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                                        <Receipt className="w-4 h-4" />
                                        Claimed
                                    </div>
                                )}

                                {voucher.status === 'used' && (
                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        Used
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredVouchers.length === 0 && (
                <div className="text-center py-16">
                    <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Vouchers Found</h3>
                    <p className="text-gray-400">
                        Try adjusting your search or filter criteria.
                    </p>
                </div>
            )}
        </div>
    );
}
