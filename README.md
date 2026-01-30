# Tychee SDK Template

A showcase template for **[@tychee/sdk](https://www.npmjs.com/package/@tychee/sdk)** — Regulatory-compliant card tokenization with Web3 self-custody on Stellar blockchain.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Stellar](https://img.shields.io/badge/Stellar-Soroban-7C3AED)

## Features

- 🔐 **Card Tokenization** — Encrypt and store cards on Stellar using AES-256-GCM
- 💼 **Wallet Integration** — Connect with Stellar wallets (Freighter) or demo keypairs
- 🎁 **Rewards System** — Track points, tiers, and earn rewards
- 🎟️ **Vouchers** — Browse and redeem vouchers with points
- 📊 **Spending Analytics** — View transaction history and category breakdown

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url> tychee-template
cd tychee-template
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_TOKEN_VAULT_ADDRESS=<your-contract-address>
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## SDK Usage

This template demonstrates how to use `@tychee/sdk`:

### Initialize SDK

```typescript
import { TycheeSDK } from '@tychee/sdk';

const sdk = new TycheeSDK({
  stellarNetwork: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  tokenVaultAddress: process.env.NEXT_PUBLIC_TOKEN_VAULT_ADDRESS!,
  useAccountAbstraction: false,
});

await sdk.initialize(secretKey);
```

### Tokenize a Card

```typescript
import { CardData } from '@tychee/sdk';

const cardData: CardData = {
  pan: '4242424242424242',
  cvv: '123',
  expiryMonth: '12',
  expiryYear: '26',
  cardholderName: 'JOHN DOE',
  network: 'visa',
};

const token = await sdk.storeCard(cardData);
console.log('Token Hash:', token.tokenHash);
```

### Retrieve & Decrypt

```typescript
const token = await sdk.retrieveCard();
if (token) {
  const cardData = await sdk.decryptCard(Buffer.from(token.encryptedPayload));
}
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page
│   ├── cards/page.tsx    # Card tokenization
│   ├── rewards/page.tsx  # Points & tiers
│   ├── vouchers/page.tsx # Voucher store
│   └── spends/page.tsx   # Transaction history
├── components/
│   └── navigation.tsx    # Header & wallet connect
└── lib/
    └── tychee-provider.tsx  # SDK context wrapper
```

## Test Cards

| Network    | Card Number         | CVV | Expiry |
|------------|---------------------|-----|--------|
| Visa       | 4242 4242 4242 4242 | Any | Future |
| Mastercard | 5555 5555 5555 4444 | Any | Future |
| Amex       | 3782 8224 6310 005  | Any | Future |

## Learn More

- [Tychee SDK Documentation](https://www.npmjs.com/package/@tychee/sdk)
- [Stellar Developer Docs](https://developers.stellar.org/)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT © Tychee Labs
