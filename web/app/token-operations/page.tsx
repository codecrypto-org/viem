"use client";

import { useState, useEffect } from 'react';
import { createWalletClient, createPublicClient, custom, http, parseEther, formatEther, Chain } from 'viem';

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

const TOKEN_ABI = [
    {
        inputs: [],
        name: 'name',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'mint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'burn',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

export default function TokenOperationsPage() {
    const [account, setAccount] = useState<string | null>(null);
    const [walletClient, setWalletClient] = useState<any>(null);
    const [publicClient, setPublicClient] = useState<any>(null);

    const [tokenAddress, setTokenAddress] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [tokenBalance, setTokenBalance] = useState('0');

    const [activeTab, setActiveTab] = useState('mint');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form states
    const [mintTo, setMintTo] = useState('');
    const [mintAmount, setMintAmount] = useState('');
    const [burnAmount, setBurnAmount] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [approveSpender, setApproveSpender] = useState('');
    const [approveAmount, setApproveAmount] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const wClient = createWalletClient({
                chain: anvilChain,
                transport: custom((window as any).ethereum),
            });
            setWalletClient(wClient);

            const pClient = createPublicClient({
                chain: anvilChain,
                transport: http('http://127.0.0.1:55556'),
            });
            setPublicClient(pClient);

            wClient.requestAddresses().then((accounts) => {
                if (accounts.length > 0) setAccount(accounts[0]);
            }).catch(() => { });

            (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) setAccount(accounts[0]);
                else setAccount(null);
            });
        }
    }, []);

    const fetchTokenInfo = async () => {
        if (!publicClient || !tokenAddress || !account) return;
        try {
            const [symbol, balance] = await Promise.all([
                publicClient.readContract({
                    address: tokenAddress as `0x${string}`,
                    abi: TOKEN_ABI,
                    functionName: 'symbol',
                }),
                publicClient.readContract({
                    address: tokenAddress as `0x${string}`,
                    abi: TOKEN_ABI,
                    functionName: 'balanceOf',
                    args: [account as `0x${string}`],
                }),
            ]);
            setTokenSymbol(symbol as string);
            setTokenBalance(formatEther(balance as bigint));
        } catch (err) {
            console.error(err);
            // Don't set error here to avoid annoying popups while typing
        }
    };

    useEffect(() => {
        if (tokenAddress.length === 42) {
            fetchTokenInfo();
        }
    }, [tokenAddress, account, publicClient]);

    const handleTransaction = async (action: () => Promise<`0x${string}`>) => {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const hash = await action();
            setSuccessMsg(`Transaction sent! Hash: ${hash}`);
            // Wait for confirmation then refresh balance
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
                await fetchTokenInfo();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const onMint = (e: React.FormEvent) => {
        e.preventDefault();
        handleTransaction(() => walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: TOKEN_ABI,
            functionName: 'mint',
            args: [mintTo as `0x${string}`, parseEther(mintAmount)],
            account,
        }));
    };

    const onBurn = (e: React.FormEvent) => {
        e.preventDefault();
        handleTransaction(() => walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: TOKEN_ABI,
            functionName: 'burn',
            args: [parseEther(burnAmount)],
            account,
        }));
    };

    const onTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        handleTransaction(() => walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: TOKEN_ABI,
            functionName: 'transfer',
            args: [transferTo as `0x${string}`, parseEther(transferAmount)],
            account,
        }));
    };

    const onApprove = (e: React.FormEvent) => {
        e.preventDefault();
        handleTransaction(() => walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: TOKEN_ABI,
            functionName: 'approve',
            args: [approveSpender as `0x${string}`, parseEther(approveAmount)],
            account,
        }));
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Token Operations</h1>

                {!account ? (
                    <div className="text-center">
                        <p className="mb-4 text-gray-800">Connect your MetaMask wallet to interact with tokens.</p>
                        <button
                            onClick={() => walletClient?.requestAddresses()}
                            className="py-2 px-4 rounded-md text-white bg-orange-600 hover:bg-orange-700"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 grid gap-4">
                            <div className="p-3 bg-gray-50 rounded-md text-sm">
                                <span className="font-semibold text-gray-900">Connected:</span> {account}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Token Contract Address</label>
                                <input
                                    type="text"
                                    value={tokenAddress}
                                    onChange={(e) => setTokenAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            {tokenSymbol && (
                                <div className="p-3 bg-blue-50 rounded-md text-sm flex justify-between">
                                    <span><span className="font-semibold text-gray-900">Symbol:</span> {tokenSymbol}</span>
                                    <span><span className="font-semibold text-gray-900">Your Balance:</span> {tokenBalance}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                {['mint', 'burn', 'transfer', 'approve'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`${activeTab === tab
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {activeTab === 'mint' && (
                            <form onSubmit={onMint} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Mint To</label>
                                    <input
                                        type="text"
                                        value={mintTo}
                                        onChange={(e) => setMintTo(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={mintAmount}
                                        onChange={(e) => setMintAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? 'Minting...' : 'Mint Tokens'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'burn' && (
                            <form onSubmit={onBurn} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Amount to Burn</label>
                                    <input
                                        type="number"
                                        value={burnAmount}
                                        onChange={(e) => setBurnAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                                    {loading ? 'Burning...' : 'Burn Tokens'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'transfer' && (
                            <form onSubmit={onTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Recipient</label>
                                    <input
                                        type="text"
                                        value={transferTo}
                                        onChange={(e) => setTransferTo(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? 'Sending...' : 'Transfer Tokens'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'approve' && (
                            <form onSubmit={onApprove} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Spender Address</label>
                                    <input
                                        type="text"
                                        value={approveSpender}
                                        onChange={(e) => setApproveSpender(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={approveAmount}
                                        onChange={(e) => setApproveAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50">
                                    {loading ? 'Approving...' : 'Approve Spender'}
                                </button>
                            </form>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm break-words">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-100">
                                <h2 className="text-lg font-semibold text-green-800 mb-1">Success!</h2>
                                <p className="text-xs text-green-600 break-all font-mono">{successMsg}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
