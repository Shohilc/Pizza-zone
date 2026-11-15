import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading, loginAsDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Admin Privileges Required</h2>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            You are signed in as a customer. This area is restricted to store owners and kitchen managers.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/admin/login"
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition text-center shadow-sm"
            >
              Sign In as Store Owner
            </Link>
            <button
              onClick={() => loginAsDemo('admin')}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
            >
              Quick Demo: Store Owner
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Snack Store Menu</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

