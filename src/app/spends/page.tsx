/**
 * Spends Page - Transaction History & Analytics
 */

'use client';

import { useTychee } from '@/lib/tychee-provider';
import { Wallet, BarChart3, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

export default function SpendsPage() {
    const { isConnected, walletAddress } = useTychee();

    // Demo transaction data
    const transactions = [
        { id: '1', type: 'credit', description: 'Cashback Reward', amount: 150, date: '2026-01-30', category: 'rewards' },
        { id: '2', type: 'debit', description: 'Coffee Shop', amount: 250, date: '2026-01-29', category: 'dining' },
        { id: '3', type: 'credit', description: 'Card Tokenization Bonus', amount: 50, date: '2026-01-28', category: 'bonus' },
        { id: '4', type: 'debit', description: 'Online Shopping', amount: 1500, date: '2026-01-27', category: 'shopping' },
        { id: '5', type: 'credit', description: 'Referral Bonus', amount: 500, date: '2026-01-25', category: 'bonus' },
        { id: '6', type: 'debit', description: 'Flight Booking', amount: 5000, date: '2026-01-24', category: 'travel' },
        { id: '7', type: 'credit', description: 'Monthly Cashback', amount: 750, date: '2026-01-20', category: 'rewards' },
    ];

    const stats = {
        totalSpent: 6750,
        totalEarned: 1450,
        transactionCount: 7,
        averageTransaction: 1171,
    };

    const categoryBreakdown = [
        { name: 'Shopping', amount: 1500, percentage: 22, color: 'bg-blue-500' },
        { name: 'Dining', amount: 250, percentage: 4, color: 'bg-orange-500' },
        { name: 'Travel', amount: 5000, percentage: 74, color: 'bg-purple-500' },
    ];

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wallet className="w-10 h-10 text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
                    <p className="text-gray-400">
                        Connect your Stellar wallet to view your spending analytics.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Spends Analytics</h1>
                <p className="text-gray-400">
                    Track your transactions and spending patterns
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <ArrowDownLeft className="w-4 h-4 text-red-400" />
                        Total Spent
                    </div>
                    <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
                </div>

                <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                        Total Earned
                    </div>
                    <div className="text-2xl font-bold text-green-400">₹{stats.totalEarned.toLocaleString()}</div>
                </div>

                <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <CreditCard className="w-4 h-4" />
                        Transactions
                    </div>
                    <div className="text-2xl font-bold">{stats.transactionCount}</div>
                </div>

                <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <TrendingUp className="w-4 h-4" />
                        Avg. Transaction
                    </div>
                    <div className="text-2xl font-bold">₹{stats.averageTransaction.toLocaleString()}</div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Transaction History */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                        {transactions.map((tx, index) => (
                            <div
                                key={tx.id}
                                className={`flex items-center justify-between p-4 ${index !== transactions.length - 1 ? 'border-b border-gray-800' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                                        }`}>
                                        {tx.type === 'credit' ? (
                                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <ArrowDownLeft className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium">{tx.description}</div>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(tx.date).toLocaleDateString('en-IN', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                            <span className="px-1.5 py-0.5 bg-gray-800 rounded text-xs capitalize">
                                                {tx.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-white'
                                    }`}>
                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                        <div className="flex h-4 rounded-full overflow-hidden mb-6">
                            {categoryBreakdown.map((cat, index) => (
                                <div
                                    key={cat.name}
                                    className={`${cat.color} transition-all`}
                                    style={{ width: `${cat.percentage}%` }}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            {categoryBreakdown.map((cat) => (
                                <div key={cat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded ${cat.color}`} />
                                        <span className="text-gray-300">{cat.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">₹{cat.amount.toLocaleString()}</div>
                                        <div className="text-gray-500 text-sm">{cat.percentage}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl">
                        <div className="flex items-center gap-2 text-violet-400 mb-2">
                            <BarChart3 className="w-5 h-5" />
                            <span className="font-medium">This Month</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            You've earned <span className="text-green-400 font-medium">₹{stats.totalEarned}</span> in rewards,
                            which is <span className="text-violet-400 font-medium">21%</span> of your total spending!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
