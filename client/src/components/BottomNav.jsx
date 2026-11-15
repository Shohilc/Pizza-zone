import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Tag, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { currentUser, setAuthModalOpen } = useAuth();

  const isHome = location.pathname === '/';
  const isOrders = location.pathname === '/my-orders';
  const isProfile = location.pathname.startsWith('/profile');

  const handleProfileClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="fixed bottom-3 left-4 right-4 z-40 sm:left-1/2 sm:-translate-x-1/2 sm:w-[390px] pointer-events-none">
      <nav className="pointer-events-auto bg-[#18181b] text-white rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] border border-stone-800 flex items-center justify-between">
        {/* 1. Home */}
        <button
          onClick={() => navigate('/')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            isHome
              ? 'text-white bg-stone-800'
              : 'text-stone-400 hover:text-white'
          }`}
          title="Home"
        >
          <Home className="w-5 h-5 stroke-[2]" />
        </button>

        {/* 2. Deals / Orders (Tag) */}
        <button
          onClick={() => {
            if (!currentUser) {
              setAuthModalOpen(true);
            } else {
              navigate('/my-orders');
            }
          }}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            isOrders
              ? 'text-white bg-stone-800'
              : 'text-stone-400 hover:text-white'
          }`}
          title="My Orders"
        >
          <Tag className="w-5 h-5 stroke-[2]" />
        </button>

        {/* 3. Cart / Bag */}
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="relative flex items-center justify-center w-10 h-10 rounded-full text-stone-400 hover:text-white transition-all"
          title="Cart"
        >
          <ShoppingBag className="w-5 h-5 stroke-[2]" />
          {totalItemCount > 0 && (
            <span className="absolute 1 top-1 right-1 bg-[#FF6B35] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {totalItemCount}
            </span>
          )}
        </button>

        {/* 5. Profile (Image 1 Active Coral Pill) */}
        <button
          onClick={handleProfileClick}
          className={`transition-transform duration-200 ${
            isProfile
              ? 'bg-[#FF6B35] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md scale-105'
              : 'text-stone-400 hover:text-white w-10 h-10 rounded-full flex items-center justify-center'
          }`}
          title="Profile"
        >
          <User className={`w-5 h-5 ${isProfile ? 'text-white stroke-[2.5]' : 'stroke-[2]'}`} />
        </button>
      </nav>
    </div>
  );
}
