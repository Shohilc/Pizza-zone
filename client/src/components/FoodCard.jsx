import React, { useState } from 'react';
import { Star, Heart, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { FoodDetailModal } from './FoodDetailModal';

export function FoodCard({ item }) {
  const { items, addToCart, updateQuantity } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  // Cart state
  const cartEntries = items.filter((i) => i.menuItemId === item._id);
  const totalInCart = cartEntries.reduce((sum, i) => sum + i.quantity, 0);

  const handleCardClick = () => setModalOpen(true);

  const handleAddDirect = (e) => {
    e.stopPropagation();
    if (item.customizations?.length > 0) {
      setModalOpen(true);
    } else {
      addToCart(item, 1, []);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (cartEntries.length > 0) {
      updateQuantity(cartEntries[0].cartItemId, cartEntries[0].quantity + 1);
    } else {
      addToCart(item, 1, []);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (cartEntries.length > 0) {
      const target = cartEntries[cartEntries.length - 1];
      updateQuantity(target.cartItemId, target.quantity - 1);
    }
  };

  const rating = item.rating || 4.5;

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
      >
        {/* ── Image Area ── */}
        <div className="relative bg-[#F7F8FA] h-40 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🍔</span>
            </div>
          )}

          {/* Sold Out overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-stone-900/55 flex items-center justify-center">
              <span className="bg-stone-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Sold Out
              </span>
            </div>
          )}

          {/* Discount badge */}
          {item.discountPercent > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-[#1c1c1e] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              -{item.discountPercent}%
            </div>
          )}
        </div>

        {/* ── Info Area ── */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          {/* Name */}
          <h3 className="text-[13px] font-black text-stone-900 leading-snug line-clamp-1">
            {item.name}
          </h3>

          {/* Subtitle */}
          <p className="text-[11px] text-stone-400 font-medium line-clamp-1">
            {item.description || item.category?.name || 'Fresh & Delicious'}
          </p>

          {/* Bottom row: rating left + heart / add button right */}
          <div className="flex items-center justify-between mt-1.5">
            {/* Star rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-bold text-stone-700">{rating}</span>
            </div>

            {/* Heart + cart action */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Heart */}
              <button
                onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                className="w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90"
              >
                <Heart
                  className={`w-4 h-4 transition ${
                    liked ? 'fill-rose-500 text-rose-500' : 'text-stone-300'
                  }`}
                />
              </button>

              {/* Cart button */}
              {item.isAvailable ? (
                totalInCart > 0 ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleDecrement}
                      className="w-7 h-7 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center active:scale-95 transition"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="text-xs font-black text-stone-900 w-4 text-center">
                      {totalInCart}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="w-7 h-7 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center active:scale-95 transition"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddDirect}
                    className="w-7 h-7 rounded-full border-2 border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900 flex items-center justify-center active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )
              ) : (
                <span className="text-[10px] font-bold text-stone-400">Unavailable</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <FoodDetailModal
        item={item}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToCart={addToCart}
      />
    </>
  );
}
