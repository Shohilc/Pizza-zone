import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  MoreVertical,
  Minus,
  Plus,
  MapPin,
  Phone,
  User,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../api/orderApi';
import { AddressPickerModal } from '../components/AddressPickerModal';
import { playOrderPlacedSound } from '../utils/sound';

export function CheckoutPage() {
  const {
    items,
    orderType,
    setOrderType,
    subtotal,
    activeDeliveryFee,
    estimatedTotal,
    clearCart,
    updateQuantity,
  } = useCart();

  const { currentUser, dbUser, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null); // holds orderId after success

  const total = subtotal;

  // Sync name & phone on first load only (don't overwrite user edits)
  useEffect(() => {
    if (!name && currentUser) {
      setName(currentUser.displayName || dbUser?.name || '');
    }
    if (!phone && currentUser) {
      setPhone(currentUser.phoneNumber || dbUser?.phone || '');
    }
  }, [currentUser]);

  // Always sync address from profile whenever dbUser changes
  // (covers: first load + after user updates address in ProfilePage)
  useEffect(() => {
    if (!dbUser) return;

    // Priority: deliveryAddress field > first savedAddress
    const profileAddress =
      dbUser.deliveryAddress ||
      (dbUser.savedAddresses?.length > 0
        ? (dbUser.savedAddresses.find((a) => a.isDefault) || dbUser.savedAddresses[0])?.addressLine
        : '');

    if (profileAddress) {
      setAddress(profileAddress);
    }

    // Also pick up landmark if available
    if (dbUser.savedAddresses?.length > 0) {
      const def = dbUser.savedAddresses.find((a) => a.isDefault) || dbUser.savedAddresses[0];
      if (def?.landmark) setLandmark(def.landmark);
    }
  }, [dbUser]);

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8FA]">
        <div className="text-center bg-white p-8 rounded-[32px] border border-stone-200 shadow-soft max-w-sm w-full">
          <span className="text-4xl block mb-2">🛍️</span>
          <h2 className="text-base font-black text-stone-900">Your bag is empty</h2>
          <p className="mt-1 text-xs text-stone-400">Add some crispy bites before checking out!</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center justify-center px-6 py-2.5 bg-[#1c1c1e] text-white font-bold text-xs rounded-full shadow-md transition"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!currentUser) { setAuthModalOpen(true); return; }
    if (!name.trim()) { setError('Please provide your name'); return; }
    if (!phone.trim() || phone.trim().length < 8) { setError('Please enter a valid phone number'); return; }
    if (orderType === 'DELIVERY' && (!address.trim() || address.trim().length < 5)) {
      setError('Please provide a complete delivery address');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const payloadItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        selectedCustomizations: item.selectedCustomizations.map((c) => ({
          groupName: c.groupName,
          name: c.name,
        })),
      }));

      const response = await orderApi.createOrder({
        orderType,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: orderType === 'DELIVERY' ? address.trim() : 'Takeaway / Store Pickup',
          landmark: landmark.trim(),
        },
        items: payloadItems,
        paymentMethod,
        customerNotes: customerNotes.trim(),
      });

      if (response?.success && response?.order) {
        playOrderPlacedSound();
        clearCart();
        setOrderSuccess(response.order._id);
      } else {
        throw new Error(response?.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── ORDER SUCCESS SCREEN (Screen 3) ──
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex flex-col max-w-md mx-auto relative">
        {/* Dark header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
          <h1 className="text-[15px] font-black text-white">Checkout</h1>
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Payment pills (dark) */}
        <div className="px-5 mt-2 space-y-3">
          {[
            { label: 'Cash on Delivery', detail: 'Pay when order arrives', active: paymentMethod === 'CASH_ON_DELIVERY', icon: '💵' },
            { label: 'UPI Payment', detail: 'GPay / PhonePe / Paytm', active: paymentMethod === 'UPI', icon: '📱' },
          ].map((pm) => (
            <div
              key={pm.label}
              className={`flex items-center gap-3 p-3.5 rounded-2xl ${
                pm.active ? 'bg-white/15' : 'bg-white/5'
              }`}
            >
              <span className="text-2xl">{pm.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-black text-white">{pm.label}</p>
                <p className="text-[10px] text-white/50">{pm.detail}</p>
              </div>
              {pm.active && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#1c1c1e] fill-[#1c1c1e] stroke-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success card */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[36px] px-6 pb-10 pt-8 text-center shadow-2xl">
          {/* Animated checkmark */}
          <div className="w-20 h-20 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center mx-auto mb-5 shadow-xl">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-xl font-black text-stone-900">Order Successful!</h2>
          <p className="text-xs text-stone-500 mt-2 max-w-[220px] mx-auto leading-relaxed">
            We're preparing your food. See updates in My Orders.
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full py-4 bg-[#1c1c1e] hover:bg-black text-white font-black text-sm rounded-full shadow-lg transition"
          >
            Go Home
          </button>

          <button
            onClick={() => navigate(`/order/${orderSuccess}`)}
            className="mt-3 w-full py-3.5 bg-transparent text-stone-700 font-bold text-sm rounded-full border border-stone-200 hover:bg-stone-50 transition"
          >
            Track your order
          </button>
        </div>
      </div>
    );
  }

  // ── CHECKOUT SCREEN (Screen 2) ──
  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-28 max-w-md mx-auto sm:shadow-2xl sm:border-x sm:border-stone-200/80">
      {/* Header */}
      <header className="px-5 py-4 bg-white border-b border-stone-100 flex items-center justify-between sticky top-0 z-30">
        <Link
          to="/"
          className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-800 hover:bg-stone-200 transition"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5" />
        </Link>
        <h1 className="text-[15px] font-black text-stone-900">Checkout</h1>
        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
          <MoreVertical className="w-4 h-4" />
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="px-5 pt-4 space-y-4">

        {/* ── PAYMENT METHOD ── */}
        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
          {/* Cash on Delivery */}
          <button
            type="button"
            onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
            className={`w-full flex items-center gap-3 px-4 py-4 border-b border-stone-100 transition ${
              paymentMethod === 'CASH_ON_DELIVERY' ? 'bg-stone-50' : 'hover:bg-stone-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black text-stone-900">Cash on Delivery</p>
              <p className="text-[10px] text-stone-400">Pay when your order arrives</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              paymentMethod === 'CASH_ON_DELIVERY'
                ? 'border-[#1c1c1e] bg-[#1c1c1e]'
                : 'border-stone-300'
            }`}>
              {paymentMethod === 'CASH_ON_DELIVERY' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>

          {/* UPI */}
          <button
            type="button"
            onClick={() => setPaymentMethod('UPI')}
            className={`w-full flex items-center gap-3 px-4 py-4 transition ${
              paymentMethod === 'UPI' ? 'bg-stone-50' : 'hover:bg-stone-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black text-stone-900">UPI Payment</p>
              <p className="text-[10px] text-stone-400">GPay · PhonePe · Paytm</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              paymentMethod === 'UPI'
                ? 'border-[#1c1c1e] bg-[#1c1c1e]'
                : 'border-stone-300'
            }`}>
              {paymentMethod === 'UPI' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        </div>

        {/* ── DELIVERY ADDRESS ── */}
        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-xs font-black text-stone-900">Delivery Address</p>
          </div>

          {/* Contact fields */}
          <div className="px-4 py-3 space-y-2.5">
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {orderType === 'DELIVERY' && (
              <button
                type="button"
                onClick={() => setAddressModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F7F8FA] border border-stone-200 text-left hover:bg-stone-100 transition"
              >
                <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span className={`flex-1 text-xs font-semibold truncate ${address ? 'text-stone-900' : 'text-stone-400'}`}>
                  {address || 'Tap to set delivery address'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* ── ORDER SUMMARY ── */}
        <div className="bg-white rounded-[20px] shadow-sm px-4 py-4">
          <p className="text-xs font-black text-stone-900 mb-3">Order Summary</p>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between text-stone-500">
              <span>Order Amount</span>
              <span className="font-semibold text-stone-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Delivery</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between pt-2.5 border-t border-stone-100 text-[13px] font-black text-stone-900">
              <span>Total Amount</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>

        {/* ── PAY NOW CTA ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-[#1c1c1e] hover:bg-black text-white font-black text-sm rounded-full shadow-lg transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Placing Order...</span>
            </>
          ) : (
            <span>Pay Now</span>
          )}
        </button>
      </form>

      <AddressPickerModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        initialAddress={address}
        onSelectAddress={(data) => {
          setAddress(data.address || data.formatted || '');
          if (data.landmark) setLandmark(data.landmark);
        }}
      />
    </div>
  );
}
