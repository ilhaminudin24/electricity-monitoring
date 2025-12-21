
import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
    LayoutGrid,
    PlusCircle,
    History,
    BarChart3,
    Settings,
    Zap,
    LogOut
} from 'lucide-react';

const VoltaicSidebar = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutGrid },
        { path: '/input', label: t('nav.inputReading'), icon: PlusCircle },
        { path: '/history', label: t('nav.history'), icon: History },
        { path: '/reports', label: t('nav.reports', 'Reports'), icon: BarChart3 }, // Assuming translation key might not exist yet
        { path: '/settings', label: t('nav.settings'), icon: Settings },
    ];

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 transition-colors duration-200">
            {/* Header / Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-glow">
                    <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                    <h1 className="text-base font-bold leading-tight text-text-main dark:text-white">
                        Voltaic<span className="text-primary">Monitor</span>
                    </h1>
                    <p className="text-xs text-text-sub">v2.4.0</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose} // Close sidebar on mobile when clicked
                            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 group
                ${isActive
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-text-sub hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-text-main font-medium'}
              `}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition-colors'}`} />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">

                {/* Language Switcher */}
                <div className="px-2">
                    <LanguageSwitcher />
                </div>

                <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-primary font-bold">
                            {currentUser?.email?.charAt(0).toUpperCase() || 'G'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-bold text-text-main dark:text-white truncate max-w-[120px]">
                                {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Guest'}
                            </p>
                            <p className="text-xs text-text-sub truncate max-w-[120px]">
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title={t('auth.logout')}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-full fixed left-0 top-0 bottom-0 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay & Sidebar */}
            {isOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
};

export default VoltaicSidebar;
