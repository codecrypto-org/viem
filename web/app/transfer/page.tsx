"use client";

import { useState, useEffect } from 'react';
import { createWalletClient, custom, parseEther, formatEther, Chain } from 'viem';

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

export default function TransferPage() {
    const [account, setAccount] = useState<string | null>(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [walletClient, setWalletClient] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const client = createWalletClient({
                chain: anvilChain,
                transport: custom((window as any).ethereum),
            });
            setWalletClient(client);

            // Check if already connected
            client.requestAddresses().then((accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                }
            }).catch(() => {
                // Ignore error if not connected
            });

            // Listen for account changes
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount(null);
                }
            };

            (window as any).ethereum.on('accountsChanged', handleAccountsChanged);

            return () => {
                if ((window as any).ethereum.removeListener) {
                    (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
                }
            };
        }
    }, []);

    const connectWallet = async () => {
        setError(null);
        if (!walletClient) {
            setError('MetaMask is not installed');
            return;
        }

        try {
            const [address] = await walletClient.requestAddresses();
            setAccount(address);
        } catch (err: any) {
            console.error(err);
            setError('Failed to connect wallet');
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account || !walletClient) return;

        setLoading(true);
        setError(null);
        setTxHash(null);

        try {
            if (!recipient.startsWith('0x') || recipient.length !== 42) {
                throw new Error('Invalid recipient address');
            }

            const hash = await walletClient.sendTransaction({
                account,
                chainId: "3133731337",
                to: recipient as `0x${string}`,
                value: parseEther(amount),
            });

            setTxHash(hash);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Transfer ETH</h1>

                {!account ? (
                    <div className="text-center">
                        <p className="mb-4 text-gray-800">Connect your MetaMask wallet to send ETH.</p>
                        <button
                            onClick={connectWallet}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 p-3 rounded-md text-sm break-all ">
                            <span className="font-semibold text-black">Connected:</span> {account}
                        </div>

                        <form onSubmit={handleTransfer} className="space-y-4">

                            <div>
                                <label htmlFor="recipient" className="block text-sm font-medium text-gray-900 mb-1">
                                    Recipient Address
                                </label>
                                <input
                                    id="recipient"
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-900 mb-1">
                                    Amount (ETH)
                                </label>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.000000000000000001"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.0"
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
                                {loading ? 'Sending...' : 'Send ETH'}
                            </button>
                        </form>
                    </>
                )}

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
