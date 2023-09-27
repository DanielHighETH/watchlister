'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRef } from 'react';
import { ethers } from 'ethers';

import { FRIENDTECH_ADDRESS, FRIENDTECH_ABI } from '../constants';


type User = {
    pfpUrl: string;
    username: string;
    name: string;
    subject: string;
    price: string;
    lastMessageTime: string;
    change24H: string;
};


export default function Home() {

    const [watchlistedUsers, setWatchlistedUsers] = useState<any[]>([]);
    const [watchlistedUsersNumber, setWatchlistedUsersNumber] = useState<number>(0);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [hasKey, setHasKey] = useState<null | boolean>(null);
    const [token, setToken] = useState('');
    const [hasToken, setHasToken] = useState<boolean>(false);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [usernameFilter, setUsernameFilter] = useState<string>('');
    const [minPrice, setMinPrice] = useState<number | null>(null);
    const [maxPrice, setMaxPrice] = useState<number | null>(null);
    const [sortByChange, setSortByChange] = useState<'none' | 'highest' | 'lowest'>('none');

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState<boolean>(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);


    const [userAddress, setUserAddress] = useState<string | null>(null);

    const [isBuyKeyModalOpen, setIsBuyKeyModalOpen] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [numberOfKeys, setNumberOfKeys] = useState<number>(1);
    const [priceAfterFees, setPriceAfterFees] = useState<number>(0);
    const [boughtUser, setBoughtUser] = useState<string | null>("ProphetBots");

    const [userBalance, setUserBalance] = useState<string | null>(null);


    // After the initial render


    useEffect(() => {
        const storedWallet = localStorage.getItem('connectedWallet');
        if (storedWallet) {
            setUserAddress(storedWallet);
            verifyWallet(storedWallet);
        }

        const storedToken = localStorage.getItem('verifiedToken');
        if (storedToken) {
            setToken(storedToken);
            setHasToken(true);
        }

        if (hasToken) {
            fetchUsers();
        }
    }, [hasToken]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsModalOpen(false);
                setIsBuyKeyModalOpen(false);
                setIsErrorModalOpen(false);
                setIsSuccessModalOpen(false);
                setIsPendingModalOpen(false);
            }
        };
    
        // Add the event listener
        window.addEventListener('keydown', handleKeyDown);
    
        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    

    const verifyWallet = async (walletAddress: string) => {
        try {
            const response = await fetch(`https://friendtech-extension-backend.vercel.app/api/hasMyKey?wallet=${walletAddress}`);

            if (!response.ok) {
                localStorage.removeItem('verifiedWallet');
                localStorage.removeItem('connectedWallet');
                setAlertMessage('Something went wrong, please try again later.');
                throw new Error('Server responded with an error');
            }

            const data = await response.json();
            if (data.hasKey) {
                setHasKey(true);
                localStorage.setItem('verifiedWallet', walletAddress);
                localStorage.setItem('connectedWallet', walletAddress);
            } else {
                setHasKey(false);
                setAlertMessage('You have to buy my key to use this app.');
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    const fetchAllUsers = async () => {
        let allData: User[] = [];
        let hasMoreData = true;
        let pageStart = 100; // Start from the second page

        while (hasMoreData) {
            const response = await fetch(`/api/pullWatchlist?token=${token}&pageStart=${pageStart}`);

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    setWatchlistedUsersNumber(prev => prev + data.length);
                    allData = [...allData, ...data];
                    pageStart += 100;
                } else {
                    hasMoreData = false;
                }
            } else {
                console.error('Failed to fetch additional users');
                hasMoreData = false;
            }

        }

        // Remove duplicates
        const uniqueSubjects = new Set();
        const uniqueUsers = [...allData].filter(user => {
            if (!uniqueSubjects.has(user.subject)) {
                uniqueSubjects.add(user.subject);
                return true;
            }
            return false;
        });

        setWatchlistedUsers(prev => {
            const combinedUsers = [...prev, ...uniqueUsers];
            return combinedUsers.filter((user, index, self) =>
                index === self.findIndex(u => u.subject === user.subject)
            );
        });
    };

    const fetchUsers = async () => {
        connectWallet();
        try {
            const response = await fetch(`/api/pullWatchlist?token=${token}`);

            if (response.ok) {
                const data = await response.json();
                setWatchlistedUsers(data);
                setWatchlistedUsersNumber(data.length);
                fetchAllUsers();
            } else {
                console.error('Failed to fetch initial users');
                setAlertMessage('Failed to pull users. Please check if your Token is correct.');
            }
        } catch (error) {
            console.error("Error fetching initial users:", error);
        }
    };


    const handleRemoveFromWatchlist = async (subjectWallet: string) => {
        try {
            const response = await fetch(`/api/deleteFromWatchlist?token=${token}&wallet=${subjectWallet}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setWatchlistedUsers(prev => prev.filter(u => u.address !== subjectWallet));
            } else {
                console.error('Failed to remove user from watchlist');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const convertToHumanReadableDigits = (amount: string) => {
        return Number(amount) / 10 ** 18;
    };
    function timeAgoFromTimestamp(timestampStr: string): string {
        let timestamp = parseInt(timestampStr, 10);

        if (timestampStr.length === 10) {
            timestamp *= 1000;
        }

        const messageDate = new Date(timestamp);
        const currentDate = new Date();

        const diffInMilliseconds = currentDate.getTime() - messageDate.getTime();
        const diffInMinutes = diffInMilliseconds / (1000 * 60);

        if (diffInMinutes < 1) {
            return "Just now";
        } else if (diffInMinutes < 60) {
            return `${Math.floor(diffInMinutes)} minute${Math.floor(diffInMinutes) > 1 ? 's' : ''} ago`;
        } else {
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            } else {
                const diffInDays = Math.floor(diffInHours / 24);
                return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
            }
        }
    }


    const filteredUsers = watchlistedUsers
        .filter(user => {
            const filterString = nameFilter.toLowerCase();
            return (
                user.name.toLowerCase().includes(filterString) ||
                user.username.toLowerCase().includes(filterString)
            ) &&
                (!minPrice || convertToHumanReadableDigits(user.price) >= minPrice) &&
                (!maxPrice || convertToHumanReadableDigits(user.price) <= maxPrice);
        })
        .sort((a, b) => {
            if (sortByChange === 'highest') {
                return Number(b.change24H) - Number(a.change24H);
            } else if (sortByChange === 'lowest') {
                return Number(a.change24H) - Number(b.change24H);
            }
            return 0;
        });


    const nameInputRef = useRef(null);
    const minPriceInputRef = useRef(null);
    const maxPriceInputRef = useRef(null);
    const sortByChangeRef = useRef(null);

    const resetFilters = () => {
        setNameFilter('');
        setUsernameFilter('');
        setMinPrice(null);
        setMaxPrice(null);
        setSortByChange('none');

        if (nameInputRef.current) (nameInputRef.current as HTMLInputElement).value = '';
        if (minPriceInputRef.current) (minPriceInputRef.current as HTMLInputElement).value = '';
        if (maxPriceInputRef.current) (maxPriceInputRef.current as HTMLInputElement).value = '';
        if (sortByChangeRef.current) (sortByChangeRef.current as HTMLSelectElement).value = 'none';
    };


    const connectWallet = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = new ethers.providers.Web3Provider((window as any).ethereum);
            try {
                const network = await provider.getNetwork();

                if (network.chainId !== 0x2105) {
                    try {
                        const baseNetworkParams = {
                            chainId: '0x2105',
                            chainName: 'Base Mainnet',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://mainnet.base.org'],
                            blockExplorerUrls: ['https://basescan.org']
                        };

                        await (window as any).ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [baseNetworkParams]
                        });

                    } catch (switchError) {
                        console.error('Failed to switch to BASE network:', switchError);
                        setAlertMessage('Please manually switch to the BASE network in your wallet.');
                        return;
                    }
                }

                const accounts: string[] = await provider.send('eth_requestAccounts', []);
                const userAddress: string = accounts[0];
                localStorage.setItem('connectedWallet', userAddress);
                setUserAddress(userAddress);
                verifyWallet(userAddress);
                const balanceWei = await provider.getBalance(userAddress);
                const balanceEth = ethers.utils.formatEther(balanceWei);
                setUserBalance(balanceEth)
            } catch (error: any) {
                console.error('Failed to connect wallet:', error);
            }
        } else {
            setAlertMessage('Please install MetaMask or another Ethereum wallet provider.');
        }
    };



    function formatWalletAddress(address: string): string {
        if (address.length < 10) {
            return address;
        }
        const firstFive = address.slice(0, 5);
        const lastFour = address.slice(-4);
        return `${firstFive}...${lastFour}`;
    }

    const openBuyKeyModal = (user: User) => {
        setSelectedUser(user);
        setNumberOfKeys(1);
        setIsBuyKeyModalOpen(true);
        fetchPriceAfterFees(user.subject, numberOfKeys);
    };

    const closeBuyKeyModal = () => {
        setIsBuyKeyModalOpen(false);
        setSelectedUser(null);
        setNumberOfKeys(1);
    };

    const incrementKeys = () => {
        const newNumberOfKeys = numberOfKeys + 1;
        setNumberOfKeys(newNumberOfKeys);
        if (selectedUser) {
            fetchPriceAfterFees(selectedUser.subject, newNumberOfKeys);
        }
    };

    const decrementKeys = () => {
        if (numberOfKeys > 1) {
            const newNumberOfKeys = numberOfKeys - 1;
            setNumberOfKeys(newNumberOfKeys);
            if (selectedUser) {
                fetchPriceAfterFees(selectedUser.subject, newNumberOfKeys);
            }
        }
    };

    const fetchPriceAfterFees = async (address: string, amount: number) => {
        if (!address || amount <= 0 || amount == null || isNaN(amount)) {
            setPriceAfterFees(0);
            return;
        }
        try {
            const response = await fetch(`/api/getPriceAfterFees?address=${address}&amount=${amount}`);
            if (response.ok) {
                const data = await response.json();
                setPriceAfterFees(data);
            } else {
                console.error('Failed to fetch price after fees');
            }
        } catch (error) {
            console.error('Error fetching price after fees:', error);
        }
    };

    const buyKeys = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum && selectedUser) {
            const ethereum = (window as any).ethereum;
            const accounts = await ethereum.request({
                method: "eth_requestAccounts",
            });

            const provider = new ethers.providers.Web3Provider(ethereum)
            const walletAddress = accounts[0]
            const signer = provider.getSigner(walletAddress)


            const contract = new ethers.Contract(FRIENDTECH_ADDRESS, FRIENDTECH_ABI, signer);


            try {
                const estimatedGas = await contract.estimateGas.buyShares(selectedUser.subject as String, numberOfKeys, { value: ethers.utils.parseEther(priceAfterFees.toString()) });

                const overrides = {
                    value: ethers.utils.parseEther(priceAfterFees.toString()),
                    gasLimit: estimatedGas.mul(ethers.BigNumber.from("1100")).div(ethers.BigNumber.from("1000"))
                };

                const txResponse = await contract.buyShares(selectedUser.subject as String, numberOfKeys, overrides);
                setBoughtUser(selectedUser.name);
                setIsPendingModalOpen(true);
                const receipt = await txResponse.wait();
                setIsPendingModalOpen(false); 

                if (receipt.status === 1) {
                    setIsSuccessModalOpen(true); 
                } else {
                    setIsErrorModalOpen(true); 
                }

            } catch (error) {
                console.error("Error buying keys:", error);
                if(JSON.parse(JSON.stringify(error)).code === "ACTION_REJECTED"){
                    setAlertMessage("You rejected the transaction")
                } else {
                    setIsPendingModalOpen(false); 
                }
            }
        } else {
            console.error("MetaMask is not connected");
        }
    };



    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
            <div className="bg-white p-8 rounded-lg w-2/3 max-w-6xl">
                <div className="mb-6">
                    {/* Buttons */}
                    <div className="flex space-x-4 justify-center mb-6">
                        <Link href="/" className="bg-purple-600 text-white px-4 py-2 rounded-md">Back to Home</Link>
                        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md">Edit Token</button>
                        {userAddress ? (
                            <span className="bg-orange-600 text-white px-4 py-2 rounded-md">{formatWalletAddress(userAddress)} ({Number(userBalance).toFixed(2)} ETH)</span>
                        ) : (
                            <button onClick={connectWallet} className="bg-orange-600 text-white px-4 py-2 rounded-md">Connect wallet</button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col items-center space-y-4 text-gray-500">
                        {/* First row of filters: username & change */}
                        <div className="flex space-x-4 justify-center w-full max-w-xl">
                            <input
                                type="text"
                                defaultValue={nameFilter}
                                placeholder="Name or Username"
                                onChange={e => setNameFilter(e.target.value)}
                                className="p-2 rounded-md border flex-grow w-1/2"
                                ref={nameInputRef}
                            />
                            <select
                                defaultValue={sortByChange}
                                onChange={e => setSortByChange(e.target.value as any)}
                                className="p-2 rounded-md border flex-grow w-1/2"
                                ref={sortByChangeRef}
                            >
                                <option value="none">Sort by Change</option>
                                <option value="highest">Highest Change</option>
                                <option value="lowest">Lowest Change</option>
                            </select>
                        </div>

                        {/* Second row of filters: price min and max */}
                        <div className="flex space-x-4 justify-center w-full max-w-xl">
                            <input
                                type="number"
                                placeholder="Min Price"
                                step={0.1}
                                min={0}
                                defaultValue={minPrice || ''}
                                onChange={e => setMinPrice(Number(e.target.value))}
                                className="p-2 rounded-md border flex-grow"
                                ref={minPriceInputRef}
                            />
                            <input
                                type="number"
                                placeholder="Max Price"
                                step={0.1}
                                min={0}
                                defaultValue={maxPrice || ''}
                                onChange={e => setMaxPrice(Number(e.target.value))}
                                className="p-2 rounded-md border flex-grow"
                                ref={maxPriceInputRef}

                            />
                        </div>

                        {/* Reset Button */}
                        <button onClick={() => resetFilters()} className="bg-blue-500 text-white px-4 py-2 rounded-md">Reset Filters</button>
                    </div>
                </div>


                <h1 className="text-2xl font-bold mb-4 text-center text-gray-700 mt-5">
                    My Watchlist ({watchlistedUsersNumber} users)
                </h1>

                <ul>
                    {/* Map through your watchlisted users here */}
                    {filteredUsers.map(user => (
                        <li key={user.subject} className="flex items-center justify-between space-x-4 mb-10">
                            <div className="flex items-center space-x-4">
                                <img src={user.pfpUrl} alt={user.name} width={48} height={48} className="rounded-full" />
                                <div>
                                    <p className="font-bold text-gray-800">{user.name}</p>
                                    <p className="text-sm text-gray-500">
                                        <a href={`https://friend.tech/${user.username}`} target="_blank" rel="noopener noreferrer">
                                            @{user.username}
                                        </a>
                                    </p>
                                    <p className="text-sm text-gray-600">Price: {convertToHumanReadableDigits(user.price)} ETH</p>
                                    <p className="text-sm text-gray-600">Last posted {timeAgoFromTimestamp(user.lastMessageTime)}</p>
                                    <p className={`text-sm ${Number(user.change24H) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        Change (24H): {Number(user.change24H).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                            <div className='flex space-x-4'>
                                <button onClick={() => openBuyKeyModal(user)} className="bg-cyan-400 text-white px-4 py-2 rounded ml">BUY KEYS</button>
                                <button onClick={() => handleRemoveFromWatchlist(user.subject)} className="bg-red-600 text-white px-4 py-2 rounded">REMOVE</button>
                            </div>
                        </li>
                    ))}
                </ul>

            </div>



            {alertMessage && (
                <div className="fixed top-0 left-0 w-full flex items-center justify-center z-10 pt-10">
                    <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg text-center">
                        <p>{alertMessage}</p>
                        <button onClick={() => setAlertMessage(null)} className="mt-2 bg-white text-red-500 px-4 py-2 rounded">Close</button>
                    </div>
                </div>
            )} {isModalOpen && (
                <>
                    <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"></div>
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Edit Your Token</h2>
                            <input
                                type="text"
                                placeholder="Enter your new token..."
                                defaultValue={token}
                                onChange={e => setToken(e.target.value)}
                                className="p-2 border rounded-md focus:outline-none focus:border-indigo-500 text-gray-500 w-full mb-4"
                                autoComplete="off"
                            />
                            <button
                                onClick={() => {
                                    localStorage.setItem('verifiedToken', token);
                                    setIsModalOpen(false);
                                }}
                                className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </>
            )} {isBuyKeyModalOpen && selectedUser && (
                <>
                    <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"></div>
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 shadow-lg">
                        <div className="bg-white p-8 rounded-lg shadow-md text-gray-500">
                            <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Buy Key of {selectedUser.name}</h2>

                            <div className="flex items-center justify-center space-x-4 mb-4">
                                <button onClick={decrementKeys} className="bg-gray-300 px-3 py-2 rounded">-</button>
                                <input
                                    type="number"
                                    value={numberOfKeys}
                                    onChange={e => {
                                        let newNumberOfKeys = parseInt(e.target.value);
                                        if (isNaN(newNumberOfKeys)) {
                                            newNumberOfKeys = 0;
                                        } else {
                                            newNumberOfKeys = Math.max(1, newNumberOfKeys);
                                        }
                                        setNumberOfKeys(newNumberOfKeys);
                                        if (selectedUser) {
                                            fetchPriceAfterFees(selectedUser.subject, newNumberOfKeys);
                                        }
                                    }}
                                    className="w-16 text-center border rounded no-arrows"
                                    min="1"
                                    step="1"
                                    style={{ appearance: "none", MozAppearance: "textfield" }}
                                />

                                <button onClick={incrementKeys} className="bg-gray-300 px-3 py-2 rounded">+</button>
                            </div>

                            <p className="mb-2">
                                Price: {(convertToHumanReadableDigits(selectedUser.price) * numberOfKeys).toFixed(4)} ETH
                                {priceAfterFees !== null && (
                                    <span className="block">Price After Fees: {priceAfterFees.toFixed(4)} ETH</span>
                                )}
                            </p>
                            <button
                                onClick={() => {
                                    buyKeys();
                                    closeBuyKeyModal();
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded w-full"
                            >
                                Buy {numberOfKeys} Key{numberOfKeys > 1 ? 's' : ''}
                            </button>
                            <button
                                onClick={closeBuyKeyModal}
                                className="mt-2 bg-red-500 text-white px-4 py-2 rounded w-full"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </>
            )} {isSuccessModalOpen && (
                <>
                    <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"></div>
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Success</h2>
                            <p>You successfully bought <strong>{numberOfKeys}</strong> key{numberOfKeys > 1 ? 's' : ''} of <strong>{boughtUser}</strong>!</p>
                            <button
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="mt-2 bg-green-600 text-white px-4 py-2 rounded w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )} {isErrorModalOpen && (
                <>
                    <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"></div>
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-center text-red-500">Error</h2>
                            <p>Please try again, your transaction didn't go through.</p>
                            <button
                                onClick={() => setIsErrorModalOpen(false)}
                                className="mt-2 bg-red-600 text-white px-4 py-2 rounded w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )} {isPendingModalOpen && (
                <>
                    <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"></div>
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Pending</h2>
                            <p>Transaction pending... buying the keys</p>
                            <button
                                onClick={() => setIsPendingModalOpen(false)}
                                className="mt-2 bg-green-600 text-white px-4 py-2 rounded w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
                        
            


        </div>
    );
}