/**
 * SettingsPage
 *
 * Application settings and preferences.
 * Includes full user/profile management with first/last name, birthday, photo.
 */

import React, { useState, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { useThemeStore } from '../stores/themeStore';

// Avatar color options
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
];

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => (
  <div className="py-6 first:pt-0">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, description, action, onClick, danger }) => (
  <div
    className={`
      flex items-center gap-4 p-3 -mx-3 rounded-lg
      ${onClick ? 'hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors duration-150' : ''}
    `}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
  >
    <div className={`w-9 h-9 rounded-lg ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-neutral-700'} flex items-center justify-center ${danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span className={`text-sm font-medium ${danger ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'} block`}>{label}</span>
      {description && (
        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{description}</span>
      )}
    </div>
    {action && (
      <div className="flex-shrink-0">
        {action}
      </div>
    )}
  </div>
);

// Helper to get initials from first/last name
const getInitials = (firstName?: string, lastName?: string) => {
  const first = (firstName || '').charAt(0).toUpperCase();
  const last = (lastName || '').charAt(0).toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  return '?';
};

export const SettingsPage: React.FC = () => {
  const { users, currentUser, createUser, updateUser, deleteUser, switchUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  // Modal states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingProfile, setIsAddingProfile] = useState(false);

  // Edit form states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editColor, setEditColor] = useState('');

  // Add form states
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const editFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const appVersion = '1.0.0';

  // Open edit modal
  const handleOpenEdit = () => {
    if (currentUser) {
      setEditFirstName(currentUser.firstName || '');
      setEditLastName(currentUser.lastName || '');
      setEditBirthday(currentUser.birthday || '');
      setEditPhoto(currentUser.profilePhoto || null);
      setEditColor(currentUser.avatarColor);
      setIsEditingProfile(true);
    }
  };

  // Handle photo upload for edit
  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo upload for add
  const handleAddPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!currentUser || !editFirstName.trim() || !editLastName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateUser(currentUser.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        birthday: editBirthday || undefined,
        profilePhoto: editPhoto || undefined,
        avatarColor: editColor,
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new profile
  const handleAddProfile = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;

    setIsSubmitting(true);
    try {
      const newUser = await createUser({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        birthday: newBirthday || undefined,
        profilePhoto: newPhoto || undefined,
        avatarColor: newColor,
      });
      setIsAddingProfile(false);
      setNewFirstName('');
      setNewLastName('');
      setNewBirthday('');
      setNewPhoto(null);
      setNewColor(AVATAR_COLORS[0]);
      // Switch to the new user
      await switchUser(newUser.id);
    } catch (err) {
      console.error('Failed to create profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete profile
  const handleDeleteProfile = async (userId: string, userName: string) => {
    const isLastProfile = users.length <= 1;
    const message = isLastProfile
      ? `Are you sure you want to delete "${userName}"? This is your only profile — deleting it will reset the app and show the welcome screen.`
      : `Are you sure you want to delete "${userName}"? This will permanently delete all their data.`;

    if (window.confirm(message)) {
      try {
        await deleteUser(userId);
      } catch (err) {
        console.error('Failed to delete profile:', err);
        alert('Failed to delete profile. Please try again.');
      }
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your preferences
        </p>
      </div>

      {/* Settings content */}
      <div className="card divide-y divide-gray-100 dark:divide-neutral-700">
        {/* Profiles Section */}
        <div className="px-5">
          <SettingsSection title="Profiles" description="Manage who uses FitWell on this device">
            {/* Current profile */}
            {currentUser && (
              <div className="flex items-center gap-4 p-3 -mx-3 rounded-lg bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
                {currentUser.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {getInitials(currentUser.firstName, currentUser.lastName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-xs text-brand-600 dark:text-brand-400 block mt-0.5">Current profile</span>
                </div>
                <button
                  onClick={handleOpenEdit}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium px-3 py-1.5 rounded-md hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Other profiles */}
            {users.filter(u => u.id !== currentUser?.id).map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={() => switchUser(user.id)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
                >
                  Switch
                </button>
                <button
                  onClick={() => handleDeleteProfile(user.id, user.name)}
                  className="text-sm text-red-500 hover:text-red-600 font-medium p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete profile"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add profile button */}
            <button
              onClick={() => setIsAddingProfile(true)}
              className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors w-full text-left"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-gray-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Add new profile</span>
            </button>
          </SettingsSection>
        </div>

        {/* Appearance Section */}
        <div className="px-5">
          <SettingsSection title="Appearance" description="Customize how FitWell looks">
            <SettingsRow
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
              label="Theme"
              description={theme === 'system' ? 'System default' : theme === 'dark' ? 'Dark mode' : 'Light mode'}
              action={
                <select
                  className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-neutral-700 border-0 rounded-md py-1.5 px-3 focus:ring-2 focus:ring-brand-500/30"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              }
            />
          </SettingsSection>
        </div>

        {/* About Section */}
        <div className="px-5">
          <SettingsSection title="About">
            <SettingsRow
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Version"
              description={`FitWell v${appVersion}`}
            />
          </SettingsSection>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Edit Profile</h3>

              {/* Avatar preview */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {editPhoto ? (
                    <div className="relative">
                      <img
                        src={editPhoto}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditPhoto(null);
                          if (editFileInputRef.current) editFileInputRef.current.value = '';
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-colors duration-200"
                      style={{ backgroundColor: editColor }}
                    >
                      {getInitials(editFirstName, editLastName)}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload photo button */}
              <div className="flex justify-center mb-6">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoUpload}
                  className="hidden"
                  id="edit-photo-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="edit-photo-upload"
                  className="text-sm text-brand-500 hover:text-brand-600 cursor-pointer font-medium transition-colors"
                >
                  {editPhoto ? 'Change photo' : 'Upload photo'}
                </label>
              </div>

              {/* Name inputs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="input"
                    maxLength={20}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="input"
                    maxLength={20}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Birthday */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Birthday <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  className="input"
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Color picker - only show if no photo */}
              {!editPhoto && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Avatar color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        disabled={isSubmitting}
                        className={`w-10 h-10 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none ${editColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 dark:ring-offset-neutral-800 scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Danger Zone - Delete Profile */}
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-neutral-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Danger Zone</p>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      setIsEditingProfile(false);
                      handleDeleteProfile(currentUser.id, currentUser.name);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete this profile
                </button>
                {users.length <= 1 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    This is your only profile. Deleting it will reset the app.
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-700">
              <button
                onClick={() => setIsEditingProfile(false)}
                disabled={isSubmitting}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editFirstName.trim() || !editLastName.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Profile Modal */}
      {isAddingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Add New Profile</h3>

              {/* Avatar preview */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {newPhoto ? (
                    <div className="relative">
                      <img
                        src={newPhoto}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewPhoto(null);
                          if (addFileInputRef.current) addFileInputRef.current.value = '';
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-colors duration-200"
                      style={{ backgroundColor: newColor }}
                    >
                      {getInitials(newFirstName, newLastName)}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload photo button */}
              <div className="flex justify-center mb-6">
                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAddPhotoUpload}
                  className="hidden"
                  id="add-photo-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="add-photo-upload"
                  className="text-sm text-brand-500 hover:text-brand-600 cursor-pointer font-medium transition-colors"
                >
                  {newPhoto ? 'Change photo' : 'Upload photo'}
                </label>
              </div>

              {/* Name inputs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="First"
                    className="input"
                    maxLength={20}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Last"
                    className="input"
                    maxLength={20}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Birthday */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Birthday <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={newBirthday}
                  onChange={(e) => setNewBirthday(e.target.value)}
                  className="input"
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Color picker - only show if no photo */}
              {!newPhoto && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Avatar color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        disabled={isSubmitting}
                        className={`w-10 h-10 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none ${newColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 dark:ring-offset-neutral-800 scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-700">
              <button
                onClick={() => {
                  setIsAddingProfile(false);
                  setNewFirstName('');
                  setNewLastName('');
                  setNewBirthday('');
                  setNewPhoto(null);
                  setNewColor(AVATAR_COLORS[0]);
                }}
                disabled={isSubmitting}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProfile}
                disabled={isSubmitting || !newFirstName.trim() || !newLastName.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
