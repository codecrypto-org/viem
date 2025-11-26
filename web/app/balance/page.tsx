"use client";

import { useState } from 'react';
import { createPublicClient, http, formatEther } from 'viem';
import { foundry } from 'viem/chains';
import { Chain } from 'viem';

// Initialize the public client outside the component to avoid recreating it on every render
// In a real app, this might be in a separate config file
const anvilChain: Chain = {
    id: 3133731337,
    name: "Anvil",
    nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["http://127.0.0.1:55556"],
        },
        public: {
            http: ["http://127.0.0.1:55556"],
        },
    },
    blockExplorers: {
        default: {
            name: "Anvil",
            url: "http://127.0.0.1:55556",
        },
    },
};
const publicClient = createPublicClient({
    chain: anvilChain,
    transport: http('http://127.0.0.1:55556'),
});

export default function BalancePage() {
    const [address, setAddress] = useState('');
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setBalance(null);

        try {
            if (!address.startsWith('0x') || address.length !== 42) {
                throw new Error('Invalid Ethereum address format');
            }

            const balanceWei = await publicClient.getBalance({
                address: address as `0x${string}`,
            });

            setBalance(formatEther(balanceWei));
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch balance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Check Anvil Balance</h1>

                <form onSubmit={handleCheckBalance} className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            Ethereum Address
                        </label>
                        <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Checking...' : 'Check Balance'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {balance !== null && (
                    <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-100">
                        <h2 className="text-lg font-semibold text-green-800 mb-1">Balance</h2>
                        <p className="text-3xl font-bold text-green-600">{balance} ETH</p>
                    </div>
                )}

                <div className="mt-8 text-xs text-gray-500 text-center">
                    Connected to Anvil (localhost:8545)
                </div>
            </div>
        </div>
    );
}
