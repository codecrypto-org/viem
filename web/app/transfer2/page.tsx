"use client";

import { useState } from 'react';
import { createWalletClient, createPublicClient, http, parseEther, formatEther, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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

const ACCOUNTS = [
    { index: 0, privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' },
    { index: 1, privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' },
    { index: 2, privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' },
    { index: 3, privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' },
    { index: 4, privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' },
    { index: 5, privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba' },
    { index: 6, privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e' },
    { index: 7, privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356' },
    { index: 8, privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97' },
    { index: 9, privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6' },
].map(acc => ({
    ...acc,
    address: privateKeyToAccount(acc.privateKey as `0x${string}`).address
}));

export default function Transfer2Page() {
    const [fromIndex, setFromIndex] = useState(0);
    const [toIndex, setToIndex] = useState<number | 'custom'>('custom');
    const [customToAddress, setCustomToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const getMetaMaskProvider = () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = (window as any).ethereum;
            if (provider.providers) {
                return provider.providers.find((p: any) => p.isMetaMask);
            }
            if (provider.isMetaMask) {
                return provider;
            }
        }
        return null;
    };

    const addChainToMetaMask = async () => {
        const provider = getMetaMaskProvider();
        if (provider) {
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: `0x${anvilChain.id.toString(16)}`,
                            chainName: anvilChain.name,
                            nativeCurrency: anvilChain.nativeCurrency,
                            rpcUrls: anvilChain.rpcUrls.default.http,
                        },
                    ],
                });
            } catch (error) {
                console.error(error);
                setError('Failed to add chain to MetaMask');
            }
        } else {
            setError('MetaMask is not detected. If you have multiple wallets, try disabling Phantom.');
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setTxHash(null);

        try {
            const fromAccount = ACCOUNTS[fromIndex];
            const toAddress = toIndex === 'custom' ? customToAddress : ACCOUNTS[toIndex].address;

            if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
                throw new Error('Invalid recipient address');
            }

            const account = privateKeyToAccount(fromAccount.privateKey as `0x${string}`);

            const walletClient = createWalletClient({
                account,
                chain: anvilChain,
                transport: http('http://127.0.0.1:55556'),
            });

            const publicClient = createPublicClient({
                chain: anvilChain,
                transport: http('http://127.0.0.1:55556'),
            });

            const hash = await walletClient.sendTransaction({
                to: toAddress as `0x${string}`,
                value: parseEther(amount),
            });

            setTxHash(hash);
            await publicClient.waitForTransactionReceipt({ hash });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Transfer Between Accounts</h1>

                <button
                    onClick={addChainToMetaMask}
                    className="mb-6 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Add Anvil Chain to MetaMask
                </button>

                <form onSubmit={handleTransfer} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">From Account</label>
                        <select
                            value={fromIndex}
                            onChange={(e) => setFromIndex(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ACCOUNTS.map((acc) => (
                                <option key={acc.index} value={acc.index}>
                                    Account {acc.index} ({acc.address.slice(0, 6)}...{acc.address.slice(-4)})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 font-mono">{ACCOUNTS[fromIndex].address}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">To Account</label>
                        <select
                            value={toIndex}
                            onChange={(e) => {
                                const val = e.target.value;
                                setToIndex(val === 'custom' ? 'custom' : Number(val));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="custom">Custom Address</option>
                            {ACCOUNTS.map((acc) => (
                                <option key={acc.index} value={acc.index}>
                                    Account {acc.index} ({acc.address.slice(0, 6)}...{acc.address.slice(-4)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {toIndex === 'custom' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">Recipient Address</label>
                            <input
                                type="text"
                                value={customToAddress}
                                onChange={(e) => setCustomToAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    )}

                    {typeof toIndex === 'number' && (
                        <p className="text-xs text-gray-500 font-mono -mt-4">{ACCOUNTS[toIndex].address}</p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Amount (ETH)</label>
                        <input
                            type="number"
                            step="0.000000000000000001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Sending...' : 'Send ETH'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm break-words">
                        {error}
                    </div>
                )}

                {txHash && (
                    <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-100">
                        <h2 className="text-lg font-semibold text-green-800 mb-1">Transaction Sent!</h2>
                        <p className="text-xs text-green-600 break-all font-mono">{txHash}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
