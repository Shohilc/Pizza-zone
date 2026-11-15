import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Shield, Clock, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { currentUser, dbUser, isAdmin, logout, setAuthModalOpen } = useAuth();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
            <span className="text-xl">🍕</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-stone-900 leading-none">
                Snack<span className="text-brand-600">Craft</span>
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium">Fresh Local Munchies</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-stone-600">
          <Link to="/" className="hover:text-brand-600 transition">
            Menu
          </Link>
          {currentUser && (
            <Link to="/my-orders" className="hover:text-brand-600 transition">
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200 hover:bg-brand-100 transition"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          {/* Cart Bag Button */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative p-2.5 rounded-2xl bg-stone-100 hover:bg-brand-50 text-stone-800 hover:text-brand-600 transition flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-600 text-white font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {totalItemCount}
              </span>
            )}
            <span className="hidden sm:inline text-xs font-bold">Bag</span>
          </button>

          {/* User Auth */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl border border-stone-200 hover:border-stone-300 transition text-sm font-semibold text-stone-800"
              >
                <div className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-bold max-w-[100px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-fade-in text-xs font-medium">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">
                        {currentUser.displayName || 'Customer'}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">{currentUser.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 font-bold text-[10px]">
                          Admin Access
                        </span>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 transition"
                    >
                      <User className="w-4 h-4 text-stone-400" />
                      <span>Profile & Info</span>
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 transition"
                    >
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span>Order History</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-600 hover:bg-brand-50 transition"
                      >
                        <Shield className="w-4 h-4 text-brand-500" />
                        <span>Store Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-2xl transition shadow-sm"
              title="Sign in to view your profile"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

