import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, ArrowRight, Clock } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { BottomNav } from '../components/BottomNav';

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await orderApi.getMyOrders();
        if (res?.success) {
          setOrders(res.orders || []);
        }
      } catch (err) {
        console.error('Failed to load order history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

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
        <h1 className="text-base font-black text-stone-900 tracking-tight">Order History</h1>
        <div className="w-10" />
      </header>

      <div className="p-4 space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-[28px] p-5 shadow-soft animate-pulse h-28"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 text-center shadow-soft">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-stone-900">No Orders Placed Yet</h3>
            <p className="text-xs text-stone-400 mt-1">
              Browse our crispy bites and order with cash on delivery!
            </p>
            <Link
              to="/"
              className="mt-5 inline-block px-6 py-2.5 bg-brand-500 text-white font-bold text-xs rounded-full shadow-float"
            >
              Order Now
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-[28px] p-4 shadow-soft space-y-3 border border-stone-100"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-stone-900 text-sm">#{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="text-xs text-stone-500 font-medium">
                {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Total</div>
                  <div className="text-sm font-black text-brand-500">₹{order.totalAmount}</div>
                </div>

                <Link
                  to={`/order/${order._id}`}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-full transition shadow-sm flex items-center gap-1.5"
                >
                  <span>Track Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
