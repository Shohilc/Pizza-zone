import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Bell,
  Shield,
  Truck,
} from 'lucide-react';
import { menuApi } from '../api/menuApi';
import { FoodCard } from '../components/FoodCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { AddressPickerModal } from '../components/AddressPickerModal';


export function HomePage() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeSettings, setStoreSettings] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(() => {
    try {
      return localStorage.getItem('snack_user_location') || '';
    } catch {
      return '';
    }
  });

  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [catRes, itemRes, storeRes] = await Promise.all([
          menuApi.getCategories().catch(() => ({ categories: [] })),
          menuApi.getMenuItems().catch(() => ({ items: [] })),
          menuApi.getStoreSettings().catch(() => ({ settings: null })),
        ]);

        if (catRes.categories) setCategories(catRes.categories);
        if (itemRes.items) setMenuItems(itemRes.items);
        if (storeRes.settings) setStoreSettings(storeRes.settings);
      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all') {
      const catSlug = item.category?.slug || '';
      if (catSlug !== selectedCategory) return false;
    }
    if (vegOnly && !item.isVeg) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-28 max-w-md mx-auto sm:shadow-2xl sm:border-x sm:border-stone-200/80 relative">

      {/* ── TOP HEADER ── */}
      <header className="px-4 pt-5 pb-2">
        {/* Row 1: Delivery info + action icons */}
        <div className="flex items-center justify-between">
          {/* Left: truck + delivery label + address */}
          <button
            onClick={() => setAddressModalOpen(true)}
            className="flex items-start gap-2.5 text-left group"
          >
            <div className="mt-0.5 w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-50 transition">
              <Truck className="w-4 h-4 text-stone-600 group-hover:text-brand-600 transition" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-400 leading-none mb-0.5">
                Delivery to
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-stone-900 leading-tight truncate max-w-[180px]">
                  {userLocation ||
                    (storeSettings?.storeAddress
                      ? storeSettings.storeAddress.split(',')[0]
                      : 'Set delivery location')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              </div>
            </div>
          </button>

          {/* Right: Bell + Cart */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-brand-50 text-stone-600 hover:text-brand-600 flex items-center justify-center transition"
                title="Admin Portal"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {/* Bell icon */}
            <button className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition">
              <Bell className="w-4 h-4" />
            </button>

            {/* Cart bag */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Big Tagline */}
        <div className="mt-5 mb-4">
          <h1 className="text-[26px] font-black text-stone-900 leading-tight tracking-tight">
            <span className="text-stone-900">Hungry?</span>{' '}
            <span className="text-stone-400 font-extrabold">Order &amp; Eat.</span>
          </h1>
        </div>

        {/* Row 3: Search bar + Filter button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for fast food..."
              className="w-full bg-white pl-10 pr-4 py-3 rounded-full text-xs font-semibold text-stone-900 placeholder-stone-400 border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          {/* Black filter pill */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold transition shadow-sm flex-shrink-0 ${
              vegOnly
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1c1c1e] hover:bg-black text-white active:scale-95'
            }`}
          >
            <span>{vegOnly ? 'Veg' : 'Filter'}</span>
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>



      {/* ── CATEGORIES FILTER — pill tags ── */}
      <section className="pt-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 pb-1">

          {/* ALL pill */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-[#1c1c1e] text-white shadow-md'
                : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400'
            }`}
          >
            All
          </button>

          {/* Dynamic category pills */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#1c1c1e] text-white shadow-md'
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FOOD ITEMS GRID ── */}
      <section id="picks-section" className="px-4 pt-2 pb-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-[20px] overflow-hidden animate-pulse">
                <div className="bg-stone-100 h-36" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-2/3" />
                  <div className="h-2.5 bg-stone-200 rounded w-1/2" />
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
            <span className="text-3xl block mb-2">🍟</span>
            <h4 className="text-sm font-bold text-stone-900">No snacks found</h4>
            <p className="text-xs text-stone-400 mt-1">Try another category or clear your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <FoodCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Address Picker Modal for Location Header */}
      <AddressPickerModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        initialAddress={userLocation}
        onSelectAddress={(data) => {
          const shortLoc = data.street || data.address.split(',')[0];
          setUserLocation(shortLoc);
          try {
            localStorage.setItem('snack_user_location', shortLoc);
          } catch (e) {}
        }}
      />

      {/* Persistent App-Like Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
