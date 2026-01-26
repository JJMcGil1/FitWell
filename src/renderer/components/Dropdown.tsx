/**
 * Dropdown Component
 *
 * A polished, accessible dropdown menu with Apple-style design.
 * Features: keyboard navigation, click outside to close, checkmarks for selection.
 *
 * Uses a React Portal so the menu escapes overflow:hidden/auto ancestors
 * (e.g. modals with scrollable content). The menu is rendered at document.body
 * and positioned with fixed coordinates from the trigger's bounding rect.
 *
 * Viewport-aware positioning via useLayoutEffect:
 *  1. Portal mounts invisibly so the browser computes its layout
 *  2. useLayoutEffect fires synchronously before paint, measures the menu,
 *     and clamps position to viewport bounds
 *  3. Browser paints only the final correct position — zero flicker
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi2';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const VIEWPORT_PAD = 8;
const TRIGGER_GAP = 6;

/**
 * Compute a viewport-safe position for the dropdown menu.
 * Right-aligns to trigger by default, flips vertically if needed.
 */
function computeSafePosition(
  triggerEl: HTMLElement,
  menuEl: HTMLElement,
): { top: number; left: number; minWidth: number } {
  const tr = triggerEl.getBoundingClientRect();
  const mr = menuEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minWidth = Math.max(140, tr.width);

  // Vertical: prefer below, flip above if overflow
  let top = tr.bottom + TRIGGER_GAP;
  if (top + mr.height > vh - VIEWPORT_PAD) {
    top = tr.top - TRIGGER_GAP - mr.height;
  }
  top = Math.max(VIEWPORT_PAD, top);

  // Horizontal: prefer right-aligned to trigger's right edge
  let left = tr.right - Math.max(mr.width, minWidth);
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - Math.max(mr.width, minWidth)));

  return { top, left, minWidth };
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // ── Viewport-aware positioning (before paint) ──
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current || !triggerRef.current) return;
    const pos = computeSafePosition(triggerRef.current, menuRef.current);
    setMenuStyle({
      top: pos.top,
      left: pos.left,
      minWidth: pos.minWidth,
      visibility: 'visible',
      opacity: 1,
    });
  }, [isOpen]);

  // Reset style on close
  useEffect(() => {
    if (!isOpen) setMenuStyle({});
  }, [isOpen]);

  // Open handler
  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close on click outside (portal-aware: check both trigger and menu)
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

  // Reposition on scroll / resize while open (covers modal scrolling)
  useEffect(() => {
    if (!isOpen) return;

    const reposition = () => {
      if (!menuRef.current || !triggerRef.current) return;
      const pos = computeSafePosition(triggerRef.current, menuRef.current);
      setMenuStyle({
        top: pos.top,
        left: pos.left,
        minWidth: pos.minWidth,
        visibility: 'visible',
        opacity: 1,
      });
    };

    window.addEventListener('scroll', reposition, true); // capture phase catches inner scrolls
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, options, value]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        } else {
          openMenu();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [disabled, isOpen, highlightedIndex, options, onChange, openMenu]);

  const handleSelect = (option: DropdownOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  // The menu rendered via portal — mounts invisibly, useLayoutEffect positions before paint
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
      "
      style={{
        visibility: 'hidden',
        opacity: 0,
        top: 0,
        left: 0,
        minWidth: 140,
        ...menuStyle,
      }}
      role="listbox"
      aria-activedescendant={highlightedIndex >= 0 ? `dropdown-option-${highlightedIndex}` : undefined}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isHighlighted = index === highlightedIndex;

        return (
          <button
            key={option.value}
            id={`dropdown-option-${index}`}
            type="button"
            onClick={() => handleSelect(option)}
            onMouseEnter={() => setHighlightedIndex(index)}
            onMouseLeave={() => setHighlightedIndex(-1)}
            className={`
              w-full flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md
              text-[13px] font-medium select-none
              transition-colors duration-75
              ${isHighlighted ? 'bg-gray-100 dark:bg-neutral-700' : ''}
              ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}
            `}
            style={{ width: 'calc(100% - 8px)' }}
            role="option"
            aria-selected={isSelected}
          >
            {/* Checkmark */}
            <span className="w-4 flex-shrink-0 text-brand-500 dark:text-brand-400">
              {isSelected && (
                <HiOutlineCheck className="w-4 h-4" />
              )}
            </span>

            {/* Label */}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2 min-w-[100px]
          text-sm font-medium rounded-lg py-2 px-3
          bg-gray-100/80 dark:bg-neutral-700/80
          text-gray-700 dark:text-gray-200
          hover:bg-gray-200/80 dark:hover:bg-neutral-600/80
          focus:outline-none
          select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <HiOutlineChevronDown
          className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Portal-rendered menu */}
      {menu}
    </div>
  );
}

export default Dropdown;
