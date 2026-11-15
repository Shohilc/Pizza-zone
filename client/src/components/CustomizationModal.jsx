import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';

export function CustomizationModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  const [quantity, setQuantity] = useState(1);

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
      // Single select group
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
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with image */}
        <div className="relative h-44 w-full bg-stone-100 flex-shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/30" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-stone-900/60 text-white rounded-full hover:bg-stone-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-xl font-bold text-white leading-tight">{item.name}</h3>
            <p className="text-stone-200 text-xs mt-1 line-clamp-1">{item.description}</p>
          </div>
        </div>

        {/* Scrollable Customization Groups */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {item.customizations?.map((group) => (
            <div key={group.groupName} className="border-b border-stone-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-stone-900">{group.groupName}</h4>
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                  {group.allowMultiple ? 'Choose any' : 'Choose 1'}
                </span>
              </div>

              <div className="space-y-2">
                {group.options?.map((option) => {
                  const selected = isOptionSelected(group.groupName, option.name);
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => handleSelectOption(group, option)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition ${
                        selected
                          ? 'border-brand-500 bg-brand-50/40 text-stone-900'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-${group.allowMultiple ? 'md' : 'full'} border flex items-center justify-center ${
                            selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium">{option.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-stone-600">
                        {option.price > 0 ? `+₹${option.price}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with quantity & add to cart */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4">
          <div className="flex items-center border border-stone-300 bg-white rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-stone-600 hover:bg-stone-100 font-bold"
            >
              -
            </button>
            <span className="px-3 py-2 text-sm font-bold text-stone-900 min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-stone-600 hover:bg-stone-100 font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl flex items-center justify-between shadow-sm transition"
          >
            <span>Add to Order</span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

