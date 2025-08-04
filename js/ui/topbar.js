import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/lala-avatar.png';

const Topbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white border-b border-purple-100 px-6 py-3 flex items-center justify-between shadow-sm relative z-50">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="Lala Logo" className="h-8 w-8 rounded-md shadow-sm" />
        <h1 className="text-base font-semibold text-purple-900 whitespace-nowrap">
          Styling Adventures with Lala – Admin Portal
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6" ref={dropdownRef}>
        {/* Upload Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(dropdownOpen === 'upload' ? null : 'upload')}
            className="text-sm font-medium text-purple-800 hover:text-purple-600 transition"
          >
            Upload ▾
          </button>
          {dropdownOpen === 'upload' && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-purple-100 rounded-md shadow-lg z-50 flex flex-col">
              <Link to="/upload/closet" className="px-4 py-2 text-sm text-purple-800 hover:bg-purple-50">Closet</Link>
              <Link to="/upload/voice" className="px-4 py-2 text-sm text-purple-800 hover:bg-purple-50">Voice</Link>
              <Link to="/upload/episodes" className="px-4 py-2 text-sm text-purple-800 hover:bg-purple-50">Episodes</Link>
              <Link to="/upload/meta" className="px-4 py-2 text-sm text-purple-800 hover:bg-purple-50">Meta</Link>
              <Link to="/upload/manage" className="px-4 py-2 text-sm text-purple-800 hover:bg-purple-50">Manage Panels</Link>
            </div>
          )}
        </div>

        {/* Dashboard Link */}
        <Link to="/dashboard" className="text-sm font-medium text-purple-800 hover:text-purple-600 transition">
          Dashboard
        </Link>

        {/* Logout */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(dropdownOpen === 'profile' ? null : 'profile')}
            className="text-sm font-medium text-purple-800 hover:text-purple-600 transition"
          >
            Profile ▾
          </button>
          {dropdownOpen === 'profile' && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-purple-100 rounded-md shadow-lg z-50 flex flex-col">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2 text-sm text-left text-purple-800 hover:bg-purple-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-xl max-w-sm w-full text-center">
            <h2 className="text-purple-900 font-semibold mb-4">Are you sure you want to log out?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  // add your logout logic here
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border border-purple-300 text-purple-800 rounded-md hover:bg-purple-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
