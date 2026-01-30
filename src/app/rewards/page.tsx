/**
 * Rewards Page - Points & Tiers Display
 */

'use client';

import { useTychee } from '@/lib/tychee-provider';
import { Gift, Star, Trophy, Crown, Wallet, ArrowUp, Sparkles } from 'lucide-react';

export default function RewardsPage() {
    const { isConnected, walletAddress } = useTychee();

    // Demo rewards data (in production, fetch from your backend)
    const rewardData = {
        totalPoints: 2500,
        tier: 'Silver',
        nextTier: 'Gold',
        pointsToNextTier: 7500,
        progress: 25,
    };

    const tiers = [
        { name: 'Bronze', icon: Star, points: 0, color: 'from-amber-700 to-amber-900', benefits: ['5% cashback', 'Basic support'] },
        { name: 'Silver', icon: Trophy, points: 1000, color: 'from-gray-400 to-gray-600', benefits: ['10% cashback', 'Priority support', 'Early access'] },
        { name: 'Gold', icon: Crown, points: 10000, color: 'from-yellow-400 to-yellow-600', benefits: ['15% cashback', 'VIP support', 'Exclusive events', 'Partner perks'] },
        { name: 'Platinum', icon: Sparkles, points: 25000, color: 'from-violet-400 to-purple-600', benefits: ['20% cashback', 'Dedicated manager', 'All benefits', 'Founding member access'] },
    ];

    const recentActivity = [
        { type: 'earn', description: 'Card tokenization bonus', points: 50, date: 'Today' },
        { type: 'earn', description: 'Welcome bonus', points: 100, date: 'Yesterday' },
        { type: 'redeem', description: 'Voucher redeemed', points: -200, date: '2 days ago' },
        { type: 'earn', description: 'Referral bonus', points: 500, date: '1 week ago' },
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
                        Connect your Stellar wallet to view your rewards and tier status.
                    </p>
                </div>
            </div>
        );
    }

    const currentTierIndex = tiers.findIndex(t => t.name === rewardData.tier);
    const CurrentTierIcon = tiers[currentTierIndex]?.icon || Star;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Rewards</h1>
                <p className="text-gray-400">
                    Track your points, tier status, and unlock exclusive benefits
                </p>
            </div>

            {/* Points Card */}
            <div className="p-8 bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl mb-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="text-violet-200 text-sm mb-1">Total Points</div>
                        <div className="text-5xl font-bold text-white">{rewardData.totalPoints.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <CurrentTierIcon className="w-5 h-5 text-white" />
                        <span className="text-white font-semibold">{rewardData.tier}</span>
                    </div>
                </div>

                {/* Progress to next tier */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-violet-200 mb-2">
                        <span>Progress to {rewardData.nextTier}</span>
                        <span>{rewardData.pointsToNextTier.toLocaleString()} points needed</span>
                    </div>
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-white/80 to-white rounded-full transition-all"
                            style={{ width: `${rewardData.progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-violet-200 text-sm">
                    <ArrowUp className="w-4 h-4" />
                    Keep earning to unlock {rewardData.nextTier} benefits!
                </div>
            </div>

            {/* Tiers Grid */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Tier Benefits</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    {tiers.map((tier, index) => {
                        const isActive = tier.name === rewardData.tier;
                        const TierIcon = tier.icon;

                        return (
                            <div
                                key={tier.name}
                                className={`p-4 rounded-xl border ${isActive
                                        ? 'border-violet-500 bg-violet-500/10'
                                        : 'border-gray-800 bg-gray-900/50'
                                    }`}
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center mb-3`}>
                                    <TierIcon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold mb-1">{tier.name}</h3>
                                <div className="text-gray-400 text-sm mb-3">
                                    {tier.points.toLocaleString()}+ points
                                </div>
                                <ul className="space-y-1">
                                    {tier.benefits.map((benefit, i) => (
                                        <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                                {isActive && (
                                    <div className="mt-3 px-2 py-1 bg-violet-500/20 rounded text-violet-400 text-xs font-medium text-center">
                                        Current Tier
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    {recentActivity.map((activity, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-4 ${index !== recentActivity.length - 1 ? 'border-b border-gray-800' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.type === 'earn' ? 'bg-green-500/20' : 'bg-orange-500/20'
                                    }`}>
                                    <Gift className={`w-5 h-5 ${activity.type === 'earn' ? 'text-green-400' : 'text-orange-400'
                                        }`} />
                                </div>
                                <div>
                                    <div className="font-medium">{activity.description}</div>
                                    <div className="text-gray-500 text-sm">{activity.date}</div>
                                </div>
                            </div>
                            <div className={`font-semibold ${activity.points > 0 ? 'text-green-400' : 'text-orange-400'
                                }`}>
                                {activity.points > 0 ? '+' : ''}{activity.points}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
