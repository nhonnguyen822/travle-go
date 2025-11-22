import React from 'react';

export default function Preloader() {
    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
            <div className="loader flex space-x-2">
                <span className="block w-4 h-4 bg-blue-600 rounded-full animate-bounce"></span>
                <span className="block w-4 h-4 bg-blue-600 rounded-full animate-bounce animation-delay-200"></span>
                <span className="block w-4 h-4 bg-blue-600 rounded-full animate-bounce animation-delay-400"></span>
            </div>
        </div>
    );
}
