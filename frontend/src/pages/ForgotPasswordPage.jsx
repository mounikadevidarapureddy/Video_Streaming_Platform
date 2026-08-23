import React, { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle, Popcorn, Play, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import popcornGirlImage from '../assets/popcorn_girl.png';

export default function ForgotPasswordPage({ onNavigateLogin, onBackToBrowse }) {
  // Step 1: Email, Step 2: OTP, Step 3: New Password, Step 4: Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setGeneratedOtp(res.otp);
      setSuccessMsg(`OTP sent to ${email}. Check your mail (or use code below).`);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.verifyOtp(email, otp);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword(email, otp, newPassword);
      setSuccessMsg(res.message);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090e] text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={onNavigateLogin}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </button>

      {/* Split Card */}
      <div className="relative w-full max-w-5xl glass-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10">
        
        {/* LEFT COLUMN: Recovery Wizard */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
              <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                FLIXIT
              </span>
            </div>

            <h1 className="text-2xl font-black text-white mb-1">Password Recovery</h1>
            <p className="text-xs text-gray-400 mb-6">Follow the 3-step email OTP process to set a new password.</p>

            {/* Wizard Progress Pills */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`flex-1 py-1.5 rounded-full text-[10px] font-extrabold text-center uppercase tracking-wider ${
                step === 1 ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-500'
              }`}>
                1. Email
              </span>
              <span className={`flex-1 py-1.5 rounded-full text-[10px] font-extrabold text-center uppercase tracking-wider ${
                step === 2 ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-500'
              }`}>
                2. Enter OTP
              </span>
              <span className={`flex-1 py-1.5 rounded-full text-[10px] font-extrabold text-center uppercase tracking-wider ${
                step >= 3 ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-500'
              }`}>
                3. New Password
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1 FORM: ENTER EMAIL */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Registered Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@flixit.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full glow-btn-purple py-3.5 text-xs flex items-center justify-center gap-2 font-bold"
                >
                  {loading ? 'Sending OTP Code...' : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {/* STEP 2 FORM: ENTER OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Simulated Email OTP Banner */}
                {generatedOtp && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>📩 Verification OTP Code Generated:</span>
                      <span className="text-base font-black tracking-widest text-cyan-200 bg-cyan-900/80 px-3 py-1 rounded-lg border border-cyan-400/50">{generatedOtp}</span>
                    </div>
                    <p className="text-[10px] text-gray-300">OTP valid for 15 minutes. Enter code below.</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Enter 6-Digit OTP Code</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-center text-lg font-black tracking-widest text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-xs font-bold text-gray-300 hover:text-white"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 glow-btn-purple py-3 text-xs font-bold"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP Code'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 FORM: CREATE NEW PASSWORD */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full glow-btn-purple py-3.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS VIEW */}
            {step === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Password Updated!</h3>
                <p className="text-xs text-gray-300">{successMsg}</p>
                <button
                  onClick={onNavigateLogin}
                  className="glow-btn-purple px-8 py-3 text-xs font-bold"
                >
                  Sign In with New Password
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-center text-xs text-gray-400">
            Remember your password?{' '}
            <button onClick={onNavigateLogin} className="text-purple-400 font-bold hover:underline">
              Sign In Here
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Popcorn Girl Visual */}
        <div className="hidden md:flex relative bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 flex-col items-center justify-between p-10 border-l border-white/10 overflow-hidden">
          <div className="z-10 text-center mt-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-yellow-300 shadow-xl mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Secure OTP Recovery
            </div>
            <h2 className="text-2xl font-black text-white">Reset Account Access</h2>
          </div>

          <div className="z-10 my-auto relative">
            <img
              src={popcornGirlImage}
              alt="FLIXIT Popcorn Girl Character"
              className="max-h-80 object-contain filter drop-shadow-[0_20px_30px_rgba(121,40,202,0.4)] animate-float"
            />
          </div>

          <div className="z-10 w-full glass-panel p-4 border-white/10 text-center">
            <p className="text-xs text-gray-300 font-semibold">
              Enter your registered email address to receive a secure 6-digit OTP verification code.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
