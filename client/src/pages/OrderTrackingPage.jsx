import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  PhoneCall,
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  Bike,
  AlertTriangle,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { useSocket } from '../context/SocketContext';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { BottomNav } from '../components/BottomNav';
import { playStatusUpdateSound } from '../utils/sound';

const PROGRESS_STEPS = [
  { key: 'PENDING_CONFIRMATION', label: 'Call', icon: PhoneCall },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Cooking', icon: ChefHat },
  { key: 'READY', label: 'Ready', icon: PackageCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'Transit', icon: Bike },
  { key: 'COMPLETED', label: 'Done', icon: CheckCircle2 },
];

export function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket, joinOrderRoom, leaveOrderRoom } = useSocket();

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const res = await orderApi.getOrderById(id);
        if (res?.success && res?.order) {
          setOrder(res.order);
        } else {
          setError(res?.message || 'Could not find order');
        }
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    joinOrderRoom(id);

    const handleStatusChanged = (data) => {
      if (data.orderId === id) {
        playStatusUpdateSound();
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            cancelReason: data.cancelReason,
            cancelNote: data.cancelNote,
            timeline: data.timeline || prev.timeline,
            updatedAt: data.updatedAt,
          };
        });
      }
    };

    if (socket) {
      socket.on('order:status_changed', handleStatusChanged);
    }

    return () => {
      leaveOrderRoom(id);
      if (socket) {
        socket.off('order:status_changed', handleStatusChanged);
      }
    };
  }, [id, socket]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8FA]">
        <div className="bg-white p-8 rounded-[32px] border border-stone-200 text-center max-w-sm w-full shadow-soft">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-black text-stone-900">Order Not Found</h2>
          <p className="mt-1 text-xs text-stone-400">{error || 'Could not load order tracking data.'}</p>
          <Link
            to="/"
            className="mt-5 inline-block px-6 py-2.5 bg-brand-500 text-white text-xs font-bold rounded-full shadow-float"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  const getStepIndex = (status) => {
    if (status === 'CANCELLED') return -1;
    const index = PROGRESS_STEPS.findIndex((s) => s.key === status);
    return index > -1 ? index : 0;
  };

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24 max-w-md mx-auto sm:shadow-2xl sm:border-x sm:border-stone-200/80">
      {/* Header */}
      <header className="p-4 px-5 bg-white border-b border-stone-100 flex items-center justify-between sticky top-0 z-30">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-800 hover:bg-stone-200 transition"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5" />
        </Link>
        <div className="text-center">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Live Tracker</div>
          <h1 className="text-sm font-black text-stone-900">Order #{order.orderNumber}</h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="p-4 space-y-4">
        {/* Status Hero Card */}
        {order.status === 'PENDING_CONFIRMATION' && (
          <div className="bg-brand-500 text-white p-5 rounded-[28px] shadow-float flex items-start gap-3.5 animate-fade-in">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black leading-tight">Store Owner Will Call You Shortly!</h2>
              <p className="mt-1 text-xs text-brand-100 leading-relaxed font-medium">
                Our kitchen owner will call you at <strong className="text-white underline">{order.customer.phone}</strong> to confirm your items before preparation starts.
              </p>
            </div>
          </div>
        )}

        {order.status === 'CONFIRMED' && (
          <div className="bg-blue-600 text-white p-5 rounded-[28px] shadow-float flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-black">Order Confirmed by Store</h2>
              <p className="mt-1 text-xs text-blue-100">Sent to kitchen for cooking fresh!</p>
            </div>
          </div>
        )}

        {order.status === 'PREPARING' && (
          <div className="bg-brand-500 text-white p-5 rounded-[28px] shadow-float flex items-start gap-3.5">
            <ChefHat className="w-6 h-6 flex-shrink-0 animate-bounce" />
            <div>
              <h2 className="text-sm font-black">Chef is Cooking Your Snacks!</h2>
              <p className="mt-1 text-xs text-brand-100">Fresh toppings, crispy edges, and thick dips!</p>
            </div>
          </div>
        )}

        {order.status === 'READY' && (
          <div className="bg-emerald-600 text-white p-5 rounded-[28px] shadow-float flex items-start gap-3.5">
            <PackageCheck className="w-6 h-6 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-black">Food is Hot & Packed!</h2>
              <p className="mt-1 text-xs text-emerald-100">
                {order.orderType === 'DELIVERY'
                  ? 'Handed over to rider for delivery.'
                  : 'Ready for counter pickup at store!'}
              </p>
            </div>
          </div>
        )}

        {order.status === 'OUT_FOR_DELIVERY' && (
          <div className="bg-purple-600 text-white p-5 rounded-[28px] shadow-float flex items-start gap-3.5">
            <Bike className="w-6 h-6 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-black">Rider on the Way!</h2>
              <p className="mt-1 text-xs text-purple-100">
                Heading towards {order.customer.address}. Please keep ₹{order.totalAmount} cash ready!
              </p>
            </div>
          </div>
        )}

        {order.status === 'COMPLETED' && (
          <div className="bg-stone-900 text-white p-5 rounded-[28px] shadow-soft flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-black">Order Completed!</h2>
              <p className="mt-1 text-xs text-stone-300">Enjoy your meal! Thank you for ordering with us.</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-[28px] flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-black text-rose-800">Order Cancelled</h2>
              <p className="mt-0.5 text-xs text-rose-700">
                Reason: <strong>{order.cancelReason?.replace(/_/g, ' ')}</strong>
              </p>
              {order.cancelNote && <p className="text-xs text-rose-600 italic mt-0.5">"{order.cancelNote}"</p>}
            </div>
          </div>
        )}

        {/* Step Progression Bar */}
        {!isCancelled && (
          <div className="bg-white rounded-[28px] p-5 shadow-soft">
            <div className="grid grid-cols-6 gap-1 text-center">
              {PROGRESS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 scale-105 shadow-sm'
                          : isPassed
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[9px] font-bold mt-1.5 leading-tight ${
                        isCurrent ? 'text-brand-500' : isPassed ? 'text-stone-800' : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Receipt / Items Card */}
        <div className="bg-white rounded-[28px] p-5 shadow-soft space-y-3">
          <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
            Order Items ({order.items.length})
          </h3>

          <div className="divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-extrabold text-stone-900">
                    {item.quantity}x {item.name}
                  </div>
                  {item.selectedCustomizations?.length > 0 && (
                    <div className="text-[10px] text-stone-400">
                      {item.selectedCustomizations.map((c) => c.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-black text-stone-900">₹{item.itemTotal}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs font-medium">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal:</span>
              <span className="font-bold text-stone-800">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Delivery Fee:</span>
              <span className="font-bold text-stone-800">₹{order.deliveryFee}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
              <span>Total Paid/Payable:</span>
              <span className="text-brand-500">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Call Helpline Card */}
        <div className="bg-white rounded-[28px] p-4 shadow-soft flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-stone-900">Have questions?</div>
            <div className="text-[11px] text-stone-400">Call our kitchen manager directly</div>
          </div>
          <a
            href="tel:+919876543210"
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-full transition shadow-sm flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5 text-brand-500" />
            <span>Call Kitchen</span>
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
