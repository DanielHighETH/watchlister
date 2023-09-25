'use client'
import React, { useState, useEffect } from 'react';

import Image from 'next/image';


export default function Home() {
  const [wallet, setWallet] = useState('');
  const [hasKey, setHasKey] = useState<null | boolean>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);


  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState<boolean>(false);

  const [users, setUsers] = useState<any[]>([]);
  const [watchlistedUsers, setWatchlistedUsers] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);



  type User = {
    address: string;
    pfpUrl: string;
    username: string;
    name: string;
  };

  useEffect(() => {
    const storedWallet = localStorage.getItem('verifiedWallet');
    if (storedWallet) {
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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/pullGlobal?token=${token}`);

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to add user to watchlist - Your Token is probably wrong');
        setAlertMessage('Failed to pull users. Please check if your Token is correct.');
      }

    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }


  const verifyWallet = async (walletAddress: string) => {
    try {
      const response = await fetch(`https://friendtech-extension-backend.vercel.app/api/hasMyKey?wallet=${walletAddress}`);

      if (!response.ok) {
        localStorage.removeItem('verifiedWallet');
        setShowAlert(true);
        throw new Error('Server responded with an error');
      }

      const data = await response.json();
      if (data) {
        setHasKey(true);
        localStorage.setItem('verifiedWallet', walletAddress);
      } else {
        setHasKey(false);
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }


  const handleEnterClick = () => {
    if (wallet) {
      verifyWallet(wallet);
    } else {
      setShowAlert(true);
      console.warn("Please enter a valid wallet address.");
    }
  }

  const handleTokenClick = () => {
    if (token) {
      localStorage.setItem('verifiedToken', token);
      setHasToken(true);
    }
  }

  const handleAddToWatchlist = async (user: User) => {
    try {
      const response = await fetch(`/api/addToWatchlist?token=${token}&wallet=${user.address}`, {
        method: 'POST',
      });

      if (response.ok) {
        setWatchlistedUsers(prev => [...prev, user]);
        setUsers(prev => prev.filter(u => u.address !== user.address));
      } else {
        console.error('Failed to add user to watchlist - Your Token is probably wrong');
        setAlertMessage('Failed to add user to watchlist. Please check if your Token is correct.');
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('An error occurred. Please try again.');
    }
  };


  const handleRemoveFromWatchlist = async (user: User) => {
    try {
      const response = await fetch(`/api/deleteFromWatchlist?token=${token}&wallet=${user.address}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => [...prev, user]);
        setWatchlistedUsers(prev => prev.filter(u => u.address !== user.address));
      } else {
        console.error('Failed to remove user from watchlist');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {showAlert && (
        <div className="fixed top-0 left-0 w-full flex items-center justify-center z-10 pt-10">
          <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg text-center">
            <p>You need to own atleast one key</p>
            <p className='text-center'><a href="https://friend.tech/dhigh_eth" target="_blank" rel="noopener noreferrer" className="text-white underline">Buy now</a></p>
            <button onClick={() => setShowAlert(false)} className="mt-2 bg-white text-red-500 px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}

      {hasKey === null || hasKey === false ? (
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-700">WATCHLISTER</h1>
          <div className="flex flex-col space-y-4">
            <label htmlFor="walletAddress" className="text-lg font-medium text-gray-500">Insert your FT wallet address:</label>
            <input
              type="text"
              id="walletAddress"
              placeholder="e.g. 0x1234..."
              onChange={e => setWallet(e.target.value)}
              className="p-2 border rounded-md focus:outline-none focus:border-indigo-500 text-gray-500"
              autoComplete="off"
            />
            <button
              type="submit"
              onClick={handleEnterClick}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              ENTER
            </button>
          </div>
        </div>
      ) : !hasToken ? (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md w-full sm:w-1/2 md:w-1/3">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-700">WATCHLISTER</h1>
          <div className="flex flex-col space-y-4">
            <label htmlFor="tokenInput" className="text-base sm:text-lg font-medium text-gray-500">Insert your FT TOKEN:</label>
            <input
              type="text"
              id="tokenInput"
              placeholder="eyJhb..."
              defaultValue={token}
              onChange={e => setToken(e.target.value)}
              className="p-2 border rounded-md focus:outline-none focus:border-indigo-500 text-gray-500"
              autoComplete="off"
            />
            <button
              type="submit"
              onClick={handleTokenClick}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              ENTER
            </button>
            <h2 className="text-lg sm:text-xl font-bold mt-4 text-center text-gray-700">HOW TO GET YOUR FT TOKEN</h2>
            <div className="video-container">
              <video className='w-full h-56' controls>
                <source src="/TOKEN.mp4" type="video/mp4" />
              </video>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-4 text-center text-gray-700">WHY DO YOU NEED FT TOKEN</h2>
            <p className="text-xs sm:text-sm text-gray-500">Your FriendTech Token is needed in headers of friend.tech API calls. Without correct token it is impossible to add someone to your watchlist. The app is saving your key just localy and I&apos;m not saving any of your data.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto mt-10 md:space-x-10 pt-10">
          <div className="w-full md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Not Watchlisted</h2>
            <ul>
              {users.map(user => (
                <li key={user.address} className="flex items-center space-x-4 mb-4">
                  <img src={user.pfpUrl} alt={user.name} width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      <a href={`https://friend.tech/${user.username}`} target="_blank" rel="noopener noreferrer">
                        @{user.username}
                      </a>
                    </p>
                  </div>
                  <button onClick={() => handleAddToWatchlist(user)} className="bg-indigo-600 text-white px-4 py-2 rounded">ADD</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Watchlisted</h2>
            <ul>
              {watchlistedUsers.map(user => (
                <li key={user.address} className="flex items-center space-x-4 mb-4">
                  <img src={user.pfpUrl} alt={user.name} width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      <a href={`https://friend.tech/${user.username}`} target="_blank" rel="noopener noreferrer">
                        @{user.username}
                      </a>
                    </p>
                  </div>
                  <button onClick={() => handleRemoveFromWatchlist(user)} className="bg-red-600 text-white px-4 py-2 rounded">REMOVE</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="fixed top-4 right-4 flex space-x-4">
            <button onClick={fetchUsers} className="bg-green-600 text-white px-4 py-2 rounded">Refresh Data</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-yellow-600 text-white px-4 py-2 rounded">Edit Token</button>
          </div>
        </div>
      )} {isModalOpen && (
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
      )} {alertMessage && (
        <div className="fixed top-0 left-0 w-full flex items-center justify-center z-10 pt-10">
          <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg text-center">
            <p>{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="mt-2 bg-white text-red-500 px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
