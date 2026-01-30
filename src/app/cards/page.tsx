/**
 * Cards Hub Page - Card Tokenization with @tychee/sdk
 */

'use client';

import { useState, useEffect } from 'react';
import { useTychee } from '@/lib/tychee-provider';
import {
    CreditCard, Plus, Shield, Trash2, Loader2,
    CheckCircle, AlertCircle, Lock, Wallet
} from 'lucide-react';

interface StoredCard {
    tokenHash: string;
    last4Digits: string;
    cardNetwork: string;
    status: string;
    createdAt: number;
    expiresAt: number;
    sorobanTxId?: string;
}

export default function CardsPage() {
    const { isConnected, walletAddress, tokenizeCard, retrieveCard, revokeCard, validateCardNumber, isLoading: sdkLoading } = useTychee();
    const [cards, setCards] = useState<StoredCard[]>([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [isTokenizing, setIsTokenizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');

    // Fetch stored card on mount
    useEffect(() => {
        if (isConnected) {
            fetchCard();
        }
    }, [isConnected]);

    const fetchCard = async () => {
        try {
            const token = await retrieveCard();
            if (token) {
                setCards([token as StoredCard]);
            } else {
                setCards([]);
            }
        } catch (err) {
            console.error('Failed to fetch card:', err);
        }
    };

    // Format card number with spaces
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16);
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : cleaned;
    };

    // Format expiry as MM/YY
    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        return cleaned;
    };

    // Detect card network
    const detectNetwork = (pan: string): 'visa' | 'mastercard' | 'rupay' | 'amex' => {
        const cleaned = pan.replace(/\s/g, '');
        if (/^4/.test(cleaned)) return 'visa';
        if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
        if (/^3[47]/.test(cleaned)) return 'amex';
        if (/^(60|65)/.test(cleaned)) return 'rupay';
        return 'visa';
    };

    // Handle tokenization
    const handleTokenize = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTokenizing(true);
        setError(null);
        setSuccess(null);

        try {
            const cleanPan = cardNumber.replace(/\s/g, '');

            // Validate card number using local Luhn check
            if (!validateCardNumber(cleanPan)) {
                throw new Error('Invalid card number. Please check and try again.');
            }

            const [expiryMonth, expiryYear] = expiry.split('/');

            const cardData = {
                pan: cleanPan,
                cvv,
                expiryMonth,
                expiryYear,
                cardholderName: cardholderName.toUpperCase(),
                network: detectNetwork(cleanPan),
            };

            // Tokenize using SDK
            const tokenMetadata = await tokenizeCard(cardData);

            setSuccess(`Card tokenized successfully! Token: ${tokenMetadata.tokenHash.slice(0, 16)}...`);
            setShowAddCard(false);
            resetForm();

            // Add to local list
            setCards([tokenMetadata as StoredCard]);

        } catch (err: any) {
            console.error('Tokenization error:', err);
            setError(err.message || 'Failed to tokenize card');
        } finally {
            setIsTokenizing(false);
        }
    };

    // Handle revocation
    const handleRevoke = async (tokenHash: string) => {
        if (!confirm('Are you sure you want to revoke this card token? This cannot be undone.')) {
            return;
        }

        try {
            const result = await revokeCard();
            if (result.success) {
                setCards([]);
                setSuccess('Card token revoked successfully');
            } else {
                setError(result.error || 'Failed to revoke card');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to revoke card');
        }
    };

    const resetForm = () => {
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setCardholderName('');
    };

    // Get card brand colors
    const getCardGradient = (network: string) => {
        switch (network) {
            case 'visa': return 'from-blue-600 to-blue-800';
            case 'mastercard': return 'from-red-500 to-orange-600';
            case 'amex': return 'from-gray-600 to-gray-800';
            case 'rupay': return 'from-green-600 to-teal-700';
            default: return 'from-violet-600 to-purple-800';
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
                    <p className="text-gray-400 mb-6">
                        Connect your Stellar wallet to tokenize and manage your cards securely.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Cards Hub</h1>
                    <p className="text-gray-400">
                        Tokenize your cards on Stellar blockchain with AES-256-GCM encryption
                    </p>
                </div>
                <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Card
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-900/30 rounded-lg mb-6 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-900/30 rounded-lg mb-6 text-green-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl">
                    <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Tokenized Cards</h3>
                    <p className="text-gray-400 mb-6">
                        Add your first card to tokenize it securely on the blockchain.
                    </p>
                    <button
                        onClick={() => setShowAddCard(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First Card
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {cards.map((card, index) => (
                        <div
                            key={card.tokenHash || index}
                            className={`relative p-6 rounded-2xl bg-gradient-to-br ${getCardGradient(card.cardNetwork)} overflow-hidden`}
                        >
                            {/* Card chip pattern */}
                            <div className="absolute top-6 left-6 w-12 h-9 bg-yellow-400/80 rounded-md" />

                            {/* Card content */}
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="mt-2">
                                        <Lock className="w-5 h-5 text-white/60" />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white/80 text-sm">Stellar Tokenized</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="text-2xl font-mono text-white tracking-wider">
                                        •••• •••• •••• {card.last4Digits}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-white/60 text-xs mb-1">TOKEN HASH</div>
                                        <div className="text-white font-mono text-sm">
                                            {card.tokenHash?.slice(0, 12)}...
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white/60 text-xs mb-1">NETWORK</div>
                                        <div className="text-white font-semibold uppercase">
                                            {card.cardNetwork}
                                        </div>
                                    </div>
                                </div>

                                {/* Revoke button */}
                                <button
                                    onClick={() => handleRevoke(card.tokenHash)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg text-white/80 hover:text-white transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Security Note */}
            <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-medium mb-1">Bank-Grade Security</h4>
                    <p className="text-gray-400 text-sm">
                        Your card data is encrypted with AES-256-GCM using a key derived from your Stellar wallet.
                        Only you can decrypt your data. We never store actual card numbers.
                    </p>
                </div>
            </div>

            {/* Add Card Modal */}
            {showAddCard && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-semibold mb-6">Tokenize Card</h2>

                        <form onSubmit={handleTokenize} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    placeholder="4242 4242 4242 4242"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Expiry</label>
                                    <input
                                        type="text"
                                        value={expiry}
                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">CVV</label>
                                    <input
                                        type="password"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="•••"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Cardholder Name</label>
                                <input
                                    type="text"
                                    value={cardholderName}
                                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                                    placeholder="JOHN DOE"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                                    required
                                />
                            </div>

                            {/* Network detection */}
                            {cardNumber.length >= 4 && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <CreditCard className="w-4 h-4" />
                                    Detected: <span className="capitalize font-medium text-white">{detectNetwork(cardNumber)}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCard(false)}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isTokenizing}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                                >
                                    {isTokenizing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Tokenizing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5" />
                                            Tokenize
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Your card is encrypted client-side. We never see your full card number.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
