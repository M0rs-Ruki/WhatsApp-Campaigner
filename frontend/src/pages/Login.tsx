import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, X, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Forgot Password Modal
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login successful
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        navigate('/home');
      } else {
        // Login failed - use backend error message
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      // Network error
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">
      
      {/* Login Container */}
      <div className="w-full max-w-md">
        
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-block p-6 bg-green-500/30 backdrop-blur-md rounded-3xl border border-white/50 shadow-2xl mb-4">
            <h1 className="text-4xl font-bold text-black">WhatsApp</h1>
            <h2 className="text-2xl font-semibold text-black">Campaign Manager</h2>
          </div>
        </div>

        {/* Main Card - Toggle between Login and Sign Up */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-8">
          
          {!showSignUp ? (
            // LOGIN FORM
            <>
              <h3 className="text-2xl font-bold text-black mb-6 text-center">Login to Your Account</h3>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100/60 backdrop-blur-sm border border-red-300 rounded-xl">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-black mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-2 border-green-500 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm font-semibold text-black">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-semibold text-black hover:text-green-600 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold text-lg rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-black">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="font-bold text-green-600 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </>
          ) : (
            // SIGN UP / CONTACT SECTION
            <>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowSignUp(false)}
                  className="flex items-center gap-2 text-black hover:text-green-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Back to Login</span>
                </button>
              </div>

              <h3 className="text-2xl font-bold text-black mb-4 text-center">Want to Sign Up?</h3>
              <p className="text-center text-black mb-6">
                Contact our team to create an account
              </p>

              {/* Contact Information Cards */}
              <div className="space-y-4">
                
                {/* Email Contact */}
                <div className="p-5 bg-gradient-to-r from-blue-50/80 to-blue-100/80 backdrop-blur-sm rounded-2xl border-2 border-blue-300 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Mail className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-700 uppercase">Email Us</p>
                      <a
                        href="mailto:support@example.com"
                        className="text-lg font-bold text-blue-700 hover:underline"
                      >
                        support@example.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone Contact */}
                <div className="p-5 bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-sm rounded-2xl border-2 border-green-300 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <Phone className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-700 uppercase">Call Us</p>
                      <a
                        href="tel:+911234567890"
                        className="text-lg font-bold text-green-700 hover:underline"
                      >
                        +91 12345 67890
                      </a>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-yellow-50/80 backdrop-blur-sm rounded-xl border border-yellow-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Note:</span> Our team will verify your details and create an account for you within 24 hours.
                  </p>
                </div>
              </div>

              {/* Contact Button */}
              <div className="mt-6">
                <a
                  href="mailto:support@example.com"
                  className="block w-full px-6 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold text-lg text-center rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all"
                >
                  Send Email
                </a>
              </div>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <p className="text-sm text-black">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowSignUp(false)}
                    className="font-bold text-green-600 hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-orange-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black">Forgot Password?</h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              {/* Alert Icon */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <AlertCircle className="w-12 h-12 text-orange-600" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-300">
                  <h4 className="text-lg font-bold text-orange-800 mb-2">Contact Your Admin or Reseller</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    To reset your password, please contact your <span className="font-bold">Admin</span> or <span className="font-bold">Reseller</span>. 
                    They have the authority to change your password.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-300">
                  <h4 className="text-sm font-bold text-blue-800 mb-2">After Password Reset:</h4>
                  <p className="text-sm text-gray-700">
                    Once your password is changed, you can update it yourself by going to:
                  </p>
                  <p className="text-sm font-bold text-blue-700 mt-2">
                    Dashboard → Manage Business Profile
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
