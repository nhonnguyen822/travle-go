import React, {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {Pencil, Trash2, Plus, Search, Eye, Filter, Calendar} from "lucide-react";
import {deleteTourById, getPagedTours} from "../../../service/tour_service";
import AdminLayout from "../layout/AdminLayout";


const AdminTourList = () => {
    const [tours, setTours] = useState([]);
    const [filters, setFilters] = useState({
        title: "",
        destination: "",
        minPrice: "",
        maxPrice: "",
        status: "",
    });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Modal thông báo - CẬP NHẬT GIỐNG TOUR DETAIL
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "warning",
        onConfirm: null,
        tourToDelete: null,
    });

    const size = 10;

    useEffect(() => {
        fetchTours();
    }, [page, filters]);

    const fetchTours = async () => {
        setLoading(true);
        try {
            const res = await getPagedTours({
                page,
                size,
                ...filters,
            });

            if (Array.isArray(res)) {
                setTours(res);
                setTotalPages(1);
            } else {
                setTours(res.content || []);
                setTotalPages(res.totalPages || 0);
            }
        } catch (err) {
            console.error("❌ Lỗi tải danh sách tour:", err);
            showAlert("Thông báo", "Không thể tải danh sách tour. Vui lòng thử lại.", "warning");
        } finally {
            setLoading(false);
        }
    };

    // Hàm hiển thị modal thông báo - CẬP NHẬT GIỐNG TOUR DETAIL
    const showAlert = (title, message, type = "warning", onConfirm = null, tourToDelete = null) => {
        setAlertModal({
            isOpen: true,
            title,
            message,
            type,
            onConfirm,
            tourToDelete,
        });
    };

    // Hàm đóng modal thông báo - CẬP NHẬT GIỐNG TOUR DETAIL
    const closeAlert = () => {
        setAlertModal({
            isOpen: false,
            title: "",
            message: "",
            type: "warning",
            onConfirm: null,
            tourToDelete: null,
        });
        setDeleteLoading(false);
    };

    const handleDeleteClick = (tour) => {
        showAlert(
            "Xác nhận xóa tour",
            `Bạn có chắc muốn xóa tour "${tour.title}"? Tất cả dữ liệu liên quan sẽ bị ẩn khỏi hệ thống và không thể khôi phục.`,
            "warning",
            async () => {
                setDeleteLoading(true);
                try {
                    const response = await deleteTourById(tour.id);
                    showAlert("Thành công", `Đã xóa tour "${tour.title}" thành công`, "success");
                    fetchTours();
                } catch (err) {
                    console.error("❌ Lỗi xóa tour:", err);

                    let errorMessage = "Không thể xóa tour. Vui lòng thử lại.";
                    if (err.response && err.response.data) {
                        errorMessage = err.response.data.message || errorMessage;
                    } else if (err.message) {
                        errorMessage = err.message;
                    }

                    showAlert("Có lỗi xảy ra", errorMessage, "warning");
                } finally {
                    setDeleteLoading(false);
                }
            },
            tour
        );
    };

    const handleFilterChange = (e) => {
        const {name, value} = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({
            title: "",
            destination: "",
            minPrice: "",
            maxPrice: "",
            status: "",
        });
        setPage(0);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            ACTIVE: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Active' },
            INACTIVE: { color: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Inactive' },
            DRAFT: { color: 'bg-gray-100 text-gray-600 border border-gray-300', label: 'Draft' }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // Hàm xác định màu sắc cho modal thông báo - CẬP NHẬT GIỐNG TOUR DETAIL
    const getAlertModalStyles = () => {
        switch (alertModal.type) {
            case "success":
                return {
                    borderColor: "border-green-500",
                    icon: "✅",
                    iconComponent: (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ),
                    title: "text-green-600",
                    button: "bg-green-600 hover:bg-green-700",
                };
            case "warning":
                return {
                    borderColor: "border-yellow-500",
                    icon: "⚠️",
                    iconComponent: (
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    ),
                    title: "text-yellow-600",
                    button: "bg-yellow-600 hover:bg-yellow-700",
                    cancelButton: "bg-gray-500 hover:bg-gray-600",
                };
            case "error":
                return {
                    borderColor: "border-red-500",
                    icon: "❌",
                    iconComponent: (
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ),
                    title: "text-red-600",
                    button: "bg-red-600 hover:bg-red-700",
                };
            default:
                return {
                    borderColor: "border-blue-500",
                    icon: "ℹ️",
                    iconComponent: (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    ),
                    title: "text-blue-600",
                    button: "bg-blue-600 hover:bg-blue-700",
                };
        }
    };

    const modalStyles = getAlertModalStyles();

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            🗂️ Quản lý Tour
                        </h1>
                        <p className="text-gray-600 mt-1">Quản lý danh sách tour du lịch và thông tin chi tiết</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/*<button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200">*/}
                        {/*    <Download size={18} />*/}
                        {/*    Xuất file*/}
                        {/*</button>*/}
                        <Link
                            to="/admin/tours/create"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                            <Plus size={18} />
                            Thêm tour mới
                        </Link>
                    </div>
                </div>

                {/* Bộ lọc nâng cao */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <div className="flex items-center gap-3">
                            <Filter size={20} className="text-green-600" />
                            <span className="font-semibold text-gray-800 text-lg">Bộ lọc và Tìm kiếm</span>
                        </div>
                        <div className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="border-t border-gray-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Tên tour */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên tour
                                    </label>
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            name="title"
                                            placeholder="Nhập tên tour..."
                                            value={filters.title}
                                            onChange={handleFilterChange}
                                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Điểm đến */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm đến
                                    </label>
                                    <input
                                        type="text"
                                        name="destination"
                                        placeholder="Nhập điểm đến..."
                                        value={filters.destination}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* Khoảng giá */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khoảng giá
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name="minPrice"
                                            placeholder="Tối thiểu"
                                            value={filters.minPrice}
                                            onChange={handleFilterChange}
                                            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        />
                                        <span className="self-center text-gray-400">-</span>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            placeholder="Tối đa"
                                            value={filters.maxPrice}
                                            onChange={handleFilterChange}
                                            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Trạng thái */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="ACTIVE">Đang hoạt động</option>
                                        <option value="INACTIVE">Tạm ngưng</option>
                                        <option value="DRAFT">Bản nháp</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                                >
                                    Xóa bộ lọc
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
                                >
                                    Áp dụng bộ lọc
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bảng tour */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-green-100 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Tour
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Điểm đến
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Thời lượng
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Giá
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
                            {tours.map((tour) => (
                                <tr key={tour.id} className="hover:bg-green-50 transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={tour.image}
                                                alt={tour.title}
                                                className="w-16 h-12 object-cover rounded-lg shadow-sm"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm line-clamp-2">
                                                    {tour.title}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{tour.destination}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                            <Calendar size={16} />
                                            {tour.duration === 1 ? '1 ngày' : `${tour.duration} ngày ${tour.duration - 1} đêm`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-semibold text-green-600">
                                            {tour.basePrice?.toLocaleString('vi-VN')}₫
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(tour.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                to={`/admin/tours/${tour.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                            <Link
                                                to={`/admin/tours/edit/${tour.id}`}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteClick(tour)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                title="Xóa tour"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Đang tải danh sách tour...</p>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && tours.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <div className="text-6xl mb-2">🗺️</div>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có tour nào</h3>
                            <p className="text-gray-500 mb-4">Không tìm thấy tour nào phù hợp với bộ lọc của bạn.</p>
                            <Link
                                to="/admin/tours/create"
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
                            >
                                <Plus size={16} />
                                Thêm tour đầu tiên
                            </Link>
                        </div>
                    )}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-medium">{(page * size) + 1}-{Math.min((page + 1) * size, tours.length)}</span> trong tổng số <span className="font-medium">{tours.length}</span> tour
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Trước
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNumber = i + Math.max(0, page - 2);
                                    if (pageNumber >= totalPages) return null;
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setPage(pageNumber)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                page === pageNumber
                                                    ? 'bg-green-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {pageNumber + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                disabled={page + 1 === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                Sau
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal thông báo - CẬP NHẬT GIỐNG TOUR DETAIL */}
                {alertModal.isOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    {modalStyles.iconComponent}
                                    <div>
                                        <h3 className={`text-lg font-semibold ${modalStyles.title}`}>
                                            {alertModal.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {alertModal.type === "warning" ? "Hành động này không thể hoàn tác" : ""}
                                        </p>
                                    </div>
                                </div>

                                {alertModal.type === "warning" && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-yellow-800">
                                            {alertModal.message}
                                        </p>
                                    </div>
                                )}

                                {alertModal.type === "success" && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-green-800">
                                            {alertModal.message}
                                        </p>
                                    </div>
                                )}

                                {alertModal.type === "error" && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-red-800">
                                            {alertModal.message}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    {alertModal.type === "warning" ? (
                                        <>
                                            <button
                                                onClick={closeAlert}
                                                disabled={deleteLoading}
                                                className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (alertModal.onConfirm) {
                                                        alertModal.onConfirm();
                                                    }
                                                }}
                                                disabled={deleteLoading}
                                                className="px-4 py-2.5 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                                            >
                                                {deleteLoading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Đang xử lý...
                                                    </>
                                                ) : (
                                                    'Xác nhận'
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={closeAlert}
                                            className={`px-4 py-2.5 ${modalStyles.button} text-white rounded-xl transition-all duration-200 flex items-center gap-2`}
                                        >
                                            Đã hiểu
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminTourList;