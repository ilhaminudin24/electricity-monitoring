import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Zap
} from 'lucide-react';

const CMSSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [landingPageExpanded, setLandingPageExpanded] = useState(true);

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            // Silently fail - user will be redirected anyway
        }
    };

    const landingPageSections = [
        { path: '/cms/landing-page/hero', label: 'Hero Section' },
        { path: '/cms/landing-page/features', label: 'Features' },
        { path: '/cms/landing-page/steps', label: 'How It Works' },
        { path: '/cms/landing-page/screenshot', label: 'Screenshot' },
        { path: '/cms/landing-page/testimonial', label: 'Testimonial' },
        { path: '/cms/landing-page/bottom-cta', label: 'Bottom CTA' },
        { path: '/cms/landing-page/footer', label: 'Footer' }
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200">
                <Link to="/cms/dashboard" className="flex items-center">
                    <Zap className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                        <h1 className="text-lg font-bold text-slate-900">CMS</h1>
                        <p className="text-xs text-slate-500">Admin Panel</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {/* Dashboard */}
                    <li>
                        <Link
                            to="/cms/dashboard"
                            className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive('/cms/dashboard')
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <LayoutDashboard className="h-5 w-5 mr-3" />
                            <span className="font-medium">Dashboard</span>
                        </Link>
                    </li>

                    {/* Landing Page (Expandable) */}
                    <li>
                        <button
                            onClick={() => setLandingPageExpanded(!landingPageExpanded)}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-3" />
                                <span className="font-medium">Landing Page</span>
                            </div>
                            {landingPageExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>

                        {/* Sub-menu */}
                        {landingPageExpanded && (
                            <ul className="mt-1 ml-4 space-y-1">
                                {landingPageSections.map((section) => (
                                    <li key={section.path}>
                                        <Link
                                            to={section.path}
                                            className={`block px-4 py-2 rounded-lg text-sm transition-colors ${isActive(section.path)
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {section.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>

                    {/* User Management */}
                    <li>
                        <Link
                            to="/cms/users"
                            className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive('/cms/users')
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <Users className="h-5 w-5 mr-3" />
                            <span className="font-medium">Users</span>
                        </Link>
                    </li>

                    {/* Settings */}
                    <li>
                        <Link
                            to="/cms/settings"
                            className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive('/cms/settings')
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <Settings className="h-5 w-5 mr-3" />
                            <span className="font-medium">Settings</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default CMSSidebar;
