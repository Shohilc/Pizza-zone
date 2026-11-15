import React, { useState } from 'react';
import {
  ChevronLeft,
  Heart,
  Share2,
  Star,
  MessageCircle,
  Phone,
  Bike,
  Package,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

export function FoodDetailModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpandedDesc, setIsExpandedDesc] = useState(false);

  if (!isOpen || !item) return null;

  const basePrice = item.price || 0;
  const customizationPrice = selectedCustomizations.reduce((sum, c) => sum + (c.price || 0), 0);
  const unitPrice = basePrice + customizationPrice;
  const totalPrice = unitPrice * quantity;

  const handleSelectOption = (group, option) => {
    if (group.allowMultiple) {
      setSelectedCustomizations((prev) => {
        const exists = prev.some((c) => c.groupName === group.groupName && c.name === option.name);
        if (exists) {
          return prev.filter((c) => !(c.groupName === group.groupName && c.name === option.name));
        } else {
          return [...prev, { groupName: group.groupName, name: option.name, price: option.price }];
        }
      });
    } else {
      setSelectedCustomizations((prev) => {
        const filtered = prev.filter((c) => c.groupName !== group.groupName);
        return [...filtered, { groupName: group.groupName, name: option.name, price: option.price }];
      });
    }
  };

  const isOptionSelected = (groupName, optionName) => {
    return selectedCustomizations.some((c) => c.groupName === groupName && c.name === optionName);
  };

  const handleAdd = () => {
    onAddToCart(item, quantity, selectedCustomizations);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-[36px] sm:rounded-[36px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Image with Floating Action Icons */}
        <div className="relative h-64 sm:h-72 w-full bg-stone-100 flex-shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />

          {/* Top Floating Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-stone-800 hover:scale-105 transition"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-stone-800 hover:scale-105 transition"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? 'text-rose-500 fill-rose-500' : 'text-stone-700'
                  }`}
                />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: item.name, text: item.description, url: window.location.href }).catch(() => {});
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-stone-800 hover:scale-105 transition"
              >
                <Share2 className="w-4 h-4 text-stone-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Sheet */}
        <div className="p-6 -mt-6 bg-white rounded-t-[32px] flex-1 overflow-y-auto space-y-5">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight leading-tight">
                {item.name}
              </h2>
              <p className="text-xs font-semibold text-stone-400 mt-0.5">
                By {item.category?.name || 'SnackCraft Kitchen'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full text-amber-700 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>4.8</span>
            </div>
          </div>


          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Description</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {item.description ||
                'Freshly prepared snack made with premium local ingredients, aromatic herbs and baked golden.'}{' '}
              <button
                onClick={() => setIsExpandedDesc(!isExpandedDesc)}
                className="font-bold text-stone-800 hover:text-brand-500"
              >
                {isExpandedDesc ? 'Read less' : '...Read more'}
              </button>
            </p>
            {isExpandedDesc && (
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Made to order with hand-kneaded dough, farm-fresh dairy paneer/mozzarella and signature spices. Served piping hot directly to your doorstep or counter pickup.
              </p>
            )}
          </div>

          {/* Delivery Info Badges Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-stone-400">Delivery Time</div>
                <div className="text-xs font-bold text-stone-900">{item.preparationTimeMinutes || 20} min</div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-stone-400">Delivery Type</div>
                <div className="text-xs font-bold text-stone-900">SnackCraft Express</div>
              </div>
            </div>
          </div>

          {/* Customization Options */}
          {item.customizations?.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Customise Your Snack</h3>
              {item.customizations.map((group) => (
                <div key={group.groupName} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                    <span>{group.groupName}</span>
                    <span className="text-[10px] text-stone-400">
                      {group.allowMultiple ? 'Multiple selections' : 'Pick 1'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.options?.map((option) => {
                      const selected = isOptionSelected(group.groupName, option.name);
                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={() => handleSelectOption(group, option)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition ${
                            selected
                              ? 'border-brand-500 bg-brand-50/50 text-stone-900'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300'
                              }`}
                            >
                              {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span>{option.name}</span>
                          </div>
                          <span>{option.price > 0 ? `+₹${option.price}` : 'Free'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-stone-700">Quantity</span>
            <div className="flex items-center bg-stone-100 rounded-full p-1 border border-stone-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-700 font-bold shadow-sm"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-bold text-stone-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* SIGNATURE SPLIT BOTTOM CTA BUTTON (matching Screen 2) */}
        <div className="p-4 bg-white border-t border-stone-100">
          <div className="bg-brand-500 rounded-full p-1.5 pl-6 flex items-center justify-between shadow-float">
            <div className="text-white">
              <span className="text-xs font-medium text-brand-100 block leading-tight">Total</span>
              <span className="text-lg font-black leading-none">₹{totalPrice}</span>
            </div>

            <button
              onClick={handleAdd}
              className="bg-white hover:bg-stone-50 text-stone-900 font-extrabold text-sm py-3 px-8 rounded-full shadow-sm transition active:scale-95"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

