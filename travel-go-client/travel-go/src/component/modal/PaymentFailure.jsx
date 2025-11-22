import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const errorCode = searchParams.get("errorCode") || "UNKNOWN";
    const bookingId = searchParams.get("bookingId");

    const handleRetry = () => {
        if (bookingId) navigate(`/seat-selection?retry=${bookingId}`);
        else navigate("/tours");
    };

    // Hàm lấy thông báo lỗi chi tiết dựa trên mã lỗi
    const getErrorMessage = (code) => {
        const errorMessages = {
            'INVALID_BOOKING_ID': 'Thông tin đặt tour không hợp lệ',
            'PAYMENT_DECLINED': 'Giao dịch bị từ chối',
            'INSUFFICIENT_FUNDS': 'Tài khoản không đủ số dư',
            'INVALID_CARD': 'Thẻ không hợp lệ',
            'TIMEOUT': 'Quá thời gian xử lý',
            'NETWORK_ERROR': 'Lỗi kết nối mạng',
            'UNKNOWN': 'Lỗi không xác định'
        };
        return errorMessages[code] || 'Có lỗi xảy ra trong quá trình thanh toán';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header với icon */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-12 h-12 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thất bại</h1>
                    <p className="text-red-100 text-sm">Rất tiếc, chúng tôi không thể xử lý thanh toán của bạn</p>
                </div>

                {/* Nội dung */}
                <div className="p-8 space-y-6">
                    {/* Thông tin lỗi */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="text-left">
                                <p className="font-semibold text-red-800 text-sm">Mã lỗi: {errorCode}</p>
                                <p className="text-red-600 text-sm mt-1">{getErrorMessage(errorCode)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hướng dẫn */}
                    <div className="text-center space-y-3">
                        <p className="text-gray-600 text-sm">
                            Đừng lo lắng! Bạn có thể thử lại thanh toán hoặc liên hệ với đội ngũ hỗ trợ của chúng tôi.
                        </p>

                        {/* Thông tin hỗ trợ */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-gray-700 text-sm font-medium">Cần hỗ trợ?</p>
                            <div className="flex justify-center space-x-6 text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>1900 1234</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>support@travelgo.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            onClick={handleRetry}
                            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Thử lại thanh toán</span>
                        </button>

                        <Link to="/" className="flex-1">
                            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-gray-300 flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Về trang chủ</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;