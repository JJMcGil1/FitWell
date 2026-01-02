/**
 * TitleBar Component
 *
 * Top bar for the main content area with logo.
 * Provides a drag region for the window and subtle visual separation.
 * Only spans the main content area (not the sidebar).
 */

import React from 'react';
import logoFull from '../../../assets/fitwell-logo.svg';

export const TitleBar: React.FC = () => {
  return (
    <header className="drag-region h-12 flex items-center px-6 bg-gray-100/80 border-b border-gray-200/60 shadow-sm flex-shrink-0">
      {/* Logo */}
      <img src={logoFull} alt="FitWell" className="h-7" draggable={false} />
    </header>
  );
};
