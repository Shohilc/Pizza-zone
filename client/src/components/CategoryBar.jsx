import React from 'react';
import {
  Utensils,
  Pizza,
  Sandwich,
  Coffee,
  Sparkles,
} from 'lucide-react';

export function CategoryBar({ categories, selectedCategory, onSelectCategory, vegOnly, onToggleVeg }) {
  return (
    <div className="sticky top-16 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        {/* Categories Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat._id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Veg Only Toggle */}
        <div className="flex-shrink-0 flex items-center pl-2 border-l border-stone-200">
          <button
            onClick={onToggleVeg}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-sm border bg-white flex items-center justify-center ${
                vegOnly ? 'border-emerald-600' : 'border-stone-400'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  vegOnly ? 'bg-emerald-600' : 'bg-stone-400'
                }`}
              />
            </div>
            <span>Veg Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}

