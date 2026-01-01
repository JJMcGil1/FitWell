/**
 * UserSwitcher Component
 *
 * Dropdown in the title bar to switch between users (Justin/Aimee).
 * Designed for Apple-like feel: clean, minimal, with smooth animations.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';

export const UserSwitcher: React.FC = () => {
  const { users, currentUser, switchUser } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (!currentUser) return null;

  const handleSelect = async (userId: string) => {
    if (userId !== currentUser.id) {
      await switchUser(userId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative no-drag">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors duration-150"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm"
          style={{ backgroundColor: currentUser.avatarColor }}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-white">
          {currentUser.name}
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-gray-100 py-1 z-50 animate-slide-down"
          role="listbox"
        >
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors duration-100 ${
                user.id === currentUser.id ? 'bg-gray-50' : ''
              }`}
              role="option"
              aria-selected={user.id === currentUser.id}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <span className="flex-1 text-sm font-medium text-gray-700">
                {user.name}
              </span>

              {/* Check mark for selected */}
              {user.id === currentUser.id && (
                <svg
                  className="w-4 h-4 text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
