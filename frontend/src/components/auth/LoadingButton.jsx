import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingButton = ({
    children,
    loading = false,
    disabled = false,
    type = 'submit',
    variant = 'primary',
    className = '',
    ...props
}) => {
    const baseClasses = 'w-full flex justify-center items-center py-3 px-6 rounded-full font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-blue-600 shadow-glow hover:shadow-lg hover:-translate-y-0.5 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
        secondary: 'bg-white text-text-main border border-gray-200 hover:bg-gray-50 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
    };

    return (
        <button
            type={type}
            disabled={loading || disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {loading && (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
            )}
            {children}
        </button>
    );
};

export default LoadingButton;
