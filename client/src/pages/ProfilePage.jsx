import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Check,
  Camera,
  Tag,
  MapPin,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Mail,
  Phone,
  Shield,
  Volume2,
  VolumeX,
  ExternalLink,
  MessageCircle,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BottomNav } from '../components/BottomNav';
import { AddressPickerModal } from '../components/AddressPickerModal';
import { playOrderPlacedSound, playAdminNewOrderBell } from '../utils/sound';

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, dbUser, updateUserProfile, logout, isAdmin, setAuthModalOpen } = useAuth();
  const { items, clearCart } = useCart();

  // Active view: 'main' | 'personal_info' | 'addresses' | 'payments' | 'settings' | 'help'
  const [activeView, setActiveView] = useState('main');

  // Personal Information form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Address picker modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Logout confirm modal
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fileInputRef = useRef(null);

  // Preset avatar choices
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  ];

  // Initialize data from auth context
  useEffect(() => {
    if (currentUser || dbUser) {
      setName(currentUser?.displayName || dbUser?.name || 'Customer');
      setEmail(currentUser?.email || dbUser?.email || '');
      setPhone(currentUser?.phoneNumber || dbUser?.phone || '');
      setDeliveryAddress(
        dbUser?.deliveryAddress ||
          (dbUser?.savedAddresses && dbUser.savedAddresses[0]?.addressLine) ||
          ''
      );
      setAboutMe(dbUser?.aboutMe || '');
      setAvatarUrl(currentUser?.photoURL || dbUser?.avatarUrl || AVATAR_PRESETS[0]);
    }
  }, [currentUser, dbUser]);

  // Handle photo file selection (base64)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save personal info
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        aboutMe: aboutMe.trim(),
        avatarUrl,
        savedAddresses: deliveryAddress.trim()
          ? [
              {
                label: 'Home',
                addressLine: deliveryAddress.trim(),
                isDefault: true,
              },
            ]
          : dbUser?.savedAddresses || [],
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveView('main');
      }, 1200);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setErrorMessage(err.message || 'Could not save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // If user is not logged in, prompt sign in with sleek state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] pb-28 max-w-md mx-auto flex flex-col justify-between sm:border-x sm:border-stone-200">
        <div className="p-6 pt-12 text-center">
          <div className="w-24 h-24 rounded-full bg-brand-50 mx-auto flex items-center justify-center text-brand-500 shadow-sm border border-brand-100">
            <User className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-5">Your Profile</h2>
          <p className="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
            Sign in to track orders, save multiple addresses, customize snacks, and manage your account.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="mt-6 w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-full shadow-lg transition"
          >
            Sign In / Register
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ==========================================
  // VIEW 1: PERSONAL INFORMATION (Image 2)
  // ==========================================
  if (activeView === 'personal_info') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] pb-32 max-w-md mx-auto sm:border-x sm:border-stone-200 relative flex flex-col">
        {/* Top Header */}
        <header className="px-5 py-4 flex items-center justify-between sticky top-0 bg-[#F7F8FA]/90 backdrop-blur-md z-20">
          <button
            onClick={() => setActiveView('main')}
            className="w-10 h-10 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-800 hover:bg-stone-100 transition shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
          <h1 className="text-base font-bold text-stone-900">Personal Information</h1>
          <div className="w-10" />
        </header>

        {/* Form Container */}
        <form onSubmit={handleSavePersonalInfo} className="px-5 pt-2 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center my-3">
              <div className="relative">
                <img
                  src={avatarUrl || AVATAR_PRESETS[0]}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                />
                {/* Verified badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center border-2 border-white shadow-sm">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 text-xs font-semibold text-stone-700 hover:text-brand-600 transition flex items-center gap-1.5"
              >
                <span>Change your photo</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
                {errorMessage}
              </div>
            )}

            {/* Success Toast */}
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center justify-center gap-2 font-bold animate-fade-in">
                <Check className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition shadow-sm"
              />
            </div>

            {/* Email & Phone Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  placeholder="name@email.com"
                  className="w-full px-3.5 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-[11px] font-semibold text-stone-500 cursor-not-allowed shadow-inner truncate"
                  title="Signed-in email address"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full px-3.5 py-3.5 bg-white border border-stone-200 rounded-2xl text-[11px] font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition shadow-sm truncate"
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700">Delivery Address</label>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Pick on Map</span>
                </button>
              </div>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Type your address here"
                className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition shadow-sm"
              />
            </div>

            {/* About Me */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">About Me</label>
              <textarea
                rows={3}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Write something about yourself"
                className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition shadow-sm resize-none"
              />
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="pt-6 pb-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-[#18181b] hover:bg-black text-white font-bold text-xs rounded-full shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>

        {/* Address Picker Modal */}
        <AddressPickerModal
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onSelectAddress={(addr) => {
            setDeliveryAddress(addr.formatted || addr.addressLine || '');
          }}
          initialAddress={deliveryAddress}
        />

        <BottomNav />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN PROFILE SCREEN (Image 1)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32 max-w-md mx-auto sm:border-x sm:border-stone-200 relative">
      {/* Dynamic Island / Top Spacing */}
      <div className="pt-6 pb-2 px-5 text-center">
        {/* Profile Avatar with Verified Badge */}
        <div className="relative inline-block mx-auto">
          <img
            src={avatarUrl || AVATAR_PRESETS[0]}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md mx-auto"
          />
          {/* Coral / Orange Verified Badge */}
          <div className="absolute -bottom-1 right-1 w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center border-2 border-white shadow-sm">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
        </div>

        {/* User Name & Email */}
        <h2 className="text-lg font-black text-stone-900 mt-3 tracking-tight">
          {name || currentUser?.displayName || 'Customer'}
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">{email || currentUser?.email}</p>

        {isAdmin && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-full">
            <Shield className="w-3 h-3 text-amber-600" />
            <span>Store Administrator</span>
          </div>
        )}
      </div>

      {/* Menu Cards Group (Matching Image 1) */}
      <div className="px-5 mt-4 space-y-2.5">
        {/* 1. Personal Information */}
        <button
          onClick={() => setActiveView('personal_info')}
          className="w-full bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 group-hover:text-stone-900 transition">
              <User className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-stone-800">Personal Information</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
        </button>

        {/* 2. My Orders */}
        <button
          onClick={() => navigate('/my-orders')}
          className="w-full bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 group-hover:text-stone-900 transition">
              <Tag className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-stone-800">My Orders</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
        </button>

        {/* 3. Addresses */}
        <button
          onClick={() => setAddressModalOpen(true)}
          className="w-full bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 group-hover:text-stone-900 transition">
              <MapPin className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-stone-800 block">Addresses</span>
              {deliveryAddress && (
                <span className="text-[10px] text-stone-400 truncate block max-w-[210px]">
                  {deliveryAddress}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
        </button>

        {/* 4. Payment Methods */}
        <button
          onClick={() => setActiveView('payments')}
          className="w-full bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 group-hover:text-stone-900 transition">
              <Wallet className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-stone-800">Payment Methods</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => setActiveView('settings')}
          className="w-full bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 group-hover:text-stone-900 transition">
              <Settings className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-stone-800">Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
        </button>

        {/* 6. Help & Support */}
        <button
          onClick={() => setActiveView('help')}
          className="w-full bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 group-hover:text-stone-900 transition">
              <HelpCircle className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-stone-800">Help & Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
        </button>

        {/* 7. Logout */}
        <button
          onClick={() => setLogoutModalOpen(true)}
          className="w-full bg-white hover:bg-rose-50/50 p-4 rounded-2xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 transition">
              <LogOut className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-rose-600">Logout</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-600 transition" />
        </button>
      </div>

      {/* Admin Quick Jump Link */}
      {isAdmin && (
        <div className="px-5 mt-4">
          <Link
            to="/admin"
            className="w-full p-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Shield className="w-4 h-4" />
            <span>Open Kitchen & Store Operations</span>
          </Link>
        </div>
      )}

      {/* Address Picker Modal */}
      <AddressPickerModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelectAddress={(addr) => {
          const formatted = addr.formatted || addr.addressLine || '';
          setDeliveryAddress(formatted);
          updateUserProfile({ deliveryAddress: formatted });
        }}
        initialAddress={deliveryAddress}
      />

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-stone-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-stone-900">Sign Out</h3>
            <p className="text-xs text-stone-500 mt-1">
              Are you sure you want to log out of your SnackCraft account?
            </p>
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setLogoutModalOpen(false);
                  clearCart();
                  await logout();
                  navigate('/');
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Modal: Payment Methods */}
      {activeView === 'payments' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-black text-stone-900">Payment Methods</h3>
              </div>
              <button
                onClick={() => setActiveView('main')}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="p-3.5 rounded-2xl border border-brand-200 bg-brand-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-900">Cash on Delivery (COD)</p>
                  <p className="text-[10px] text-stone-500">Pay cash directly when order arrives</p>
                </div>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-900">UPI on Delivery</p>
                  <p className="text-[10px] text-stone-500">Scan rider QR code with GPay/PhonePe/Paytm</p>
                </div>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-bold">
                  Available
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveView('main')}
              className="mt-5 w-full py-3 bg-stone-900 text-white font-bold text-xs rounded-full shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Sub-view Modal: Settings */}
      {activeView === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-black text-stone-900">Preferences & Audio</h3>
              </div>
              <button
                onClick={() => setActiveView('main')}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-900">Order Sound Effects</p>
                  <p className="text-[10px] text-stone-500">Audio chimes when placing orders</p>
                </div>
                <button
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) playOrderPlacedSound();
                  }}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                    soundEnabled
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-stone-200 bg-white text-stone-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => playOrderPlacedSound()}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Volume2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Test Sound Track</span>
              </button>
            </div>
            <button
              onClick={() => setActiveView('main')}
              className="mt-5 w-full py-3 bg-stone-900 text-white font-bold text-xs rounded-full shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Sub-view Modal: Help & Support */}
      {activeView === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-black text-stone-900">Help & Support</h3>
              </div>
              <button
                onClick={() => setActiveView('main')}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2.5">
              <a
                href="tel:919876543210"
                className="p-3.5 rounded-2xl border border-stone-200 hover:border-brand-300 flex items-center gap-3 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Call Restaurant</p>
                  <p className="text-[10px] text-stone-500">+91 98765 43210</p>
                </div>
              </a>

              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-300 flex items-center gap-3 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Chat on WhatsApp</p>
                  <p className="text-[10px] text-stone-500">Live order support</p>
                </div>
              </a>
            </div>
            <button
              onClick={() => setActiveView('main')}
              className="mt-5 w-full py-3 bg-stone-900 text-white font-bold text-xs rounded-full shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav */}
      <BottomNav />
    </div>
  );
}

