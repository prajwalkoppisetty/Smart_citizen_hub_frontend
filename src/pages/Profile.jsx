import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { User, Lock, ShieldCheck, Mail, Phone, MapPin, Camera } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useNotification();

  // Profile Edit States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [ward, setWard] = useState(user?.ward || 'Ward 12, Park Circus');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

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
        addToast('Profile photo preview updated! Click Save to apply.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      addToast('Name and Email are required fields.', 'warning');
      return;
    }
    
    setIsUpdating(true);
    const result = await updateProfile({ name, email, phone, ward, profileImage });
    setIsUpdating(false);
    
    if (result.success) {
      addToast('Account profile information updated successfully!', 'success');
    } else {
      addToast(result.error || 'Failed to update profile details.', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Please complete all password input fields.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    setIsChangingPass(true);
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsChangingPass(false);
    
    addToast('Security password successfully updated!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="text-left border-b border-slate-100 pb-5">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Account Settings</span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
          Profile Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Inspect e-governance ID credentials, customize phone notifications, or update credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Edit Info */}
        <div className="lg:col-span-8">
          <Card className="bg-white border-slate-100 rounded-3xl p-6 text-left space-y-6 flex flex-col justify-between h-full">
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <h3 className="font-display font-extrabold text-sm text-slate-800 border-b border-slate-50 pb-2">
                Personal Information
              </h3>

              {/* Profile Image Uploader */}
              <div className="flex items-center space-x-5 py-2">
                <div className="relative group cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300 group-hover:border-blue-500 group-hover:ring-4 group-hover:ring-blue-50">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-slate-400 text-xs font-extrabold uppercase">
                        {user?.avatar || 'US'}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-2xl"
                    title="Change profile picture"
                  />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Avatar</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Click image box to upload new official profile photo. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <Input
                  id="name"
                  label="Official Registered Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="h-4 w-4 text-slate-400" />}
                />

                {/* Email */}
                <Input
                  id="email"
                  label="Account Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <Input
                  id="phone"
                  label="Mobile updates terminal"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
                />

                {/* Ward Area */}
                {user?.role === 'Citizen' ? (
                  <div className="flex flex-col space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">
                      Residential Ward Sector
                    </label>
                    <select
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="Ward 12, Park Circus">Ward 12, Park Circus</option>
                      <option value="Ward 4, Sector B">Ward 4, Sector B</option>
                      <option value="Ward 9, Green Avenue">Ward 9, Green Avenue</option>
                    </select>
                  </div>
                ) : (
                  <Input
                    id="dept"
                    label="Assigned Department"
                    type="text"
                    value={user?.department || user?.division || 'Municipal Operations Division'}
                    disabled
                  />
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="px-6"
                  isLoading={isUpdating}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>

          </Card>
        </div>

        {/* Right Column: Update Password */}
        <div className="lg:col-span-4">
          <Card className="bg-white border-slate-100 rounded-3xl p-6 shadow-sm text-left h-full space-y-6">
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-800 border-b border-slate-50 pb-2">
                Security Password
              </h3>

              {/* Current Password */}
              <Input
                id="currPass"
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              {/* New Password */}
              <Input
                id="newPass"
                label="New Password"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              {/* Confirm Password */}
              <Input
                id="confPass"
                label="Verify New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-center text-blue-600 hover:text-blue-700 bg-blue-50/50 border-none font-bold"
                  isLoading={isChangingPass}
                >
                  Update Credentials
                </Button>
              </div>
            </form>

          </Card>
        </div>

      </div>

    </div>
  );
}
