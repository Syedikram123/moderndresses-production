import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Sparkles, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Recovery modal state
  const [recoverySecret, setRecoverySecret] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const { login, recoverPassword } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(password);
      if (success) {
        navigate('/admin');
      } else {
        setError('Incorrect password. Please check and try again.');
      }
    } catch (err) {
      setError('An error occurred while authenticating.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (newPassword !== confirmPassword) {
      setRecoveryError('New passwords do not match.');
      return;
    }

    setRecoveryLoading(true);

    try {
      const res = await recoverPassword(recoverySecret, newPassword);
      if (res.success) {
        setRecoverySuccess('Password reset successfully! You can now log in.');
        setPassword(newPassword);
        setTimeout(() => {
          setShowForgotModal(false);
          setRecoverySuccess('');
        }, 2000);
      } else {
        setRecoveryError(res.error || 'Failed to recover password.');
      }
    } catch (err: any) {
      setRecoveryError(err?.message || 'Error processing recovery.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-boutique-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-charcoal-muted hover:text-charcoal mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store</span>
        </Link>
        <img
          src="/logo321.png"
          alt="Modern Dresses Logo"
          className="h-12 w-auto mx-auto mb-3 object-contain"
        />
        <h2 className="font-editorial text-3xl font-bold tracking-wider text-charcoal">
          MODERN DRESSES
        </h2>
        <p className="text-xs uppercase tracking-[0.25em] text-gold-700 font-semibold mt-1">
          Store Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-3xl border border-boutique-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                  Enter Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-gold-700 hover:text-gold-900 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-subtle">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-xs bg-boutique-50 border border-boutique-200 rounded-xl text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Admin'}</span>
                <Sparkles className="w-4 h-4 text-gold-400" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FORGOT / RECOVER PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevated border border-boutique-200 space-y-4">
            <div className="flex items-center gap-2 text-charcoal">
              <div className="p-2 bg-boutique-100 rounded-xl">
                <KeyRound className="w-5 h-5 text-gold-700" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-charcoal">
                  Reset Admin Password
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Enter your recovery password to configure a new password
                </p>
              </div>
            </div>

            {recoveryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {recoveryError}
              </div>
            )}

            {recoverySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Recovery Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter recovery password"
                  value={recoverySecret}
                  onChange={(e) => setRecoverySecret(e.target.value)}
                  className="w-full bg-boutique-50 border border-boutique-200 rounded-xl px-3 py-2.5 text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-boutique-50 border border-boutique-200 rounded-xl px-3 py-2.5 text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-boutique-50 border border-boutique-200 rounded-xl px-3 py-2.5 text-charcoal focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="px-5 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
                >
                  {recoveryLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
