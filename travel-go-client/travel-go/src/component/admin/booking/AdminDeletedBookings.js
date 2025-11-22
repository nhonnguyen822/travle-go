import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    X,
    RotateCcw,
    Eye,
    Filter,
    ChevronDown,
    ChevronUp,
    User,
    MapPin,
    Trash2,
    Mail,
    Phone,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Calendar,
    Clock
} from "lucide-react";

import toast from "react-hot-toast";
import AdminLayout from "../layout/AdminLayout";
import AdminBookingDetailModal from "./AdminBookingDetailModal";
import {getCancelledBookings, searchCancelledBookings, updateBookingStatus} from "../../../service/booking_service";


const INITIAL_FILTERS = {
    userName: "",
    bookingCode: "",
    tourTitle: "",
    page: 0,
    size: 10
};

// Modal xác nhận khôi phục
const RestoreConfirmationModal = ({
                                      show,
                                      onClose,
                                      onConfirm,
                                      booking,
                                      loading
                                  }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <RotateCcw size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Xác nhận khôi phục</h3>
                            <p className="text-sm text-gray-600">Khôi phục booking đã hủy</p>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">
                                    Bạn có chắc muốn khôi phục booking này?
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Booking <strong>{booking?.bookingCode}</strong> sẽ được chuyển về trạng thái <strong>"Chờ xác nhận"</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="text-sm text-gray-600">
                            <div className="flex justify-between mb-1">
                                <span>Mã booking:</span>
                                <span className="font-medium">{booking?.bookingCode}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span>Khách hàng:</span>
                                <span className="font-medium">{booking?.userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tour:</span>
                                <span className="font-medium text-right">{booking?.tourTitle}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(booking)}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            <>
                                <RotateCcw size={18} />
                                <span>Khôi phục</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal hiển thị lỗi - ĐÃ CẬP NHẬT
const ErrorModal = ({
                        show,
                        onClose,
                        errorMessage,
                        booking
                    }) => {
    if (!show) return null;

    // Phân tích thông báo lỗi để hiển thị phù hợp
    const getErrorDetails = () => {
        if (!errorMessage) return { title: "Có lỗi xảy ra", details: [] };

        const lowerMessage = errorMessage.toLowerCase();

        if (lowerMessage.includes("tour") && lowerMessage.includes("đã đầy")) {
            return {
                title: "Tour đã đầy chỗ",
                details: [
                    "Tour bạn muốn khôi phục đã đạt số lượng người tham gia tối đa",
                    "Không thể thêm booking mới vào tour này"
                ]
            };
        }

        if (lowerMessage.includes("thời gian") || lowerMessage.includes("time") || lowerMessage.includes("expir")) {
            return {
                title: "Quá thời hạn khôi phục",
                details: [
                    "Booking đã vượt quá thời gian cho phép khôi phục",
                    "Không thể khôi phục booking sau thời gian quy định"
                ]
            };
        }

        if (lowerMessage.includes("trạng thái") || lowerMessage.includes("status")) {
            return {
                title: "Trạng thái không hợp lệ",
                details: [
                    "Booking hiện tại không thể khôi phục do trạng thái không phù hợp",
                    "Chỉ có thể khôi phục booking từ trạng thái đã hủy"
                ]
            };
        }

        if (lowerMessage.includes("payment") || lowerMessage.includes("thanh toán")) {
            return {
                title: "Lỗi thanh toán",
                details: [
                    "Có vấn đề với thông tin thanh toán của booking",
                    "Vui lòng kiểm tra lại lịch sử thanh toán"
                ]
            };
        }

        // Mặc định
        return {
            title: "Không thể khôi phục",
            details: [
                errorMessage || "Đã xảy ra lỗi không xác định khi khôi phục booking"
            ]
        };
    };

    const errorDetails = getErrorDetails();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{errorDetails.title}</h3>
                            <p className="text-sm text-gray-600">Có lỗi xảy ra khi khôi phục booking</p>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="space-y-2">
                            {errorDetails.details.map((detail, index) => (
                                <p key={index} className="text-sm text-red-800 flex items-start gap-2">
                                    <span className="mt-0.5">•</span>
                                    <span>{detail}</span>
                                </p>
                            ))}
                        </div>
                    </div>

                    {booking && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="text-sm text-gray-600">
                                <div className="flex justify-between mb-1">
                                    <span>Mã booking:</span>
                                    <span className="font-medium">{booking.bookingCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tour:</span>
                                    <span className="font-medium text-right">{booking.tourTitle}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <span>Đã hiểu</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDeleteBookings = () => {
    const [state, setState] = useState({
        bookings: [],
        loading: false,
        showFilters: false,
        pagination: {
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
            pageSize: 10
        },
        searchTerm: "",
        showDetailModal: false,
        selectedBooking: null,
        actionLoading: false,
        showRestoreModal: false,
        showErrorModal: false,
        errorMessage: ""
    });

    const filtersRef = useRef({ ...INITIAL_FILTERS });
    const [filterTrigger, setFilterTrigger] = useState(0);
    const searchTimeoutRef = useRef(null);

    const formatPrice = (price) =>
        price?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0 ₫";

    const formatDate = (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "N/A";

    const updateState = (updates) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const fetchBookings = useCallback(async (filters = {}) => {
        updateState({ loading: true });
        try {
            const currentFilters = { ...filtersRef.current, ...filters };

            const response = state.searchTerm.trim()
                ? await searchCancelledBookings(state.searchTerm, currentFilters.page, currentFilters.size)
                : await getCancelledBookings({
                    userName: currentFilters.userName,
                    bookingCode: currentFilters.bookingCode,
                    tourTitle: currentFilters.tourTitle,
                    page: currentFilters.page,
                    size: currentFilters.size
                });

            const bookingsData = response.content || [];
            const paginationData = {
                currentPage: response.number !== undefined ? response.number : 0,
                totalPages: response.totalPages !== undefined ? response.totalPages : 1,
                totalElements: response.totalElements !== undefined ? response.totalElements : bookingsData.length,
                pageSize: response.size !== undefined ? response.size : currentFilters.size
            };

            updateState({
                bookings: Array.isArray(bookingsData) ? bookingsData : [],
                pagination: paginationData
            });
        } catch (error) {
            console.error("❌ Lỗi tải danh sách booking đã hủy:", error);
            toast.error("Không thể tải danh sách booking đã hủy");
            updateState({
                bookings: [],
                pagination: {
                    currentPage: 0,
                    totalPages: 0,
                    totalElements: 0,
                    pageSize: 10
                }
            });
        } finally {
            updateState({ loading: false });
        }
    }, [state.searchTerm]);

    useEffect(() => {
        fetchBookings();
    }, [filterTrigger, fetchBookings]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleSearchChange = (term) => {
        updateState({ searchTerm: term });

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            filtersRef.current = { ...filtersRef.current, page: 0 };
            setFilterTrigger(prev => prev + 1);
        }, 500);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        filtersRef.current = { ...filtersRef.current, [name]: value, page: 0 };
        updateState({ searchTerm: "" });
        setFilterTrigger(prev => prev + 1);
    };

    const clearAllFilters = () => {
        updateState({ searchTerm: "" });
        filtersRef.current = { ...INITIAL_FILTERS };
        setFilterTrigger(prev => prev + 1);
    };

    const clearSearch = () => {
        updateState({ searchTerm: "" });
        filtersRef.current = { ...filtersRef.current, page: 0 };
        setFilterTrigger(prev => prev + 1);
    };

    const handleViewDetail = (booking) => {
        updateState({
            selectedBooking: booking,
            showDetailModal: true
        });
    };

    const handleRestoreClick = (booking) => {
        updateState({
            selectedBooking: booking,
            showRestoreModal: true
        });
    };

    const handleRestoreConfirm = async (booking) => {
        updateState({
            actionLoading: true,
            showRestoreModal: false
        });

        try {
            await updateBookingStatus(booking.id, "PENDING", "Khôi phục booking từ danh sách đã hủy");
            await fetchBookings();
            toast.success(`✅ Đã khôi phục booking ${booking.bookingCode} thành công!`);
        } catch (error) {
            console.error("❌ Lỗi khôi phục booking:", error);

            // Xử lý thông báo lỗi chi tiết hơn
            let errorMessage = "Không thể khôi phục booking";

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Hiển thị modal lỗi chi tiết với thông tin booking
            updateState({
                showErrorModal: true,
                errorMessage: errorMessage
            });
        } finally {
            updateState({ actionLoading: false });
        }
    };

    const handleCloseRestoreModal = () => {
        updateState({
            showRestoreModal: false,
            selectedBooking: null
        });
    };

    const handleCloseErrorModal = () => {
        updateState({
            showErrorModal: false,
            errorMessage: "",
            selectedBooking: null
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= state.pagination.totalPages) return;
        filtersRef.current = { ...filtersRef.current, page: newPage };
        setFilterTrigger(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper function để lấy thông tin tour schedule từ booking
    const getTourScheduleInfo = (booking) => {
        if (booking.tourSchedule) {
            return {
                tourTitle: booking.tourSchedule.tour?.title,
                startDate: booking.tourSchedule.startDate,
                endDate: booking.tourSchedule.endDate
            };
        }

        return {
            tourTitle: booking.tourTitle,
            startDate: booking.startDate,
            endDate: booking.endDate
        };
    };

    // Helper function để lấy thông tin khách hàng từ booking
    const getUserInfo = (booking) => {
        if (booking.user) {
            return {
                name: booking.user.name,
                email: booking.user.email,
                phone: booking.user.phone
            };
        }

        return {
            name: booking.userName,
            email: booking.userEmail,
            phone: booking.userPhone
        };
    };

    const SearchResultsIndicator = () => {
        if (!state.searchTerm && !filtersRef.current.userName && !filtersRef.current.bookingCode && !filtersRef.current.tourTitle) return null;

        return (
            <div className="mb-6">
                <div className={`rounded-2xl p-4 ${
                    state.loading
                        ? 'bg-blue-50 border border-blue-200'
                        : state.bookings.length > 0
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-yellow-50 border border-yellow-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {state.loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    <div>
                                        <p className="text-blue-800 font-medium">Đang tìm kiếm...</p>
                                        <p className="text-blue-600 text-sm">
                                            {state.searchTerm && `Từ khóa: "${state.searchTerm}"`}
                                            {filtersRef.current.userName && `Tên KH: "${filtersRef.current.userName}"`}
                                            {filtersRef.current.bookingCode && `Mã booking: "${filtersRef.current.bookingCode}"`}
                                            {filtersRef.current.tourTitle && `Tour: "${filtersRef.current.tourTitle}"`}
                                        </p>
                                    </div>
                                </>
                            ) : state.bookings.length > 0 ? (
                                <>
                                    <Search size={20} className="text-green-500" />
                                    <div>
                                        <p className="text-green-800 font-medium">
                                            Tìm thấy {state.pagination.totalElements} booking đã hủy
                                        </p>
                                        <p className="text-green-600 text-sm">
                                            {state.searchTerm && `Từ khóa: "${state.searchTerm}"`}
                                            {filtersRef.current.userName && `Tên KH: "${filtersRef.current.userName}"`}
                                            {filtersRef.current.bookingCode && `Mã booking: "${filtersRef.current.bookingCode}"`}
                                            {filtersRef.current.tourTitle && `Tour: "${filtersRef.current.tourTitle}"`}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Search size={20} className="text-yellow-500" />
                                    <div>
                                        <p className="text-yellow-800 font-medium">Không tìm thấy booking đã hủy nào</p>
                                        <p className="text-yellow-600 text-sm">
                                            {state.searchTerm && `Từ khóa: "${state.searchTerm}"`}
                                            {filtersRef.current.userName && `Tên KH: "${filtersRef.current.userName}"`}
                                            {filtersRef.current.bookingCode && `Mã booking: "${filtersRef.current.bookingCode}"`}
                                            {filtersRef.current.tourTitle && `Tour: "${filtersRef.current.tourTitle}"`}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        {(state.searchTerm || filtersRef.current.userName || filtersRef.current.bookingCode || filtersRef.current.tourTitle) && !state.loading && (
                            <button
                                onClick={clearAllFilters}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                            >
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const AdvancedFilters = () => {
        if (state.searchTerm) return null;

        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                <div
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => updateState({ showFilters: !state.showFilters })}
                >
                    <div className="flex items-center gap-3">
                        <Filter size={20} className="text-red-600" />
                        <span className="font-semibold text-gray-800 text-lg">Bộ lọc booking đã hủy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            {state.showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                    </div>
                </div>

                {state.showFilters && (
                    <div className="border-t border-gray-200 p-6 bg-red-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên khách hàng
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="userName"
                                        placeholder="Nhập tên khách hàng..."
                                        value={filtersRef.current.userName}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mã booking
                                </label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="bookingCode"
                                        placeholder="Nhập mã booking..."
                                        value={filtersRef.current.bookingCode}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên tour
                                </label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="tourTitle"
                                        placeholder="Nhập tên tour..."
                                        value={filtersRef.current.tourTitle}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số lượng hiển thị
                                </label>
                                <select
                                    name="size"
                                    value={filtersRef.current.size}
                                    onChange={handleFilterChange}
                                    className="w-full border border-gray-300 rounded-2xl px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                >
                                    <option value="10">10 booking</option>
                                    <option value="20">20 booking</option>
                                    <option value="50">50 booking</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearAllFilters}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200"
                            >
                                Xóa tất cả bộ lọc
                            </button>
                            <button
                                onClick={() => updateState({ showFilters: false })}
                                className="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all duration-200"
                            >
                                Áp dụng bộ lọc
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const BookingTable = () => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-red-100 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Mã & Khách hàng
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Tour
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Ngày đi
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Số người
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Đã Thanh Toán
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {state.bookings.map((booking) => {
                        const userInfo = getUserInfo(booking);
                        const tourScheduleInfo = getTourScheduleInfo(booking);

                        return (
                            <tr key={booking.id} className="hover:bg-red-50 transition-colors duration-150">
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block border">
                                            {booking.bookingCode}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-500" />
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {userInfo.name || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-500" />
                                                <span className="text-xs text-gray-500">
                                                    {userInfo.email || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-500" />
                                                <span className="text-xs text-gray-500">
                                                    {userInfo.phone || "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="max-w-[200px]">
                                        <div className="font-medium text-gray-900 text-sm">
                                            {tourScheduleInfo.tourTitle || "N/A"}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatDate(tourScheduleInfo.startDate)}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-center text-sm text-gray-600">
                                    {formatDate(tourScheduleInfo.startDate)}
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <div className="text-sm font-medium text-gray-900">
                                        {booking.numberOfPeople} người
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {booking.adultCount} lớn, {booking.childCount} trẻ, {booking.babyCount} bé
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-semibold text-red-600">
                                        {formatPrice(booking.paidAmount)}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleViewDetail(booking)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        <button
                                            onClick={() => handleRestoreClick(booking)}
                                            disabled={state.actionLoading}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Khôi phục booking"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {state.loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải danh sách booking đã hủy...</p>
                    </div>
                </div>
            )}

            {!state.loading && state.bookings.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <Trash2 size={64} className="mx-auto mb-4 opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có booking đã hủy nào</h3>
                    <p className="text-gray-500 mb-4">
                        {state.searchTerm || filtersRef.current.userName || filtersRef.current.bookingCode || filtersRef.current.tourTitle
                            ? "Không tìm thấy booking đã hủy nào phù hợp với điều kiện tìm kiếm"
                            : "Hiện tại không có booking nào đã bị hủy trong hệ thống."
                        }
                    </p>
                    {(state.searchTerm || filtersRef.current.userName || filtersRef.current.bookingCode || filtersRef.current.tourTitle) && (
                        <button
                            onClick={clearAllFilters}
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const Pagination = () => {
        const { pagination } = state;
        if (pagination.totalPages <= 1) return null;

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mt-6">
                <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium">{(pagination.currentPage * pagination.pageSize) + 1}-{Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements)}</span> trong tổng số <span className="font-medium">{pagination.totalElements}</span> booking đã hủy
                </div>
                <div className="flex items-center gap-2">
                    {pagination.currentPage > 0 && (
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                            <ChevronLeft size={16} />
                            Trước
                        </button>
                    )}

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNumber = i + Math.max(0, pagination.currentPage - 2);
                            if (pageNumber >= pagination.totalPages) return null;
                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        pagination.currentPage === pageNumber
                                            ? 'bg-red-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {pageNumber + 1}
                                </button>
                            );
                        })}
                    </div>

                    {pagination.currentPage < pagination.totalPages - 1 && (
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                            Sau
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="bg-gray-50 min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Trash2 size={24} className="text-red-600" />
                                Booking Đã Hủy
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Quản lý và khôi phục các booking đã bị hủy
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="flex-1 lg:flex-none lg:w-96">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên, email, số điện thoại, mã booking, tour..."
                                        value={state.searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                    {state.searchTerm && (
                                        <button
                                            onClick={clearSearch}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <SearchResultsIndicator />
                    <AdvancedFilters />
                    <BookingTable />
                    <Pagination />
                </div>

                {/* Modals */}
                <AdminBookingDetailModal
                    show={state.showDetailModal}
                    onClose={() => updateState({ showDetailModal: false, selectedBooking: null })}
                    booking={state.selectedBooking}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                />

                <RestoreConfirmationModal
                    show={state.showRestoreModal}
                    onClose={handleCloseRestoreModal}
                    onConfirm={handleRestoreConfirm}
                    booking={state.selectedBooking}
                    loading={state.actionLoading}
                />

                <ErrorModal
                    show={state.showErrorModal}
                    onClose={handleCloseErrorModal}
                    errorMessage={state.errorMessage}
                    booking={state.selectedBooking}
                />
            </div>
        </AdminLayout>
    );
};

export default AdminDeleteBookings;