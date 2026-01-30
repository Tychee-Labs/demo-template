'use client';

import { TycheeProvider } from "@/lib/tychee-provider";
import { Navigation } from "@/components/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TycheeProvider>
            <Navigation />
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </TycheeProvider>
    );
}
