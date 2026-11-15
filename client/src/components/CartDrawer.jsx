import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, Minus, Plus, Clock, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export function CartDrawer() {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    orderType,
    setOrderType,
    subtotal,
    activeDeliveryFee,
    estimatedTotal,
  } = useCart();

  const { currentUser, requireLogin } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  if (!isCartDrawerOpen) return null;

  const total = subtotal;

  const handleApplyPromo = () => {
    if (promoCode.trim().length > 2) setPromoApplied(true);
  };

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    if (!currentUser) {
      requireLogin(() => navigate('/checkout'));
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm"
      />

      {/* Sheet — full bottom sheet style */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#F7F8FA] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-stone-100">
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-800 hover:bg-stone-200 transition"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            <h2 className="text-[15px] font-black text-stone-900">My Cart List</h2>
            <button className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200 transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-5xl block mb-3">🛍️</span>
              <h3 className="text-base font-black text-stone-900">Cart is Empty</h3>
              <p className="mt-1 text-xs text-stone-400">Add delicious items to get started!</p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="mt-5 px-6 py-2.5 bg-[#1c1c1e] text-white text-xs font-bold rounded-full shadow-md transition"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Items list */}
              <div className="flex-1 overflow-y-auto bg-white divide-y divide-stone-100 px-5">
                {items.map((item) => (
                  <div key={item.cartItemId} className="py-4 flex items-center gap-3">
                    {/* Food image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-stone-100 flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-stone-900 text-sm leading-tight truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> 15-20 min
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500" /> 4.9
                        </span>
                      </div>
                      <div className="text-sm font-black text-brand-500 mt-1">
                        ₹{item.unitPrice ?? item.basePrice ?? 0}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-700 hover:border-stone-500 transition"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="text-[13px] font-black text-stone-900 w-5 text-center">
                        {String(item.quantity).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center hover:bg-black transition"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="bg-[#F7F8FA] px-5 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 bg-white border border-stone-200 rounded-full px-4 py-2.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                      promoApplied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-brand-500 hover:bg-brand-600 text-white'
                    }`}
                  >
                    {promoApplied ? 'Confirmed ✓' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[#F7F8FA] px-5 pt-3 pb-5 space-y-2">
                <h3 className="text-sm font-black text-stone-900">Order Summary</h3>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between text-stone-500">
                    <span>Order Amount</span>
                    <span className="font-semibold text-stone-900">₹{subtotal}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promo-code</span>
                      <span className="font-semibold">-₹20</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-500">
                    <span>Delivery</span>
                    <span className="font-semibold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-200 text-[13px] font-black text-stone-900">
                    <span>Total Amount</span>
                    <span>₹{promoApplied ? total - 20 : total}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckoutClick}
                  className="w-full mt-2 py-4 bg-[#1c1c1e] hover:bg-black text-white font-black text-sm rounded-full shadow-lg transition active:scale-[0.99]"
                >
                  Proceed Transactions
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
