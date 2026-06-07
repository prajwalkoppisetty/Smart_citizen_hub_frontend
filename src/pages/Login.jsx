import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Landmark, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    const tempErrors = {};
    if (!email) tempErrors.email = 'E-mail is required';
    if (!password) tempErrors.password = 'Password is required';
    
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    // Keep the previous error visible during loading state
    setErrors((prev) => ({ ...prev, email: null, password: null }));
    setIsSubmitting(true);
    const result = await login(email, password, role);
    setIsSubmitting(false);

    if (result.success) {
      setErrors({});
      addToast(`Welcome back, ${result.user.name}!`, 'success');
      navigate('/dashboard');
    } else {
      setErrors({ api: result.error });
      addToast(result.error, 'error', 7000); // Display for 7 seconds so the user has plenty of time to read it
    }
  };



  return (
    <div className="bg-slate-50/50 flex flex-col justify-center py-20 sm:px-6 lg:px-8 font-sans relative overflow-hidden animate-fade-in">
      
      {/* Background Ornaments */}
      <div className="absolute top-0 right-1/4 h-80 w-80 -z-10 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 -z-10 rounded-full bg-indigo-100/30 blur-3xl" />

      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 select-none">
        <Link 
          to="/" 
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform"
        >
          <Landmark className="h-5 w-5" />
        </Link>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
          Access Smart Citizen Hub
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-center space-x-1">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>E-Governance Security Node</span>
        </p>
      </div>

      {/* Main card box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 animate-slide-up">
        <div className="bg-white border border-slate-100 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-100 space-y-6">
          
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            {errors.api && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-xl text-center">
                {errors.api}
              </div>
            )}

            {/* Role Select Input */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="font-sans text-xs font-bold text-slate-700 tracking-wide">
                Select Portal Access Mode
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="Citizen">Citizen Portal</option>
                <option value="Local Officer">Local Officer Desk</option>
                <option value="Municipal Officer">Municipal HQ</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>

            {/* Email field */}
            <Input
              id="email"
              label="Official E-mail / Citizen Account"
              type="email"
              placeholder="e.g. name@smartcitizen.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password field */}
            <Input
              id="password"
              label="Security Credentials"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            {/* Links and Forgot password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                />
                <label htmlFor="remember-me" className="ml-2 font-medium text-slate-600">
                  Save credentials
                </label>
              </div>
              <a href="#forgot" className="font-semibold text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Sign In to System
            </Button>
          </form>



          {/* Direct Signup Link */}
          <div className="text-center text-xs text-slate-600">
            Don't have a citizen account?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
              Create an Account
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
