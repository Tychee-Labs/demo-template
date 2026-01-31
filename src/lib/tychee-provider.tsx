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

    // Wallet-derived encryption key (stored after message signing)
    const walletEncryptionKeyRef = useRef<Buffer | null>(null);

    // Helper to derive encryption key from wallet message signature
    const deriveKeyFromWalletSignature = useCallback(async (address: string): Promise<Buffer> => {
        const kit = getKit();
        const network = getNetwork();
        const networkPassphrase = network === WalletNetwork.PUBLIC
            ? 'Public Global Stellar Network ; September 2015'
            : 'Test SDF Network ; September 2015';

        // Deterministic message for key derivation
        const message = `Tychee:EncryptionKey:${address}`;

        try {
            // Request wallet to sign the message
            const { signedMessage } = await kit.signMessage(message, {
                networkPassphrase,
                address,
            });

            // Import crypto for hashing
            const { RingCompatibleCrypto } = await import('@tychee/sdk');

            // Hash the signature to get a 32-byte key
            const keyBuffer = RingCompatibleCrypto.hash(Buffer.from(signedMessage, 'base64'));
            return keyBuffer;
        } catch (err: any) {
            console.error('Failed to derive encryption key from wallet:', err);
            throw new Error('Failed to derive encryption key. Please approve the message signing request in your wallet.');
        }
    }, []);

    // Store card using wallet extension (custom flow with external signing)
    const storeCardWithWallet = useCallback(async (cardData: CardData): Promise<TokenMetadata> => {
        if (!walletAddress || !walletEncryptionKeyRef.current) {
            throw new Error('Wallet not properly initialized for card operations.');
        }

        const kit = getKit();
        const network = getNetwork();
        const networkPassphrase = network === WalletNetwork.PUBLIC
            ? 'Public Global Stellar Network ; September 2015'
            : 'Test SDF Network ; September 2015';

        // Import SDK crypto utilities and Stellar SDK
        const { CardTokenizer } = await import('@tychee/sdk');
        const StellarSdk = await import('@stellar/stellar-sdk');
        const {
            Contract,
            TransactionBuilder,
            BASE_FEE,
            Networks,
            Address,
            nativeToScVal,
            Account
        } = StellarSdk;
        const { Server: SorobanServer } = StellarSdk.rpc;

        // Validate card
        if (!CardTokenizer.validateCardNumber(cardData.pan)) {
            throw new Error('Invalid card number (failed Luhn check)');
        }

        // Auto-detect network
        const detectedNetwork = CardTokenizer.detectCardNetwork(cardData.pan);
        if (detectedNetwork !== 'unknown') {
            cardData.network = detectedNetwork as 'visa' | 'mastercard' | 'rupay' | 'amex';
        }

        // Encrypt card data using wallet-derived key
        const { encryptedPayload, tokenHash, last4Digits } = await CardTokenizer.encryptCard(
            cardData,
            walletEncryptionKeyRef.current
        );

        // Calculate expiration timestamp
        const expiryDate = new Date(parseInt('20' + cardData.expiryYear), parseInt(cardData.expiryMonth) - 1, 1);
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        const expiresAt = Math.floor(expiryDate.getTime() / 1000);

        // Use Soroban RPC for contract calls
        const sorobanRpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
        const tokenVaultAddress = process.env.NEXT_PUBLIC_TOKEN_VAULT_ADDRESS || '';
        const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

        const sorobanServer = new SorobanServer(sorobanRpcUrl);
        const contract = new Contract(tokenVaultAddress);
        const userAddress = new Address(walletAddress);

        // Convert data to Soroban types
        const encryptedBytes = nativeToScVal(encryptedPayload, { type: 'bytes' });
        const hashBytes = nativeToScVal(tokenHash, { type: 'bytes' });
        const last4 = nativeToScVal(last4Digits, { type: 'string' });
        const networkVal = nativeToScVal(cardData.network, { type: 'string' });
        const expiresAtVal = nativeToScVal(expiresAt, { type: 'u64' });

        // Get account from Soroban RPC
        const accountResponse = await sorobanServer.getAccount(walletAddress);
        const account = new Account(accountResponse.accountId(), accountResponse.sequenceNumber());

        // Build transaction
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: stellarNetwork === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
        })
            .addOperation(contract.call('store_token', userAddress.toScVal(), encryptedBytes, hashBytes, last4, networkVal, expiresAtVal))
            .setTimeout(30)
            .build();

        // Prepare transaction (simulate and get proper fees/resources)
        const preparedTx = await sorobanServer.prepareTransaction(transaction);

        // Get wallet to sign the prepared transaction
        const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR(), {
            networkPassphrase,
            address: walletAddress,
        });

        // Reconstruct signed transaction and submit via Soroban RPC
        const signedTx = TransactionBuilder.fromXDR(
            signedTxXdr,
            stellarNetwork === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
        );

        // Submit transaction via Soroban RPC
        const sendResponse = await sorobanServer.sendTransaction(signedTx);

        if (sendResponse.status === 'PENDING') {
            // Poll for completion
            let getResponse = await sorobanServer.getTransaction(sendResponse.hash);
            while (getResponse.status === 'NOT_FOUND') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                getResponse = await sorobanServer.getTransaction(sendResponse.hash);
            }

            if (getResponse.status === 'SUCCESS') {
                console.log('Card stored on-chain via wallet extension:', sendResponse.hash);
            } else {
                throw new Error(`Transaction failed: ${getResponse.status}`);
            }
        } else if (sendResponse.status === 'ERROR') {
            throw new Error(`Transaction submission error: ${sendResponse.errorResult?.toXDR('base64') || 'Unknown error'}`);
        }

        // Return metadata
        const metadata: TokenMetadata = {
            userId: walletAddress,
            tokenHash: tokenHash.toString('hex'),
            encryptedPayload: new Uint8Array(encryptedPayload),
            last4Digits,
            cardNetwork: cardData.network,
            status: 'active',
            createdAt: Math.floor(Date.now() / 1000),
            expiresAt,
            sorobanTxId: sendResponse.hash,
        };

        return metadata;
    }, [walletAddress]);

    // Initialize SDK with wallet extension (with encryption key derivation)
    const initializeSdkWithWallet = useCallback(async (address: string): Promise<void> => {
        // First derive encryption key from wallet signature
        setError('Please sign the message in your wallet to enable card operations...');

        try {
            const encryptionKey = await deriveKeyFromWalletSignature(address);
            walletEncryptionKeyRef.current = encryptionKey;

            // Initialize SDK in read-only mode for contract interactions
            const { TycheeSDK } = await import('@tychee/sdk');

            const config = {
                stellarNetwork: (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet',
                horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
                sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
                tokenVaultAddress: process.env.NEXT_PUBLIC_TOKEN_VAULT_ADDRESS || '',
                useAccountAbstraction: process.env.NEXT_PUBLIC_USE_ACCOUNT_ABSTRACTION === 'true',
            };

            sdkInstance = new TycheeSDK(config);
            await sdkInstance.initializeReadOnly(address);

            // Mark SDK as ready since we have the encryption key
            setSdkReady(true);
            setError(null);
            console.log('SDK initialized with wallet extension - card operations enabled!');
        } catch (err: any) {
            console.error('Failed to initialize with wallet:', err);
            walletEncryptionKeyRef.current = null;
            setSdkReady(false);
            throw err;
        }
    }, [deriveKeyFromWalletSignature]);

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
            // Wallet extension connection - initialize with encryption key derivation
            setWalletAddress(savedAddress);
            setSelectedWalletId(savedWalletId);
            getKit().setWallet(savedWalletId);

            // Initialize SDK with wallet (will prompt for message signing)
            initializeSdkWithWallet(savedAddress)
                .then(() => {
                    setIsInitialized(true);
                    console.log('Session restored with wallet extension - card operations enabled!');
                })
                .catch((err: any) => {
                    console.error('Failed to restore SDK session:', err);
                    setError('Failed to initialize. Please sign the message in your wallet or reconnect.');
                    setSdkReady(false);
                    // Still mark as initialized so user can see the error and reconnect
                    setIsInitialized(true);
                });
        } else if (savedAddress) {
            // Just address, no wallet ID - show as connected but SDK won't work
            setWalletAddress(savedAddress);
            setIsInitialized(true);
        }
    }, [mounted, initializeSdkWithWallet]);

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

                            // Initialize SDK with wallet (derives encryption key via message signing)
                            try {
                                await initializeSdkWithWallet(address);
                            } catch (sdkErr: any) {
                                console.error('SDK initialization failed:', sdkErr);
                                setError('SDK initialization failed: ' + (sdkErr.message || 'Unknown error'));
                                // Still allow connection, but SDK operations won't work
                            }

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
    }, [initializeSdkWithWallet]);

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
        walletEncryptionKeyRef.current = null;
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
        // If connected via wallet extension (has encryption key), use wallet flow
        if (walletEncryptionKeyRef.current && selectedWalletId) {
            return storeCardWithWallet(cardData);
        }
        // Otherwise, use SDK directly (secret key connection)
        if (!sdkInstance || !sdkReady) {
            throw new Error('SDK not initialized. Please connect your wallet first.');
        }
        return sdkInstance.storeCard(cardData);
    }, [sdkReady, selectedWalletId, storeCardWithWallet]);

    const retrieveCard = useCallback(async (): Promise<TokenMetadata | null> => {
        // Wallet extension connections: SDK's retrieveCard tries to sign internally which fails
        // For now, return null - card data would need to be retrieved and decrypted differently
        if (walletEncryptionKeyRef.current && selectedWalletId) {
            console.log('retrieveCard: Wallet extension mode - card retrieval not yet supported');
            return null;
        }
        if (!sdkInstance || !sdkReady) {
            throw new Error('SDK not initialized. Please connect your wallet first.');
        }
        return sdkInstance.retrieveCard();
    }, [sdkReady, selectedWalletId]);

    const revokeCard = useCallback(async () => {
        // Wallet extension connections: SDK's revokeCard tries to sign internally which fails
        if (walletEncryptionKeyRef.current && selectedWalletId) {
            throw new Error('Revoke card is not yet supported for wallet extension connections. Please use secret key login.');
        }
        if (!sdkInstance || !sdkReady) {
            throw new Error('SDK not initialized. Please connect your wallet first.');
        }
        return sdkInstance.revokeCard();
    }, [sdkReady, selectedWalletId]);

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
