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
    const [accounts, setAccounts] = useState<string[]>([]);
    const [activeAccount, setActiveAccount] = useState<string | null>(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [walletClient, setWalletClient] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const provider = getMetaMaskProvider();

            if (provider) {
                const client = createWalletClient({
                    chain: anvilChain,
                    transport: custom(provider),
                });
                setWalletClient(client);

                // Check if already connected
                provider.request({ method: 'eth_accounts' })
                    .then((accs: string[]) => {
                        if (accs.length > 0) {
                            setAccounts(accs);
                            setActiveAccount(accs[0]);
                        }
                    })
                    .catch(() => {
                        // Ignore error if not connected
                    });

                // Listen for account changes
                const handleAccountsChanged = (accs: string[]) => {
                    setAccounts(accs);
                    if (accs.length > 0) {
                        // If the currently active account is still in the list, keep it.
                        // Otherwise, switch to the first one.
                        setActiveAccount(prev => (prev && accs.includes(prev) ? prev : accs[0]));
                    } else {
                        setActiveAccount(null);
                    }
                };

                provider.on('accountsChanged', handleAccountsChanged);

                return () => {
                    if (provider.removeListener) {
                        provider.removeListener('accountsChanged', handleAccountsChanged);
                    }
                };
            }
        }
    }, []);

    const connectWallet = async () => {
        setError(null);
        const provider = getMetaMaskProvider();

        if (!provider) {
            setError('MetaMask is not installed');
            return;
        }

        try {
            const accs = await provider.request({ method: 'eth_requestAccounts' });
            if (accs.length > 0) {
                setAccounts(accs);
                setActiveAccount(accs[0]);
            }
        } catch (err: any) {
            console.error(err);
            setError('Failed to connect wallet');
        }
    };

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

    const switchChain = async () => {
        const provider = getMetaMaskProvider();
        if (provider) {
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${anvilChain.id.toString(16)}` }],
                });
                return true;
            } catch (error: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (error.code === 4902) {
                    await addChainToMetaMask();
                    return true;
                }
                console.error(error);
                setError('Failed to switch network');
                return false;
            }
        }
        return false;
    };


    const changeAccount = async () => {
        const provider = getMetaMaskProvider();
        if (provider) {
            try {
                await provider.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }],
                });

                // Fetch all connected accounts after permission change
                const accs = await provider.request({ method: 'eth_accounts' });
                setAccounts(accs);

                // If we have accounts, try to find the one the user just selected if possible,
                // or just default to the first one if not.
                // Note: wallet_requestPermissions response might give a hint, but eth_accounts gives the full list.
                // For simplicity in this "show all" mode, we just update the list.
                // If the user wants to select a specific one, they can now click it in the list.
                if (accs.length > 0) {
                    // We don't necessarily force the active account here, 
                    // we let the user choose from the list, or default to the first one if none active.
                    if (!activeAccount || !accs.includes(activeAccount)) {
                        setActiveAccount(accs[0]);
                    }
                }

            } catch (error) {
                console.error(error);
                setError('Failed to change account');
            }
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAccount) return;

        setLoading(true);
        setError(null);
        setTxHash(null);

        try {
            if (!recipient.startsWith('0x') || recipient.length !== 42) {
                throw new Error('Invalid recipient address');
            }

            const provider = getMetaMaskProvider();
            if (!provider) {
                throw new Error('MetaMask not found');
            }

            // Ensure we are on the correct chain
            const switched = await switchChain();
            if (!switched) {
                setLoading(false);
                return;
            }

            // Send transaction using provider directly
            const hash = await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: activeAccount,
                    to: recipient,
                    value: `0x${parseEther(amount).toString(16)}`,
                }],
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

                {accounts.length === 0 ? (
                    <div className="text-center">
                        <p className="mb-4 text-gray-900">Connect your MetaMask wallet to send ETH.</p>
                        <button
                            onClick={connectWallet}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Connected Accounts:</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {accounts.map((acc) => (
                                    <div
                                        key={acc}
                                        onClick={() => setActiveAccount(acc)}
                                        className={`p-3 rounded-md text-sm break-all cursor-pointer border ${activeAccount === acc
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`${activeAccount === acc ? 'text-blue-900 font-semibold' : 'text-gray-800'}`}>
                                                {acc}
                                            </span>
                                            {activeAccount === acc && (
                                                <span className="text-blue-600 text-xs font-bold uppercase ml-2">Active</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-4 mb-6">
                            <button
                                onClick={addChainToMetaMask}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Add Anvil Chain
                            </button>
                            <button
                                onClick={changeAccount}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Change Account
                            </button>
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
