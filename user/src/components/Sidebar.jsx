import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  DollarSign,
  Users,
  X,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = ({ isOpen, onToggle, isCollapsed, toggleCollapsed }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const [expandedMenus, setExpandedMenus] = useState({});

  const navigationLinks = [
    {
      name: "Dashboard",
      href: "/gtcfx/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Strategies",
      href: "/gtcfx/strategies",
      icon: TrendingUp,
    },
    {
      name: "Portfolio",
      icon: Wallet,
      subItems: [
        { name: "My Subscriptions", href: "/gtcfx/subscriptions" },
        { name: "Profit Logs", href: "/gtcfx/profit-logs" },
        { name: "Unsubscribe", href: "/gtcfx/unsubscribe" },
      ],
    },
    {
      name: "Agent",
      icon: Users,
      subItems: [
        { name: "Members", href: "/gtcfx/agent/members" },
        { name: "Commission Report", href: "/gtcfx/agent/commission" },
      ],
    },
  ];

  const isActiveLink = (href) => location.pathname === href;

  const hasActiveSubItem = (subItems) => {
    if (!subItems) return false;
    return subItems.some((item) => location.pathname === item.href);
  };

  const toggleMenu = (itemName) => {
    if (isCollapsed) return;
    setExpandedMenus((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-orange-900/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-orange-200 z-50 
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-16" : "w-60"}
          lg:translate-x-0
        `}
      >
        {/* Sidebar Header with Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-orange-200">
          {!isCollapsed && (
            <span className="font-semibold text-orange-900 text-sm">
              Navigation
            </span>
          )}

          {/* Toggle Button - Always visible */}
          <button
            onClick={toggleCollapsed}
            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors hidden lg:block"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const active =
              isActiveLink(item.href) || hasActiveSubItem(item.subItems);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded =
              expandedMenus[item.name] ||
              (active && hasSubItems && !isCollapsed);

            return (
              <div key={item.name}>
                {/* Main Menu Item */}
                <div className="relative group">
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                        ${isCollapsed ? "justify-center" : ""}
                        ${
                          active
                            ? "bg-orange-50 text-orange-600 border-r-3 border-orange-600"
                            : "text-slate-700 hover:bg-orange-50"
                        }
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {item.name}
                            </span>
                            {isExpanded ? (
                              <ChevronDown
                                size={16}
                                className="text-slate-400"
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                                className="text-slate-400"
                              />
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => window.innerWidth < 1024 && onToggle()}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition-colors
                        ${isCollapsed ? "justify-center" : ""}
                        ${
                          active
                            ? "bg-orange-50 text-orange-600 border-r-3 border-orange-600"
                            : "text-slate-700 hover:bg-orange-50"
                        }
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </Link>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-0 ml-3 px-3 py-2 bg-orange-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-60 hidden lg:block shadow-lg">
                      <div className="font-medium">{item.name}</div>
                      {hasSubItems && (
                        <div className="text-xs text-orange-100 mt-2 space-y-1">
                          {item.subItems.map((subItem, idx) => (
                            <div key={idx}>{subItem.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submenu */}
                {hasSubItems && !isCollapsed && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-orange-100 pl-4">
                    {item.subItems.map((subItem, index) => (
                      <Link
                        key={index}
                        to={subItem.href}
                        onClick={() => window.innerWidth < 1024 && onToggle()}
                        className={`
                          block p-3 rounded-lg text-sm transition-colors
                          ${
                            isActiveLink(subItem.href)
                              ? "bg-orange-50 text-orange-600 font-medium"
                              : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                          }
                        `}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer - Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-orange-200 bg-white space-y-2">
          <button
            onClick={logout}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg transition-colors
              ${isCollapsed ? "justify-center" : ""}
              text-red-600 hover:bg-red-50
            `}
            title="Logout"
          >
            <LogOut size={20} />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
