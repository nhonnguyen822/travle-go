import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Edit,
    Eye,
    Filter,
    MapPin,
    Plus,
    Search,
    User,
    X
} from "lucide-react";
import {useNavigate} from "react-router-dom";

import {
    createBookingByAdmin,
    getBookingStatuses,
    globalSearchBookings,
    searchBookings,
    updateBookingDetails,
    updateBookingPayment,
    updateBookingStatus
} from "../../../service/booking_service";

import toast from "react-hot-toast";
import AdminLayout from "../layout/AdminLayout";
import AdminCreateBookingModal from "./AdminCreateBookingModal";
import AdminUpdateBookingModal from "./AdminUpdateBookingModal";
import AdminDeleteBookings from "./AdminDeletedBookings";
import AdminBookingDetailModal from "./AdminBookingDetailModal";

const INITIAL_FILTERS = {
    userName: "",
    bookingCode: "",
    tourTitle: "",
    status: "",
    page: 0,
    size: 10,
    sortBy: "bookingDate",
    sortDirection: "desc"
};

const AdminBookingList = () => {
    const navigate = useNavigate();

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
        showCreateModal: false,
        showUpdateModal: false,
        showDetailModal: false,
        showEditModal: false,
        selectedBooking: null,
        actionLoading: false,
        statusOptions: [],
        statusConfig: {}
    });

    const filtersRef = useRef({ ...INITIAL_FILTERS });
    const [filterTrigger, setFilterTrigger] = useState(0);
    const searchTimeoutRef = useRef(null);

    // Helper function để lấy màu cho status - CẬP NHẬT THEO CUSTOMER MANAGEMENT
    const getStatusColor = (status) => {
        const colorMap = {
            PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            DEPOSIT_PAID: 'bg-blue-100 text-blue-700 border border-blue-200',
            PAID: 'bg-green-100 text-green-700 border border-green-200',
            CANCELLED: 'bg-red-100 text-red-700 border border-red-200'
        };
        return colorMap[status] || colorMap.PENDING;
    };

    const formatPrice = (price) => {
        const numericPrice = Number(price) || 0;
        return numericPrice.toLocaleString("vi-VN") + " VND";
    };
    const formatDate = (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "N/A";

    const updateState = (updates) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const fetchStatusOptions = useCallback(async () => {
        try {
            const statuses = await getBookingStatuses();

            const statusOptions = statuses
                .filter(status => status.code !== "CANCELLED")
                .map(status => ({
                    value: status.code,
                    label: status.label
                }));

            const statusConfig = statuses
                .filter(status => status.code !== "CANCELLED")
                .reduce((config, status) => {
                    config[status.code] = {
                        color: getStatusColor(status.code),
                        label: status.label
                    };
                    return config;
                }, {});

            updateState({
                statusOptions,
                statusConfig
            });
        } catch (error) {
            const fallbackStatusOptions = [
                { value: "PENDING", label: "Chờ xác nhận" },
                { value: "DEPOSIT_PAID", label: "Đã đặt cọc" },
                { value: "PAID", label: "Đã thanh toán" }
            ];

            const fallbackStatusConfig = {
                PENDING: {
                    color: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
                    label: 'Chờ xác nhận'
                },
                DEPOSIT_PAID: {
                    color: 'bg-blue-100 text-blue-700 border border-blue-200',
                    label: 'Đã đặt cọc'
                },
                PAID: {
                    color: 'bg-green-100 text-green-700 border border-green-200',
                    label: 'Đã thanh toán'
                },
                CANCELLED: {
                    color: 'bg-red-100 text-red-700 border border-red-200',
                    label: 'Đã hủy'
                }
            };

            updateState({
                statusOptions: fallbackStatusOptions,
                statusConfig: fallbackStatusConfig
            });
        }
    }, []);

    const fetchBookings = useCallback(async (filters = {}) => {
        updateState({ loading: true });
        try {
            const currentFilters = { ...filtersRef.current, ...filters };

            const response = state.searchTerm.trim()
                ? await globalSearchBookings(state.searchTerm, {
                    status: currentFilters.status,
                    page: currentFilters.page,
                    size: currentFilters.size,
                    sortBy: currentFilters.sortBy,
                    sortDirection: currentFilters.sortDirection
                })
                : await searchBookings({
                    userName: currentFilters.userName,
                    bookingCode: currentFilters.bookingCode,
                    tourTitle: currentFilters.tourTitle,
                    status: currentFilters.status,
                    page: currentFilters.page,
                    size: currentFilters.size,
                    sortBy: currentFilters.sortBy,
                    sortDirection: currentFilters.sortDirection
                });

            const bookingsData = response.content || response.data?.content || response.data || response || [];
            const paginationData = {
                currentPage: response.number !== undefined ? response.number : (response.data?.number || response.page || 0),
                totalPages: response.totalPages !== undefined ? response.totalPages : (response.data?.totalPages || response.totalPages || 1),
                totalElements: response.totalElements !== undefined ? response.totalElements : (response.data?.totalElements || response.total || bookingsData.length),
                pageSize: response.size !== undefined ? response.size : (response.data?.size || currentFilters.size)
            };

            updateState({
                bookings: Array.isArray(bookingsData) ? bookingsData : [],
                pagination: paginationData
            });
        } catch (error) {
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
        fetchStatusOptions();
    }, [fetchStatusOptions]);

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

    const handleViewDetail = (booking) => {
        updateState({
            selectedBooking: booking,
            showDetailModal: true
        });
    };

    const handleEditBooking = (booking) => {
        updateState({
            selectedBooking: booking,
            showEditModal: true
        });
    };

    const handleUpdateBooking = (booking) => {
        updateState({
            selectedBooking: booking,
            showUpdateModal: true
        });
    };

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

    const handleUpdateStatus = async (bookingId, newStatus, reason = "") => {
        updateState({ actionLoading: true });
        try {
            await updateBookingStatus(bookingId, newStatus, reason);
            await fetchBookings();
            updateState({ showUpdateModal: false, selectedBooking: null });
            toast.success(`Đã huỷ booking thành công!`);
        } catch (error) {
            toast.error("Huỷ booking thất bại .Vui lòng thử lại !");
        } finally {
            updateState({ actionLoading: false });
        }
    };

    const handleUpdateBookingDetails = async (bookingId, updateData) => {
        updateState({ actionLoading: true });
        try {
            await updateBookingDetails(bookingId, updateData);
            await fetchBookings();
            updateState({ showEditModal: false, selectedBooking: null });
            toast.success("✅ Cập nhật thông tin booking thành công!");
        } catch (error) {
            throw new Error(error.message || "Có lỗi xảy ra khi cập nhật thông tin booking!");
        } finally {
            updateState({ actionLoading: false });
        }
    };

    const handlePayment = async (bookingId, paymentData) => {
        updateState({ actionLoading: true });
        try {
            await updateBookingPayment(bookingId, paymentData);
            await fetchBookings();
            updateState({ showUpdateModal: false, selectedBooking: null });
            toast.success("💰 Cập nhật thanh toán thành công!");
        } catch (error) {
            throw new Error(error.message || "❌ Có lỗi xảy ra khi cập nhật thanh toán!");
        } finally {
            updateState({ actionLoading: false });
        }
    };

    const handleCreateBooking = async (bookingData) => {
        updateState({ actionLoading: true });
        try {
            await createBookingByAdmin(bookingData);
            console.log(bookingData)
            await fetchBookings();
            updateState({ showCreateModal: false });
            toast.success("🎉 Tạo booking thành công!");
        } catch (error) {
            console.error("❌ Lỗi tạo booking:", error);
            toast.error("❌ Có lỗi xảy ra khi tạo booking!");
        } finally {
            updateState({ actionLoading: false });
        }
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

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= state.pagination.totalPages) return;
        filtersRef.current = { ...filtersRef.current, page: newPage };
        setFilterTrigger(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // CẬP NHẬT: StatusBadge với style giống CustomerManagement
    const StatusBadge = ({ status }) => {
        const config = state.statusConfig[status] || {
            color: getStatusColor(status),
            label: status
        };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'PAID' ? 'bg-green-500' :
                        status === 'DEPOSIT_PAID' ? 'bg-blue-500' :
                            status === 'PENDING' ? 'bg-yellow-500' :
                                'bg-red-500'
                }`}></div>
                {config.label}
            </span>
        );
    };

    const BookingStats = () => {
        const counts = {
            TOTAL: state.bookings.length
        };

        Object.keys(state.statusConfig).forEach(status => {
            counts[status] = 0;
        });

        state.bookings.forEach(booking => {
            if (counts[booking.status] !== undefined) {
                counts[booking.status]++;
            }
        });

        return (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-800">{counts.TOTAL}</div>
                    <div className="text-sm text-gray-600">Tổng booking</div>
                </div>

                {Object.entries(state.statusConfig).map(([status, config]) => (
                    <div key={status} className={`bg-white rounded-2xl p-6 shadow-lg border ${config.color.split(' ')[0]} ${config.color.split(' ')[1]} border-gray-200`}>
                        <div className="text-2xl font-bold text-gray-800">{counts[status] || 0}</div>
                        <div className={`text-sm ${config.color.split(' ')[2]}`}>
                            {config.label}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const Pagination = () => {
        const { pagination } = state;
        if (pagination.totalPages <= 1) return null;

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium">{(pagination.currentPage * pagination.pageSize) + 1}-{Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements)}</span> trong tổng số <span className="font-medium">{pagination.totalElements}</span> booking
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
                                            ? 'bg-green-600 text-white'
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

    const SearchResultsIndicator = () => {
        if (!state.searchTerm) return null;

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
                                        <p className="text-blue-600 text-sm">Từ khóa: "<strong>{state.searchTerm}</strong>"</p>
                                    </div>
                                </>
                            ) : state.bookings.length > 0 ? (
                                <>
                                    <CheckCircle size={20} className="text-green-500" />
                                    <div>
                                        <p className="text-green-800 font-medium">
                                            Tìm thấy {state.pagination.totalElements} kết quả phù hợp
                                        </p>
                                        <p className="text-green-600 text-sm">
                                            Từ khóa: "<strong>{state.searchTerm}</strong>"
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Search size={20} className="text-yellow-500" />
                                    <div>
                                        <p className="text-yellow-800 font-medium">Không tìm thấy kết quả nào</p>
                                        <p className="text-yellow-600 text-sm">
                                            Từ khóa: "<strong>{state.searchTerm}</strong>"
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        {state.searchTerm && !state.loading && (
                            <button
                                onClick={clearSearch}
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
                        <Filter size={20} className="text-green-600" />
                        <span className="font-semibold text-gray-800 text-lg">Bộ lọc chi tiết</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            {state.showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                    </div>
                </div>

                {state.showFilters && (
                    <div className="border-t border-gray-200 p-6 bg-green-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên người đặt
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="userName"
                                        placeholder="Nhập tên người đặt..."
                                        value={filtersRef.current.userName}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                                        className="w-full border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                                        className="w-full border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái booking
                                </label>
                                <select
                                    name="status"
                                    value={filtersRef.current.status}
                                    onChange={handleFilterChange}
                                    className="w-full border border-gray-300 rounded-2xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    {state.statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
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
                                className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all duration-200"
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
                    <thead className="bg-green-100 border-b border-gray-200">
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
                            Trạng thái
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {state.bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-green-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                                        {booking.bookingCode}
                                    </div>
                                    <div className="font-medium text-gray-900 text-sm">
                                        {booking.user?.name}
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4">
                                <div className="max-w-[200px]">
                                    <div className="font-medium text-gray-900 text-sm">
                                        {booking.tourSchedule?.tour?.title}
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                                {formatDate(booking.tourSchedule?.startDate)}
                            </td>

                            <td className="px-6 py-4 text-center">
                                <div className="text-sm font-medium text-gray-900">
                                    {booking.numberOfPeople}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                                <div className="text-sm font-semibold text-green-600">
                                    {formatPrice(booking.paidAmount)}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                    <StatusBadge status={booking.status} />
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
                                        onClick={() => handleEditBooking(booking)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                        title="Chỉnh sửa thông tin"
                                    >
                                        <Edit size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleUpdateBooking(booking)}
                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                                        title="Cập nhật trạng thái"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {state.loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải danh sách booking...</p>
                    </div>
                </div>
            )}

            {!state.loading && state.bookings.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <div className="text-6xl mb-2">📋</div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có booking nào</h3>
                    <p className="text-gray-500 mb-4">
                        {state.searchTerm
                            ? `Không tìm thấy booking nào phù hợp với từ khóa "${state.searchTerm}"`
                            : "Hiện tại không có booking nào trong hệ thống."
                        }
                    </p>
                    {state.searchTerm && (
                        <button
                            onClick={clearAllFilters}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout>
            <div className="bg-gray-50 min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                📋 Quản lý Booking
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {state.searchTerm ?
                                    `🔍 Đang tìm kiếm: "${state.searchTerm}"` :
                                    'Quản lý toàn bộ đơn đặt tour và trạng thái booking'
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="flex-1 lg:flex-none lg:w-96">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên, email, điện thoại, mã booking, tour..."
                                        value={state.searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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

                            <button
                                onClick={() => updateState({ showCreateModal: true })}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200"
                            >
                                <Plus size={18} />
                                Tạo Booking
                            </button>
                        </div>
                    </div>

                    <SearchResultsIndicator />
                    <BookingStats />
                    <AdvancedFilters />
                    <BookingTable />
                    <Pagination />
                </div>

                <AdminCreateBookingModal
                    show={state.showCreateModal}
                    onClose={() => updateState({ showCreateModal: false })}
                    onCreate={handleCreateBooking}
                    loading={state.actionLoading}
                />

                <AdminUpdateBookingModal
                    show={state.showUpdateModal}
                    onClose={() => updateState({ showUpdateModal: false, selectedBooking: null })}
                    onUpdate={handleUpdateStatus}
                    onCancel={handleUpdateStatus}
                    onPayment={handlePayment}
                    booking={state.selectedBooking}
                    loading={state.actionLoading}
                />

                <AdminDeleteBookings
                    show={state.showEditModal}
                    onClose={() => updateState({ showEditModal: false, selectedBooking: null })}
                    onUpdate={handleUpdateBookingDetails}
                    booking={state.selectedBooking}
                    loading={state.actionLoading}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                />

                <AdminBookingDetailModal
                    show={state.showDetailModal}
                    onClose={() => updateState({ showDetailModal: false, selectedBooking: null })}
                    booking={state.selectedBooking}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    formatDateTime={formatDate}
                />
            </div>
        </AdminLayout>
    );
}

export default AdminBookingList;