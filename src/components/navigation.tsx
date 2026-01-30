/**
 * Navigation Component
 * Header with wallet connection and navigation links
 */

'use client';

import Link from 'next/link';
import { useTychee } from '@/lib/tychee-provider';
import { CreditCard, Gift, Receipt, BarChart3, Wallet, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
    const { walletAddress, isConnected, isLoading, connect, disconnect } = useTychee();
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [secretKey, setSecretKey] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        if (!secretKey.trim()) {
            setError('Please enter a secret key');
            return;
        }

        setConnecting(true);
        setError('');

        try {
            await connect(secretKey);
            setShowConnectModal(false);
            setSecretKey('');
        } catch (err: any) {
            setError(err.message || 'Connection failed');
        } finally {
            setConnecting(false);
        }
    };

    const handleGenerateDemo = async () => {
        setConnecting(true);
        setError('');

        try {
            // Import Stellar SDK to generate keypair
            const StellarSdk = await import('@stellar/stellar-sdk');
            const keypair = StellarSdk.Keypair.random();
            const secret = keypair.secret();

            // Fund with Friendbot
            const response = await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
            if (!response.ok) {
                throw new Error('Failed to fund testnet account');
            }

            await connect(secret);
            setShowConnectModal(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create demo wallet');
        } finally {
            setConnecting(false);
        }
    };

    const navLinks = [
        { href: '/', label: 'Home', icon: Wallet },
        { href: '/cards', label: 'Cards', icon: CreditCard },
        { href: '/rewards', label: 'Rewards', icon: Gift },
        { href: '/vouchers', label: 'Vouchers', icon: Receipt },
        { href: '/spends', label: 'Spends', icon: BarChart3 },
    ];

    return (
        <>
            <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <span className="font-semibold text-lg">Tychee Demo</span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    <link.icon className="w-4 h-4" />
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Wallet Connection */}
                        <div className="flex items-center gap-3">
                            {isConnected ? (
                                <>
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-sm text-gray-300 font-mono">
                                            {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={disconnect}
                                        className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="hidden sm:inline text-sm">Disconnect</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowConnectModal(true)}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg transition-all font-medium text-sm disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Wallet className="w-4 h-4" />
                                    )}
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Connect Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>

                        <div className="space-y-4">
                            {/* Demo Account Option */}
                            <button
                                onClick={handleGenerateDemo}
                                disabled={connecting}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg transition-all font-medium disabled:opacity-50"
                            >
                                {connecting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Wallet className="w-5 h-5" />
                                        Generate Demo Wallet
                                    </>
                                )}
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-800" />
                                <span className="text-gray-500 text-sm">or enter secret key</span>
                                <div className="flex-1 h-px bg-gray-800" />
                            </div>

                            {/* Secret Key Input */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Stellar Secret Key (SXXX...)
                                </label>
                                <input
                                    type="password"
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    placeholder="Enter your secret key"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono text-sm"
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleConnect}
                                disabled={connecting || !secretKey.trim()}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:hover:bg-gray-800"
                            >
                                Connect with Secret Key
                            </button>

                            <button
                                onClick={() => setShowConnectModal(false)}
                                className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            ⚠️ Never share your secret key. For testnet demo only.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
