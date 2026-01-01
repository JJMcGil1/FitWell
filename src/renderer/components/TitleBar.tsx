/**
 * TitleBar Component
 *
 * Top bar for the main content area with user switcher.
 * Matches the sidebar dark theme for a unified header.
 */

import React from 'react';
import { UserSwitcher } from './UserSwitcher';

export const TitleBar: React.FC = () => {
  return (
    <header className="drag-region h-14 flex items-center justify-end px-4 bg-slate-800">
      {/* User Switcher */}
      <UserSwitcher />
    </header>
  );
};
