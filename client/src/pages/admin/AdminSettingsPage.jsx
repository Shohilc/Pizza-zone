import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Save, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { menuApi } from '../../api/menuApi';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'SnackCraft Bites',
    storePhone: '+91 98765 43210',
    storeAddress: 'Shop 12, Main Street, Snack Plaza',
    isOpen: true,
    closedNotice: 'We are currently closed. Accepting orders again tomorrow!',
    deliveryFee: 30,
    minOrderAmount: 99,
    estimatedDeliveryMinutes: 30,
    estimatedPickupMinutes: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await menuApi.getStoreSettings();
        if (res?.settings) {
          setSettings(res.settings);
        }
      } catch (err) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setError('');

      const res = await menuApi.updateStoreSettings({
        storeName: settings.storeName,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
        isOpen: settings.isOpen,
        closedNotice: settings.closedNotice,
        deliveryFee: Number(settings.deliveryFee),
        minOrderAmount: Number(settings.minOrderAmount),
        estimatedDeliveryMinutes: Number(settings.estimatedDeliveryMinutes),
        estimatedPickupMinutes: Number(settings.estimatedPickupMinutes),
      });

      if (res?.success) {
        setMessage('Store settings updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to save store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Queue</span>
          </Link>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Store Settings & Rules</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure store status, minimum order values, and delivery parameters
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 animate-pulse h-64" />
        ) : (
          <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            {/* Store Status Toggle */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-stone-900">Accepting Orders Online</div>
                <div className="text-xs text-stone-500">
                  {settings.isOpen
                    ? 'Store is OPEN and customers can place orders.'
                    : 'Store is CLOSED. New orders will be blocked.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isOpen ? 'bg-brand-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.isOpen ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!settings.isOpen && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Closed Notice (Shown to Customers)
                </label>
                <input
                  type="text"
                  value={settings.closedNotice}
                  onChange={(e) => setSettings({ ...settings, closedNotice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            )}

            {/* Delivery Fees & Order Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.deliveryFee}
                  onChange={(e) => setSettings({ ...settings, deliveryFee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Added to all home delivery orders
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.minOrderAmount}
                  onChange={(e) => setSettings({ ...settings, minOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Minimum subtotal required to checkout
                </span>
              </div>
            </div>

            {/* Store Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Store Display Name
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Store Contact Phone
                </label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Store Kitchen Address
              </label>
              <textarea
                rows={2}
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

