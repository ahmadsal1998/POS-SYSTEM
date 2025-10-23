

import React, { useState } from 'react';
import { NavItem } from '../types';
import { AR_LABELS, NAV_ITEMS, ChevronDownIcon } from '../constants';

interface SidebarProps {
  activePath: string;
  setActivePath: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePath, setActivePath }) => {
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

  const toggleDropdown = (id: number) => {
    setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper function to determine if a nav item (including dropdowns) should be visually active.
  const isItemActive = (item: NavItem): boolean => {
    // A dropdown is active if its own path matches or if any of its children's paths match.
    if (item.isDropdown) {
      return item.path === activePath || (item.dropdownItems?.some(sub => sub.path === activePath) ?? false);
    }
    // A regular item is active if its path matches.
    return item.path === activePath;
  };

  return (
    <div className="fixed top-0 right-0 h-screen w-64 bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-200 flex flex-col shadow-lg overflow-y-auto z-50">
      {/* Logo */}
      <div className="p-4 flex items-center justify-center border-b border-gray-700 dark:border-gray-800">
        <span className="text-xl font-bold text-orange-500">PoshPointHub</span>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث..."
            className="w-full pl-3 pr-10 py-2 rounded-md bg-gray-700 dark:bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <svg className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-2">
        <ul>
          {NAV_ITEMS.map((item) => {
            const itemIsActive = isItemActive(item);
            return (
              <li key={item.id} className="mb-1">
                <div
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors duration-200
                  ${itemIsActive ? 'bg-orange-600 text-white' : 'hover:bg-gray-700 dark:hover:bg-gray-700'}`}
                  onClick={() => {
                    if (item.isDropdown) {
                      toggleDropdown(item.id);
                    } else {
                      setActivePath(item.path);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <div className={`ml-3 ${itemIsActive ? 'text-white' : 'text-gray-400'}`}>{item.icon}</div>
                    <span className={`${itemIsActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  </div>
                  {item.isDropdown && (
                    // The ChevronDownIcon now correctly accepts the className prop
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${openDropdowns[item.id] ? 'rotate-180' : ''}`} />
                  )}
                </div>
                {item.isDropdown && openDropdowns[item.id] && (
                  <ul className="pr-6 mt-1 space-y-1">
                    {item.dropdownItems?.map(subItem => (
                      <li key={subItem.id}>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); setActivePath(subItem.path); }}
                          className={`flex items-center p-2 rounded-md transition-colors duration-200
                          ${activePath === subItem.path ? 'bg-orange-500 text-white' : 'hover:bg-gray-600 text-gray-300'}`}
                        >
                          <div className={`ml-3 ${activePath === subItem.path ? 'text-white' : 'text-gray-400'}`}>{subItem.icon}</div>
                          <span>{subItem.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
            })}
        </ul>
      </nav>

      {/* Add Menus Section */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-lg p-4 text-center">
          <img src="https://picsum.photos/100/100?random=1" alt="Food" className="mx-auto mb-3 rounded-full border-2 border-white" />
          <h4 className="text-white font-bold">{AR_LABELS.addMenus}</h4>
          <p className="text-white text-sm mt-1">{AR_LABELS.manageFoodBeverages}</p>
          <a href="#" className="mt-3 inline-flex items-center text-white text-sm hover:underline">
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-xs border-t border-gray-700 dark:border-gray-800">
        <p>Brand Restaurant Admin</p>
        <p>2023 All Rights Reserved</p>
        <p>{AR_LABELS.madeWithLove}</p>
      </div>
    </div>
  );
};

export default Sidebar;