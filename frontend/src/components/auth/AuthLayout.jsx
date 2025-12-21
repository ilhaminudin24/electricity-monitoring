import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            {/* Decorative Shape (Blurred Blue Circle) */}
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/80 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[80px] opacity-50 pointer-events-none"></div>

            {/* Top Left: Home Link / Logo */}
            <Link
                to="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-3 text-text-main hover:text-primary transition-colors group"
                aria-label="Back to Home"
            >
                <div className="w-10 h-10 bg-white shadow-soft rounded-xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform border border-gray-100">
                    <Zap className="h-5 w-5 fill-current" />
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:block group-hover:text-primary/90">VoltMonitor</span>
            </Link>

            {/* Top Right: Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                {/* Passing custom className to LanguageSwitcher if it accepts it, 
                    otherwise the wrapper handles positioning. 
                    Using default variant which is static, so wrapper positioning applies. */}
                <div className="bg-white rounded-full shadow-sm border border-gray-100">
                    <LanguageSwitcher />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative w-full flex justify-center z-10">
                {children}
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 w-full text-center pointer-events-none">
                <p className="text-gray-400 text-xs font-medium">© 2024 VoltMonitor. All rights reserved.</p>
            </div>
        </div>
    );
};

export default AuthLayout;
