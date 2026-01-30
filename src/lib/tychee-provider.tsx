/**
 * TycheeProvider - React Context for Tychee SDK integration
 * Uses @creit-tech/stellar-wallets-kit for unified wallet management
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import {
    StellarWalletsKit,
    WalletNetwork,
    FreighterModule,
    LobstrModule,
    RabetModule,
    xBullModule,
    AlbedoModule,
    HanaModule,
    ISupportedWallet,
} from '@creit.tech/stellar-wallets-kit';

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
    sdkReady: boolean; // true when SDK is initialized and card operations are available

    // Wallet State
    walletAddress: string | null;
    isConnected: boolean;
    selectedWalletId: string | null;

    // Actions
    connect: (secretKey: string) => Promise<void>;
    connectWallet: () => Promise<void>;
    disconnect: () => Promise<void>;
    signTransaction: (xdr: string) => Promise<string>;

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

// Get network passphrase based on environment
const getNetwork = (): WalletNetwork => {
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
    return network === 'mainnet' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;
};

// Create stellar-wallets-kit singleton
let kitInstance: StellarWalletsKit | null = null;

const getKit = (): StellarWalletsKit => {
    if (!kitInstance) {
        kitInstance = new StellarWalletsKit({
            network: getNetwork(),
            selectedWalletId: undefined,
            modules: [
                new FreighterModule(),
                new LobstrModule(),
                new RabetModule(),
                new xBullModule(),
                new AlbedoModule(),
                new HanaModule(),
            ],
        });
    }
    return kitInstance;
};

export function TycheeProvider({ children }: TycheeProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Hydration fix
    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper function to initialize SDK with external signer for a given address and wallet
    const initializeSdkWithSigner = useCallback(async (address: string) => {
        const kit = getKit();

        // Create external signer function for SDK
        const externalSigner = async (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => {
            const network = getNetwork();
            const networkPassphrase = network === WalletNetwork.PUBLIC
                ? 'Public Global Stellar Network ; September 2015'
                : 'Test SDF Network ; September 2015';
            const { signedTxXdr } = await kit.signTransaction(xdr, {
                networkPassphrase: opts?.networkPassphrase || networkPassphrase,
                address: opts?.address || address,
            });
            return { signedTxXdr, signerAddress: address };
        };

        // Create message signer for encryption key derivation
        const messageSigner = async (message: string, opts?: { networkPassphrase?: string; address?: string }) => {
            const network = getNetwork();
            const networkPassphrase = network === WalletNetwork.PUBLIC
                ? 'Public Global Stellar Network ; September 2015'
                : 'Test SDF Network ; September 2015';
            try {
                const { signedMessage } = await kit.signMessage(message, {
                    networkPassphrase: opts?.networkPassphrase || networkPassphrase,
                    address: opts?.address || address,
                });
                return { signedMessage, signerAddress: address };
            } catch {
                // Fallback: derive from a hash of the address + message
                const crypto = await import('crypto');
                const hash = crypto.createHash('sha256').update(address + message).digest('hex');
                return { signedMessage: hash, signerAddress: address };
            }
        };

        // Initialize SDK with external signer
        try {
            const { TycheeSDK } = await import('@tychee/sdk');

            const config = {
                stellarNetwork: (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet',
                horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
                sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
                tokenVaultAddress: process.env.NEXT_PUBLIC_TOKEN_VAULT_ADDRESS || '',
                useAccountAbstraction: process.env.NEXT_PUBLIC_USE_ACCOUNT_ABSTRACTION === 'true',
            };

            sdkInstance = new TycheeSDK(config);
            await sdkInstance.initializeWithSigner(address, externalSigner, messageSigner);
            setSdkReady(true);
            return true;
        } catch (sdkError) {
            console.error('Could not initialize SDK with signer:', sdkError);
            setSdkReady(false);
            return false;
        }
    }, []);

    // Restore session from localStorage
    useEffect(() => {
        if (!mounted) return;

        const savedAddress = localStorage.getItem('tychee_wallet_address');
        const savedSecret = localStorage.getItem('tychee_wallet_secret');
        const savedWalletId = localStorage.getItem('tychee_wallet_id');

        if (savedAddress && savedSecret) {
            // Full connection with SDK (secret key)
            connect(savedSecret).catch(console.error);
        } else if (savedAddress && savedWalletId) {
            // Wallet extension connection - need to reinitialize SDK with signer
            setWalletAddress(savedAddress);
            setSelectedWalletId(savedWalletId);
            getKit().setWallet(savedWalletId);

            // Initialize SDK with external signer
            initializeSdkWithSigner(savedAddress).then((success) => {
                setIsInitialized(true);
                if (success) {
                    console.log('Session restored with wallet extension SDK support');
                }
            });
        } else if (savedAddress) {
            // Just address, no wallet ID - show as connected but SDK won't work
            setWalletAddress(savedAddress);
            setIsInitialized(true);
        }
    }, [mounted, initializeSdkWithSigner]);

    // Connect with secret key (for SDK operations)
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
            setSdkReady(true);
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

    // Connect with wallet extension using stellar-wallets-kit
    const connectWallet = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const kit = getKit();

            await new Promise<void>((resolve, reject) => {
                kit.openModal({
                    onWalletSelected: async (option: ISupportedWallet) => {
                        try {
                            kit.setWallet(option.id);
                            const { address } = await kit.getAddress();

                            setWalletAddress(address);
                            setSelectedWalletId(option.id);

                            // Initialize SDK with external signer
                            await initializeSdkWithSigner(address);

                            setIsInitialized(true);

                            // Persist session
                            localStorage.setItem('tychee_wallet_address', address);
                            localStorage.setItem('tychee_wallet_id', option.id);

                            resolve();
                        } catch (err: any) {
                            console.error('Failed to get address:', err);
                            reject(err);
                        }
                    },
                    onClosed: (err: Error) => {
                        // User closed modal without selecting
                        setIsLoading(false);
                        resolve();
                    },
                    modalTitle: 'Connect Your Wallet',
                    notAvailableText: 'Not installed',
                });
            });
        } catch (err: any) {
            console.error('Wallet connection failed:', err);
            setError(err.message || 'Failed to connect wallet');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [initializeSdkWithSigner]);

    // Sign transaction using the connected wallet
    const signTransaction = useCallback(async (xdr: string): Promise<string> => {
        if (!walletAddress) {
            throw new Error('No wallet connected');
        }

        const kit = getKit();
        const network = getNetwork();

        const { signedTxXdr } = await kit.signTransaction(xdr, {
            networkPassphrase: network,
            address: walletAddress,
        });

        return signedTxXdr;
    }, [walletAddress]);

    // Disconnect
    const disconnect = useCallback(async () => {
        try {
            const kit = getKit();
            await kit.disconnect();
        } catch (err) {
            console.error('Error disconnecting kit:', err);
        }

        sdkInstance = null;
        setWalletAddress(null);
        setSelectedWalletId(null);
        setIsInitialized(false);
        setError(null);

        localStorage.removeItem('tychee_wallet_address');
        localStorage.removeItem('tychee_wallet_secret');
        localStorage.removeItem('tychee_wallet_id');
    }, []);

    // Card Operations
    const tokenizeCard = useCallback(async (cardData: CardData): Promise<TokenMetadata> => {
        if (!sdkInstance) {
            throw new Error('SDK not initialized. Please connect a wallet first.');
        }
        return sdkInstance.storeCard(cardData);
    }, []);

    const retrieveCard = useCallback(async (): Promise<TokenMetadata | null> => {
        if (!sdkInstance) {
            throw new Error('SDK not initialized. Please connect a wallet first.');
        }
        return sdkInstance.retrieveCard();
    }, []);

    const revokeCard = useCallback(async () => {
        if (!sdkInstance) {
            throw new Error('SDK not initialized. Please connect a wallet first.');
        }
        return sdkInstance.revokeCard();
    }, []);

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
        sdkReady,
        walletAddress,
        isConnected: !!walletAddress,
        selectedWalletId,
        connect,
        connectWallet,
        disconnect,
        signTransaction,
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
