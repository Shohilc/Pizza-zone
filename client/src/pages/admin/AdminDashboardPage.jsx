import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  XCircle,
  Volume2,
  VolumeX,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  MapPin,
  Utensils,
  Settings,
  Shield,
} from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { useSocket } from '../../context/SocketContext';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { CancelModal } from '../../components/CancelModal';
import { playAdminNewOrderBell } from '../../utils/sound';

export function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING_CONFIRMATION');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Action loading state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { socket, joinAdminRoom } = useSocket();
  const audioContextRef = useRef(null);

  // Play restaurant counter bell for new order
  const playChime = () => {
    if (!soundEnabled) return;
    playAdminNewOrderBell();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        orderApi.getAllOrdersAdmin({ limit: 50 }),
        orderApi.getOrderStatsAdmin(),
      ]);
      if (ordersRes?.orders) setOrders(ordersRes.orders);
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Socket setup for admin real-time stream
  useEffect(() => {
    joinAdminRoom();

    if (socket) {
      const handleOrderCreated = (newOrder) => {
        playChime();
        setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
        // update stats
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pendingConfirmation: prev.pendingConfirmation + 1,
            activeOrders: prev.activeOrders + 1,
            allTimeCount: prev.allTimeCount + 1,
          };
        });
      };

      const handleOrderUpdated = (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      };

      socket.on('order:created', handleOrderCreated);
      socket.on('order:updated', handleOrderUpdated);

      return () => {
        socket.off('order:created', handleOrderCreated);
        socket.off('order:updated', handleOrderUpdated);
      };
    }
  }, [socket, soundEnabled]);

  // Handle advancing status
  const handleUpdateStatus = async (orderId, nextStatus, note = '') => {
    try {
      setActionLoadingId(orderId);
      const res = await orderApi.updateOrderStatus(orderId, nextStatus, note);
      if (res?.success && res?.order) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? res.order : o)));
        // Refresh metrics
        orderApi.getOrderStatsAdmin().then((s) => s?.stats && setStats(s.stats));
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open cancel modal
  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason, note) => {
    if (!orderToCancel) return;
    try {
      setCancelling(true);
      const res = await orderApi.cancelOrder(orderToCancel._id, reason, note);
      if (res?.success && res?.order) {
        setOrders((prev) => prev.map((o) => (o._id === orderToCancel._id ? res.order : o)));
        setCancelModalOpen(false);
        setOrderToCancel(null);
        orderApi.getOrderStatsAdmin().then((s) => s?.stats && setStats(s.stats));
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (activeTab !== 'ALL' && order.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customer.name.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-stone-900 tracking-tight">
                  Store Operations & Order Flow
                </h1>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Socket Connected" />
              </div>
              <p className="text-xs text-stone-500">Live order queue with telephone confirmation</p>
            </div>
          </div>

          {/* Quick Sub-navigation & Controls */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/menu"
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Menu Items</span>
            </Link>
            <Link
              to="/admin/settings"
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Store Settings</span>
            </Link>
            <button
              onClick={() => playAdminNewOrderBell()}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              title="Test Order Alert Sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Test Sound</span>
            </button>
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playAdminNewOrderBell();
              }}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-stone-200 bg-white text-stone-400'
              }`}
              title={soundEnabled ? 'Chime on new order: Active (Click to mute)' : 'Sound muted (Click to enable & test)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              Needs Call
            </div>
            <div className="text-2xl font-black mt-1">{stats?.pendingConfirmation || 0}</div>
            <div className="text-[10px] text-amber-100 font-medium">Pending confirmation</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              In Kitchen
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1">
              {(stats?.confirmed || 0) + (stats?.preparing || 0)}
            </div>
            <div className="text-[10px] text-stone-500 font-medium">Cooking right now</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Ready / Out
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1">
              {(stats?.ready || 0) + (stats?.outForDelivery || 0)}
            </div>
            <div className="text-[10px] text-stone-500 font-medium">Awaiting pickup/transit</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Completed Today
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1">
              {stats?.todayCompletedCount || 0}
            </div>
            <div className="text-[10px] text-stone-500 font-medium">Delivered / Picked up</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-stone-900 text-white p-4 rounded-2xl shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Today's Revenue
            </div>
            <div className="text-2xl font-black text-brand-400 mt-1">
              ₹{stats?.todayRevenue || 0}
            </div>
            <div className="text-[10px] text-stone-400 font-medium">From completed orders</div>
          </div>
        </div>

        {/* SEARCH & FILTER TABS */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { key: 'PENDING_CONFIRMATION', label: 'Call Queue' },
                { key: 'CONFIRMED', label: 'Confirmed' },
                { key: 'PREPARING', label: 'Cooking' },
                { key: 'READY', label: 'Ready' },
                { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                { key: 'COMPLETED', label: 'Completed' },
                { key: 'CANCELLED', label: 'Cancelled' },
                { key: 'ALL', label: 'All Orders' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    activeTab === tab.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, customer, phone..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* ORDER CARDS STREAM */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-3xl border border-stone-200 animate-pulse h-40" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm">
            <span className="text-4xl block mb-2">🎉</span>
            <h3 className="text-base font-bold text-stone-900">No orders in this status</h3>
            <p className="text-xs text-stone-500 mt-1">
              Select another tab or wait for new incoming snacks orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isPending = order.status === 'PENDING_CONFIRMATION';
              const isWorking = actionLoadingId === order._id;

              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-3xl border transition-all p-5 shadow-sm ${
                    isPending
                      ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Top Bar: Order ID, Type, Time, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-black text-stone-900">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          order.orderType === 'DELIVERY'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.orderType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
                      </span>
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Customer Information & One-Tap Call */}
                  <div className="py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-7 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-stone-900 text-sm">
                          {order.customer.name}
                        </span>
                        {/* Call Customer Button */}
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call: {order.customer.phone}</span>
                        </a>
                      </div>

                      {order.orderType === 'DELIVERY' ? (
                        <p className="text-xs text-stone-600 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                          <span>{order.customer.address}{order.customer.landmark ? ` (Landmark: ${order.customer.landmark})` : ''}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500">Customer will pickup from store counter</p>
                      )}

                      {order.customerNotes && (
                        <div className="mt-1 p-2 bg-stone-100 rounded-xl text-xs text-stone-700 font-medium">
                          <strong>Note:</strong> "{order.customerNotes}"
                        </div>
                      )}
                    </div>

                    {/* Order Financials */}
                    <div className="md:col-span-5 md:text-right">
                      <div className="text-xs text-stone-500">
                        {order.items.length} items • Subtotal ₹{order.subtotal} + Delivery ₹{order.deliveryFee}
                      </div>
                      <div className="text-xl font-black text-brand-600">
                        ₹{order.totalAmount}
                      </div>
                      <span className="text-[11px] font-semibold text-stone-500 uppercase">
                        {order.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Items Detail */}
                  <div className="pt-2 pb-3 border-t border-stone-100 flex flex-wrap gap-2 text-xs">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-stone-100 px-2.5 py-1 rounded-lg text-stone-800 font-medium"
                      >
                        <strong>{item.quantity}x</strong> {item.name}
                        {item.selectedCustomizations?.length > 0 && (
                          <span className="text-[10px] text-stone-500">
                            {' '}
                            ({item.selectedCustomizations.map((c) => c.name).join(', ')})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Cancellation Reason Info if Cancelled */}
                  {order.status === 'CANCELLED' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                      <strong>Cancellation Reason:</strong> {order.cancelReason?.replace(/_/g, ' ')}
                      {order.cancelNote && <span> — "{order.cancelNote}"</span>}
                    </div>
                  )}

                  {/* ACTION CONTROLS */}
                  {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => openCancelModal(order)}
                        disabled={isWorking}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {order.status === 'PENDING_CONFIRMATION' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                order._id,
                                'CONFIRMED',
                                'Customer called & order confirmed by store'
                              )
                            }
                            disabled={isWorking}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Order (Customer Called)</span>
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order._id, 'PREPARING', 'Sent to kitchen for cooking')
                            }
                            disabled={isWorking}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Start Preparing in Kitchen</span>
                          </button>
                        )}

                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order._id, 'READY', 'Order cooked and packed')
                            }
                            disabled={isWorking}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Mark Ready & Packed</span>
                          </button>
                        )}

                        {order.status === 'READY' && (
                          <>
                            {order.orderType === 'DELIVERY' ? (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    order._id,
                                    'OUT_FOR_DELIVERY',
                                    'Handed to delivery partner'
                                  )
                                }
                                disabled={isWorking}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>Send Out For Delivery</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    order._id,
                                    'COMPLETED',
                                    'Customer collected from counter'
                                  )
                                }
                                disabled={isWorking}
                                className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete Pickup (Payment Received)</span>
                              </button>
                            )}
                          </>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                order._id,
                                'COMPLETED',
                                'Order delivered and COD cash received'
                              )
                            }
                            disabled={isWorking}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered & Cash Collected</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <CancelModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        orderNumber={orderToCancel?.orderNumber}
        isSubmitting={cancelling}
      />
    </div>
  );
}

