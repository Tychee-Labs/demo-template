/**
 * TycheeProvider - React Context for Tychee SDK integration
 * Uses dynamic import to avoid SSR issues with SDK's native dependencies
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Define types locally to avoid import issues
interface CardData {
    pan: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    cardholderName: string;
    network: 'visa' | 'mastercard' | 'rupay' | 'amex';
}

interface TokenMetadata {
    userId?: string;
    tokenHash: string;
    encryptedPayload?: Uint8Array;
    last4Digits: string;
    cardNetwork: string;
    status: string;
    createdAt: number;
    expiresAt?: number;
    sorobanTxId?: string;
}

interface TycheeContextType {
    // SDK State
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;

    // Wallet State
    walletAddress: string | null;
    isConnected: boolean;

    // Actions
    connect: (secretKey: string) => Promise<void>;
    connectWithFreighter: () => Promise<void>;
    disconnect: () => void;

    // Card Operations
    tokenizeCard: (cardData: CardData) => Promise<TokenMetadata>;
    retrieveCard: () => Promise<TokenMetadata | null>;
    revokeCard: () => Promise<{ success: boolean; txHash?: string; error?: string }>;

    // Validation
    validateCardNumber: (pan: string) => boolean;
    detectCardNetwork: (pan: string) => string;
    maskCardNumber: (pan: string) => string;
}

const TycheeContext = createContext<TycheeContextType | null>(null);

interface TycheeProviderProps {
    children: ReactNode;
}

// SDK singleton reference
let sdkInstance: any = null;

export function TycheeProvider({ children }: TycheeProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Hydration fix
    useEffect(() => {
        setMounted(true);
    }, []);

    // Restore session from localStorage
    useEffect(() => {
        if (!mounted) return;

        const savedAddress = localStorage.getItem('tychee_wallet_address');
        const savedSecret = localStorage.getItem('tychee_wallet_secret');

        if (savedAddress && savedSecret) {
            connect(savedSecret).catch(console.error);
        }
    }, [mounted]);

    // Connect with secret key
    const connect = useCallback(async (secretKey: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Dynamically import SDK only on client side
            const { TycheeSDK } = await import('@tychee/sdk');

            const config = {
                stellarNetwork: (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet',
                horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
                sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
                tokenVaultAddress: process.env.NEXT_PUBLIC_TOKEN_VAULT_ADDRESS || '',
                useAccountAbstraction: process.env.NEXT_PUBLIC_USE_ACCOUNT_ABSTRACTION === 'true',
            };

            sdkInstance = new TycheeSDK(config);
            await sdkInstance.initialize(secretKey);

            const address = sdkInstance.getUserAddress();
            setWalletAddress(address);
            setIsInitialized(true);

            // Persist session
            localStorage.setItem('tychee_wallet_address', address);
            localStorage.setItem('tychee_wallet_secret', secretKey);

        } catch (err: any) {
            console.error('SDK initialization failed:', err);
            setError(err.message || 'Failed to connect wallet');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Connect with Freighter wallet
    const connectWithFreighter = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (typeof window === 'undefined' || !window.freighterApi) {
                throw new Error('Freighter wallet not found. Please install the Freighter browser extension.');
            }

            const { isConnected: checkConnected, getPublicKey } = window.freighterApi;

            const connected = await checkConnected();
            if (!connected) {
                throw new Error('Please connect your Freighter wallet');
            }

            const publicKey = await getPublicKey();

            // For Freighter, store public key only
            setWalletAddress(publicKey);
            setIsInitialized(true);

            localStorage.setItem('tychee_wallet_address', publicKey);

        } catch (err: any) {
            console.error('Freighter connection failed:', err);
            setError(err.message || 'Failed to connect Freighter');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        sdkInstance = null;
        setWalletAddress(null);
        setIsInitialized(false);
        setError(null);

        localStorage.removeItem('tychee_wallet_address');
        localStorage.removeItem('tychee_wallet_secret');
    }, []);

    // Card Operations
    const tokenizeCard = useCallback(async (cardData: CardData): Promise<TokenMetadata> => {
        if (!sdkInstance || !isInitialized) {
            throw new Error('SDK not initialized. Please connect your wallet first.');
        }
        return sdkInstance.storeCard(cardData);
    }, [isInitialized]);

    const retrieveCard = useCallback(async (): Promise<TokenMetadata | null> => {
        if (!sdkInstance || !isInitialized) {
            throw new Error('SDK not initialized. Please connect your wallet first.');
        }
        return sdkInstance.retrieveCard();
    }, [isInitialized]);

    const revokeCard = useCallback(async () => {
        if (!sdkInstance || !isInitialized) {
            throw new Error('SDK not initialized. Please connect your wallet first.');
        }
        return sdkInstance.revokeCard();
    }, [isInitialized]);

    // Validation utilities (can work without SDK)
    const validateCardNumber = useCallback((pan: string): boolean => {
        const cleaned = pan.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) return false;

        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i], 10);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    }, []);

    const detectCardNetwork = useCallback((pan: string): string => {
        const cleaned = pan.replace(/\D/g, '');
        if (/^4/.test(cleaned)) return 'visa';
        if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
        if (/^3[47]/.test(cleaned)) return 'amex';
        if (/^(60|65)/.test(cleaned)) return 'rupay';
        return 'visa';
    }, []);

    const maskCardNumber = useCallback((pan: string): string => {
        const cleaned = pan.replace(/\D/g, '');
        return '*'.repeat(Math.max(0, cleaned.length - 4)) + cleaned.slice(-4);
    }, []);

    // Always provide context - use mounted for conditional localStorage access
    const contextValue: TycheeContextType = {
        isInitialized,
        isLoading,
        error,
        walletAddress,
        isConnected: !!walletAddress,
        connect,
        connectWithFreighter,
        disconnect,
        tokenizeCard,
        retrieveCard,
        revokeCard,
        validateCardNumber,
        detectCardNetwork,
        maskCardNumber,
    };

    return (
        <TycheeContext.Provider value={contextValue}>
            {children}
        </TycheeContext.Provider>
    );
}

export function useTychee() {
    const context = useContext(TycheeContext);
    if (!context) {
        throw new Error('useTychee must be used within a TycheeProvider');
    }
    return context;
}

// Type declaration for Freighter
declare global {
    interface Window {
        freighterApi?: {
            isConnected: () => Promise<boolean>;
            getPublicKey: () => Promise<string>;
            signTransaction: (xdr: string) => Promise<string>;
            getNetwork: () => Promise<string>;
        };
    }
}
