/**
 * Home Page - Tychee SDK Demo Landing
 */

'use client';

import Link from 'next/link';
import { useTychee } from '@/lib/tychee-provider';
import { CreditCard, Shield, Zap, Lock, ArrowRight, Wallet, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { isConnected, walletAddress } = useTychee();

  const features = [
    {
      icon: Lock,
      title: 'Self-Custody Encryption',
      description: 'User owns their encryption keys derived from Stellar wallet. No master key vulnerability.',
    },
    {
      icon: Shield,
      title: 'RBI CoFT Compliant',
      description: 'Built for Card-on-File Tokenization regulatory guidelines.',
    },
    {
      icon: Zap,
      title: 'Stellar Blockchain',
      description: 'Fast, secure, low-cost transactions on Soroban smart contracts.',
    },
    {
      icon: CreditCard,
      title: 'AES-256-GCM',
      description: 'Industry-standard encryption compatible with ring library.',
    },
  ];

  const codeExample = `import { TycheeSDK, CardData } from '@tychee/sdk';

const sdk = new TycheeSDK({
  stellarNetwork: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  tokenVaultAddress: 'CONTRACT_ADDRESS',
  useAccountAbstraction: false,
});

await sdk.initialize(secretKey);

const cardData: CardData = {
  pan: '4242424242424242',
  cvv: '123',
  expiryMonth: '12',
  expiryYear: '26',
  cardholderName: 'John Doe',
  network: 'visa',
};

const token = await sdk.storeCard(cardData);
console.log('Token Hash:', token.tokenHash);`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm mb-6">
          <span>@tychee/sdk v0.1.2</span>
          <CheckCircle className="w-4 h-4" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Card Tokenization
          </span>
          <br />
          <span className="text-gray-100">on Stellar Blockchain</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Regulatory-compliant card tokenization with Web3 self-custody.
          Encrypt and store payment cards on Soroban smart contracts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isConnected ? (
            <Link
              href="/cards"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all"
            >
              <CreditCard className="w-5 h-5" />
              Go to Cards Hub
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-gray-400 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect wallet to get started
            </div>
          )}

          <a
            href="https://www.npmjs.com/package/@tychee/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
          >
            View on NPM
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {isConnected && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Connected: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
        {features.map((feature, i) => (
          <div
            key={i}
            className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-gray-700 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Code Example */}
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Quick Start</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900/50">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="text-gray-500 text-sm ml-2">tokenize-card.ts</span>
          </div>
          <pre className="p-6 overflow-x-auto text-sm">
            <code className="text-gray-300 font-mono">{codeExample}</code>
          </pre>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 py-12">
        <Link
          href="/cards"
          className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-violet-500/50 transition-all"
        >
          <CreditCard className="w-8 h-8 text-violet-400 mb-4" />
          <h3 className="font-semibold text-lg mb-2 group-hover:text-violet-400 transition-colors">
            Cards Hub
          </h3>
          <p className="text-gray-400 text-sm">
            Tokenize and manage your payment cards with AES-256-GCM encryption.
          </p>
        </Link>

        <Link
          href="/rewards"
          className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-violet-500/50 transition-all"
        >
          <Shield className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-400 transition-colors">
            Rewards
          </h3>
          <p className="text-gray-400 text-sm">
            Track points, tiers, and rewards earned from card tokenization.
          </p>
        </Link>

        <Link
          href="/spends"
          className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-violet-500/50 transition-all"
        >
          <Zap className="w-8 h-8 text-pink-400 mb-4" />
          <h3 className="font-semibold text-lg mb-2 group-hover:text-pink-400 transition-colors">
            Spends
          </h3>
          <p className="text-gray-400 text-sm">
            View transaction history and spending analytics.
          </p>
        </Link>
      </div>
    </div>
  );
}
