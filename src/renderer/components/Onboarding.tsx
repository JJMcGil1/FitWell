/**
 * Onboarding Component
 *
 * Shown on first launch when no users exist.
 * Streamlined profile creation: name + avatar.
 * Birthday can be added later in Settings if needed.
 */

import React, { useState, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { useThemeStore } from '../stores/themeStore';
import logoFull from '../../../assets/fitwell-logo.svg';

// Theme options with icons
const THEME_OPTIONS = [
  {
    value: 'light' as const,
    label: 'Light',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  },
  {
    value: 'system' as const,
    label: 'System',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
  },
];

// Curated color palette for avatars
const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b', // Slate
];

export const Onboarding: React.FC = () => {
  const { createUser, switchUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initials from first and last name
  const getInitials = () => {
    const firstInitial = firstName.trim().charAt(0).toUpperCase();
    const lastInitial = lastName.trim().charAt(0).toUpperCase();
    if (firstInitial && lastInitial) return `${firstInitial}${lastInitial}`;
    if (firstInitial) return firstInitial;
    return '?';
  };

  // Handle file upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfilePhoto(result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Remove profile photo
  const removePhoto = () => {
    setProfilePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName) {
      setError('Please enter your first name');
      return;
    }
    if (!trimmedLastName) {
      setError('Please enter your last name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const newUser = await createUser({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        profilePhoto: profilePhoto || undefined,
        avatarColor,
      });
      // Switch to the new user (this updates currentUser in store)
      await switchUser(newUser.id);
    } catch (err) {
      console.error('[Onboarding] Failed to create user:', err);
      setError('Failed to create profile. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-900 p-8 relative transition-colors duration-300">
      {/* Drag region for macOS window controls - allows window dragging */}
      <div className="absolute top-0 left-0 right-0 h-14 drag-region" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoFull} alt="FitWell" className="h-12" draggable={false} />
        </div>

        {/* Welcome card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-neutral-700 p-8 transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to FitWell
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Let's set up your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name inputs - side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                  className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                  autoFocus
                  disabled={isCreating}
                  maxLength={20}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                  className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                  disabled={isCreating}
                  maxLength={20}
                />
              </div>
            </div>

            {/* Avatar section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile photo or avatar
              </label>

              {/* Preview */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {profilePhoto ? (
                    <div className="relative">
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                        aria-label="Remove photo"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-all duration-200"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials()}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload button */}
              <div className="flex justify-center mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={isCreating}
                />
                <label
                  htmlFor="photo-upload"
                  className="text-sm text-brand-500 hover:text-brand-600 cursor-pointer font-medium transition-colors"
                >
                  {profilePhoto ? 'Change photo' : 'Upload a photo'}
                </label>
              </div>

              {/* Color grid - only show if no photo */}
              {!profilePhoto && (
                <>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">Or choose an avatar color</p>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        disabled={isCreating}
                        className={`
                          w-10 h-10 rounded-full transition-all duration-150
                          hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-500 dark:ring-offset-neutral-800
                          ${avatarColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-neutral-800 scale-110' : ''}
                        `}
                        style={{ backgroundColor: color }}
                        aria-label={`Select ${color} color`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                App theme
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-neutral-700 rounded-lg">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    disabled={isCreating}
                    className={`
                      flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150
                      ${theme === option.value
                        ? 'bg-white dark:bg-neutral-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-600/50'
                      }
                    `}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isCreating || !firstName.trim() || !lastName.trim()}
              className="w-full py-3 text-base font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating profile...
                </span>
              ) : (
                'Get Started'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
