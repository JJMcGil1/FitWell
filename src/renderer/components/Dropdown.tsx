/**
 * Dropdown Component
 *
 * A polished, accessible dropdown menu with Apple-style design.
 * Features: keyboard navigation, click outside to close, checkmarks for selection.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
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
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
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
  }, [disabled, isOpen, highlightedIndex, options, onChange]);

  const handleSelect = (option: DropdownOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 mt-1.5 z-50
            min-w-[140px] py-1
            bg-white/95 dark:bg-neutral-800/95
            backdrop-blur-xl
            rounded-lg
            shadow-lg shadow-black/10 dark:shadow-black/30
            border border-gray-200/50 dark:border-neutral-600/50
            animate-dropdown-in
          "
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
        </div>
      )}
    </div>
  );
}

export default Dropdown;
