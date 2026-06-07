import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Landmark, ArrowRight, ShieldCheck, Camera } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Signup() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { addToast } = useNotification();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ward, setWard] = useState('Ward 12, Park Circus');
  const [profileImage, setProfileImage] = useState('');
  const [role, setRole] = useState('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const getRoleLabel = (r) => {
    switch (r) {
      case 'citizen': return 'Citizen';
      case 'local_officer': return 'Local Officer';
      case 'field_officer': return 'Field Officer';
      case 'municipal_officer': return 'Municipal Officer';
      case 'admin': return 'Admin';
      default: return 'Citizen';
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Profile image must be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        addToast('Profile image loaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    const tempErrors = {};
    if (!fullName) tempErrors.fullName = 'Full Name is required';
    if (!email) tempErrors.email = 'E-mail is required';
    if (!phone) {
      tempErrors.phone = 'Phone number is required';
    } else if (phone.replace(/\D/g, '').length < 10) {
      tempErrors.phone = 'Phone number must be at least 10 digits';
    }
    if (!password) tempErrors.password = 'Password is required';
    if (password.length < 6) tempErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) tempErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    // Clear only visual validation errors, keeping previous API errors visible during loading
    setErrors((prev) => ({ 
      ...prev, 
      fullName: null, 
      email: null, 
      phone: null, 
      password: null, 
      confirmPassword: null 
    }));
    setIsSubmitting(true);

    // Console log the exact payload that maps to your Mongoose User schema
    console.log("%c=== MONGOOSE USER SCHEMA SIGNUP PAYLOAD ===", "color: #2563eb; font-weight: bold; font-size: 12px;");
    console.log({
      name: fullName,
      email: email,
      password: password,
      phonenumber: phone,
      role: role,
      isVerified: false,
      profileImage: profileImage || "",
      ward: role === 'citizen' || role === 'local_officer' ? ward : null,
      reputationScore: 0,
      isActive: true
    });

    // Send both the UI-friendly keys and the exact Mongoose database keys
    const result = await register({ 
      fullName, 
      email, 
      phone, 
      ward: role === 'citizen' || role === 'local_officer' ? ward : null,
      name: fullName,
      phonenumber: phone,
      password,
      role: role,
      profileImage
    });
    setIsSubmitting(false);

    if (result.success) {
      setErrors({});
      addToast(`Account created successfully! Welcome, ${fullName}`, 'success');
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

      {/* Brand logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 select-none">
        <Link 
          to="/" 
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform"
        >
          <Landmark className="h-5 w-5" />
        </Link>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
          Create {getRoleLabel(role)} Account
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-center space-x-1">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Gov-Tech Portal Registration</span>
        </p>
      </div>

      {/* Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 animate-slide-up">
        <div className="bg-white border border-slate-100 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-100 space-y-5">
          
          <form className="space-y-4" onSubmit={handleSignupSubmit}>
            {errors.api && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-xl text-center">
                {errors.api}
              </div>
            )}

            {/* Profile Image Upload Circle */}
            <div className="flex flex-col items-center justify-center pb-4 pt-1">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner transition-all duration-300 group-hover:border-blue-500 group-hover:ring-4 group-hover:ring-blue-50">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1 text-slate-400">
                      <Camera className="h-6 w-6 transition-colors group-hover:text-blue-500" />
                      <span className="text-[10px] font-bold tracking-wide uppercase group-hover:text-blue-600">Add Photo</span>
                    </div>
                  )}
                </div>
                {/* Overlay on hover when image exists */}
                {profileImage && (
                  <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                )}
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                  title="Upload profile picture"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-widest">
                Official Avatar (Max 2MB)
              </p>
            </div>

            {/* Full Name */}
            <Input
              id="fullName"
              label={role === 'citizen' ? 'Citizen Full Name' : 'Official Full Name'}
              type="text"
              placeholder="e.g. Prajwal Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />

            {/* Email */}
            <Input
              id="email"
              label="Active E-mail Address"
              type="email"
              placeholder="e.g. prajwal@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            {/* Phone */}
            <Input
              id="phone"
              label="Mobile Number (SMS Updates)"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
            />

            {/* Role Select */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="font-sans text-xs font-bold text-slate-700 tracking-wide">
                Portal User Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="citizen">Citizen</option>
                <option value="local_officer">Local Officer</option>
                <option value="field_officer">Field Officer</option>
                <option value="municipal_officer">Municipal Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Ward Select */}
            {(role === 'citizen' || role === 'local_officer') && (
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="font-sans text-xs font-bold text-slate-700 tracking-wide">
                  {role === 'citizen' ? 'Residential Municipal Ward' : 'Assigned Jurisdiction Ward'}
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Ward 12, Park Circus">Ward 12, Park Circus</option>
                  <option value="Ward 4, Sector B">Ward 4, Sector B</option>
                  <option value="Ward 9, Green Avenue">Ward 9, Green Avenue</option>
                  <option value="Ward 2, Gandhi Nagar">Ward 2, Gandhi Nagar</option>
                </select>
              </div>
            )}

            {/* Password */}
            <Input
              id="password"
              label="Account Password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            {/* Confirm Password */}
            <Input
              id="confirmPassword"
              label="Verify Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Register {getRoleLabel(role)} Portal
            </Button>
          </form>

          {/* Login Redirection Link */}
          <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In Here
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
