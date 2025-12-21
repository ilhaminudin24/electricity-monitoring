import React from 'react';

const AuthCard = ({ children }) => {
    return (
        <div className="w-full max-w-[480px]">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 sm:p-12 relative z-10 transition-all duration-300 hover:shadow-2xl">
                {children}
            </div>
        </div>
    );
};

export default AuthCard;
