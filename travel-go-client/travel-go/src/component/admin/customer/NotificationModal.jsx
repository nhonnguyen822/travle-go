import React from 'react';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Info,
    X
} from 'lucide-react';

const NotificationModal = ({
                               isOpen,
                               onClose,
                               type = 'success',
                               title,
                               message,
                               details
                           }) => {
    if (!isOpen) return null;

    const config = {
        success: {
            icon: CheckCircle,
            iconColor: 'text-emerald-600',
            bgColor: 'bg-white',
            borderColor: 'border-emerald-200',
            titleColor: 'text-gray-900',
            textColor: 'text-gray-600',
            buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        },
        error: {
            icon: XCircle,
            iconColor: 'text-rose-600',
            bgColor: 'bg-white',
            borderColor: 'border-rose-200',
            titleColor: 'text-gray-900',
            textColor: 'text-gray-600',
            buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white'
        },
        warning: {
            icon: AlertCircle,
            iconColor: 'text-amber-600',
            bgColor: 'bg-white',
            borderColor: 'border-amber-200',
            titleColor: 'text-gray-900',
            textColor: 'text-gray-600',
            buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white'
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-600',
            bgColor: 'bg-white',
            borderColor: 'border-blue-200',
            titleColor: 'text-gray-900',
            textColor: 'text-gray-600',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    };

    const {
        icon: Icon,
        iconColor,
        bgColor,
        borderColor,
        titleColor,
        textColor,
        buttonColor
    } = config[type];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${bgColor} rounded-xl shadow-2xl w-full max-w-sm border ${borderColor} animate-scale-in`}>
                <div className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`${titleColor} font-semibold text-lg mb-1`}>
                                {title}
                            </h3>
                            {message && (
                                <p className={`${textColor} text-sm leading-relaxed`}>
                                    {message}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {details && (
                    <div className="px-6 pb-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {details}
                            </p>
                        </div>
                    </div>
                )}
                <div className="px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${buttonColor}`}
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};


const styles = `
@keyframes scale-in {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
.animate-scale-in {
    animation: scale-in 0.2s ease-out;
}
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

export default NotificationModal;