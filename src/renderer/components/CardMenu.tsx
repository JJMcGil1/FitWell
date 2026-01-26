/**
 * CardMenu Component
 *
 * A three-dot vertical menu that appears on hover over cards.
 * Opens a portal-based dropdown with action items (Edit, Delete, etc.).
 *
 * Uses viewport-aware positioning via useLayoutEffect:
 *  1. Portal mounts invisibly (visibility:hidden) so the browser lays it out
 *  2. useLayoutEffect fires synchronously BEFORE paint, measures the menu's
 *     actual dimensions, and computes a clamped position against the viewport
 *  3. Browser paints only the final correct position — zero flicker
 *
 * Positioning strategy:
 *  - Preferred: below trigger, right edge aligned to trigger's right edge
 *  - Vertical flip: if menu overflows viewport bottom → render above trigger
 *  - Horizontal clamp: keep 8px min padding from viewport edges
 */

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { BsThreeDotsVertical } from 'react-icons/bs';

export interface CardMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface CardMenuProps {
  items: CardMenuItem[];
  className?: string;
}

const VIEWPORT_PAD = 8;  // min px from any viewport edge
const TRIGGER_GAP = 4;   // gap between trigger and menu

/**
 * Compute a viewport-safe { top, left } for the menu portal.
 * Requires both elements to already be in the DOM so we can measure.
 */
function computeSafePosition(
  triggerEl: HTMLElement,
  menuEl: HTMLElement,
): { top: number; left: number } {
  const tr = triggerEl.getBoundingClientRect();
  const mr = menuEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // --- Vertical ---
  // Prefer below trigger
  let top = tr.bottom + TRIGGER_GAP;
  // Flip above if it would overflow the bottom
  if (top + mr.height > vh - VIEWPORT_PAD) {
    top = tr.top - TRIGGER_GAP - mr.height;
  }
  // Final clamp: never above the viewport
  top = Math.max(VIEWPORT_PAD, top);

  // --- Horizontal ---
  // Prefer right-aligned to trigger's right edge
  let left = tr.right - mr.width;
  // Clamp: don't overflow left or right
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - mr.width));

  return { top, left };
}

export const CardMenu: React.FC<CardMenuProps> = ({ items, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Phase 2: measure + position (runs synchronously before paint) ──
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current || !triggerRef.current) return;
    const pos = computeSafePosition(triggerRef.current, menuRef.current);
    setMenuStyle({ top: pos.top, left: pos.left, visibility: 'visible', opacity: 1 });
  }, [isOpen]);

  // Reset style when menu closes
  useEffect(() => {
    if (!isOpen) setMenuStyle({});
  }, [isOpen]);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!isOpen) return;

    const reposition = () => {
      if (!menuRef.current || !triggerRef.current) return;
      const pos = computeSafePosition(triggerRef.current, menuRef.current);
      setMenuStyle({ top: pos.top, left: pos.left, visibility: 'visible', opacity: 1 });
    };

    window.addEventListener('scroll', reposition, true); // capture = true to catch inner scrolls
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  // Close on click outside (portal-aware)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleItemClick = (item: CardMenuItem) => {
    setIsOpen(false);
    item.onClick();
  };

  // ── Phase 1: mount invisibly so layout runs, then useLayoutEffect repositions ──
  const menu = isOpen && createPortal(
    <div
      ref={menuRef}
      className="
        fixed z-[9999]
        py-1
        bg-white/95 dark:bg-neutral-800/95
        backdrop-blur-xl
        rounded-lg
        shadow-lg shadow-black/10 dark:shadow-black/30
        border border-gray-200/50 dark:border-neutral-600/50
        animate-dropdown-in
        min-w-[140px]
      "
      style={{
        // Start invisible at origin — useLayoutEffect will set real position before paint
        visibility: 'hidden',
        opacity: 0,
        top: 0,
        left: 0,
        ...menuStyle,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2
            text-[13px] font-medium select-none
            transition-colors duration-75
            ${item.variant === 'danger'
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }
          `}
        >
          {item.icon && (
            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`
          p-1.5 rounded-lg
          text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
          hover:bg-gray-100 dark:hover:bg-neutral-700
          transition-all duration-150
          opacity-0 group-hover:opacity-100
          ${isOpen ? '!opacity-100' : ''}
          ${className}
        `}
        title="More actions"
      >
        <BsThreeDotsVertical className="w-4 h-4" />
      </button>
      {menu}
    </>
  );
};

export default CardMenu;
