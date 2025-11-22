import React, {useEffect, useRef, useState} from "react";
import {ChevronDown, ChevronUp, Filter, RefreshCw, Search, Users, UserCheck, Crown, Shield, Eye, Mail, Phone, Calendar, MapPin, IdCard, Lock, Unlock, Star, Award, Gem, Sparkles} from "lucide-react";
import {
    getAllCustomers,
    getCustomerById,
    updateCustomerStatus,
    updateCustomerType
} from "../../../service/admin/usersService";
import AdminLayout from "../layout/AdminLayout";
import NotificationModal from "./NotificationModal";

const AdminCustomerManagement = () => {
    const [filters, setFilters] = useState({
        page: 0,
        size: 10,
        search: "",
        customerType: "",
        status: ""
    });

    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({
        totalPages: 0,
        totalElements: 0,
        currentPage: 0
    });
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [customerToAction, setCustomerToAction] = useState(null);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [customerToUpdateType, setCustomerToUpdateType] = useState(null);


    const [notificationModal, setNotificationModal] = useState({
        isOpen: false,
        type: 'success', // 'success', 'error', 'warning', 'info'
        title: '',
        message: '',
        details: ''
    });

    const searchRef = useRef(null);

    const customerTypeConfig = {
        'NEW': { name: 'Mới', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Star },
        'REGULAR': { name: 'Thường', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Shield },
        'SILVER': { name: 'Bạc', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Award },
        'GOLD': { name: 'Vàng', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Crown },
        'VIP': { name: 'VIP', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Crown },
        'PLATINUM': { name: 'Bạch Kim', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: Gem },
        'DIAMOND': { name: 'Kim Cương', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Sparkles }
    };

    const showNotification = (type, title, message = '', details = '') => {
        setNotificationModal({
            isOpen: true,
            type,
            title,
            message,
            details
        });
    };

    const closeNotification = () => {
        setNotificationModal(prev => ({
            ...prev,
            isOpen: false
        }));
    };

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await getAllCustomers(
                filters.page,
                filters.size,
                filters.search || "",
                filters.customerType || "",
                filters.status === "" ? "" : filters.status
            );

            setCustomers(data.content || []);
            setPagination({
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0,
                currentPage: data.number || 0
            });
        } catch (error) {
            console.error("Không thể  tải khách hàng:", error);
            showNotification(
                'error',
                'Không thể tải dữ liệu',
                'Không thể tải danh sách khách hàng',
                error.error || error.message
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, [filters.page, filters.size, filters.customerType, filters.status, filters.search]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 0
        }));
    };

    const handleResetFilters = () => {
        setFilters({
            page: 0,
            size: 10,
            search: "",
            customerType: "",
            status: ""
        });
        if (searchRef.current) {
            searchRef.current.value = "";
        }
    };

    const showConfirmation = (customer, type) => {
        setCustomerToAction(customer);
        setActionType(type);
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        if (!customerToAction) return;

        try {
            if (actionType === 'lock') {
                await updateCustomerStatus(customerToAction.id, 0);
                showNotification(
                    'success',
                    'Thành công',
                    `Đã vô hiệu hóa khách hàng ${customerToAction.name} thành công!`
                );
            } else if (actionType === 'unlock') {
                await updateCustomerStatus(customerToAction.id, 1);
                showNotification(
                    'success',
                    'Thành công',
                    `Đã kích hoạt khách hàng ${customerToAction.name} thành công!`
                );
            }
            await loadCustomers();
            setShowConfirmModal(false);
            setCustomerToAction(null);
            setActionType('');
        } catch (error) {
            console.error("Không thể  cập nhật trạng thái:", error);
            setShowConfirmModal(false);
            setCustomerToAction(null);
            setActionType('');
            showNotification(
                'error',
                'Cập nhập thất bại',
                error.error || 'Không thể cập nhật trạng thái',
                error.details || error.message
            );
        }
    };

    const showTypeUpdateModal = (customer) => {
        setCustomerToUpdateType(customer);
        setShowTypeModal(true);
    };

    const handleUpdateType = async (newType) => {
        if (!customerToUpdateType) return;
        try {
            await updateCustomerType(customerToUpdateType.id, newType);
            const typeName = customerTypeConfig[newType]?.name || newType;
            const currentTypeName = customerTypeConfig[customerToUpdateType.customerType]?.name || customerToUpdateType.customerType;

            showNotification(
                'success',
                'Cập nhật thành công',
                `Đã cập nhật loại khách hàng ${customerToUpdateType.name} từ ${currentTypeName} thành ${typeName}!`
            );

            await loadCustomers();
            setShowTypeModal(false);
            setCustomerToUpdateType(null);
        } catch (error) {
            console.error("Không thể cập nhật loại khách hàng:", error);
            showNotification(
                'error',
                'Không thể  cập nhật loại khách hàng',
                error.error || 'Có lỗi xảy ra khi cập nhật loại khách hàng',
                error.details || error.message
            );
        }
    };

    const handleViewDetail = async (customerId) => {
        try {
            const customer = await getCustomerById(customerId);
            setSelectedCustomer(customer);
            setShowDetailModal(true);
        } catch (error) {
            showNotification(
                'error',
                'Không thể  tải thông tin',
                'Không thể tải thông tin chi tiết khách hàng',
                error.error || error.message
            );
        }
    };

    const displayValue = (value, placeholder = "Chưa cập nhật") => {
        return value || placeholder;
    };


    const renderCustomerType = (customerType) => {
        const config = customerTypeConfig[customerType] || {
            name: customerType,
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: Shield
        };
        const IconComponent = config.icon;

        return (
            <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
                <IconComponent className="w-3 h-3 mr-1" />
                {config.name}
            </span>
        );
    };

    return (
        <AdminLayout children={
            <div className="min-h-screen bg-gray-50/30 p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Khách hàng</h1>
                    <p className="text-gray-600">Quản lý thông tin và trạng thái khách hàng hệ thống</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                    {Object.entries(customerTypeConfig).map(([type, config]) => {
                        const IconComponent = config.icon;
                        return (
                            <div key={type} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600">{config.name}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {customers.filter(c => c.customerType === type).length}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-xl ${config.color.split(' ')[0]} bg-opacity-20`}>
                                        <IconComponent className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bộ lọc và tìm kiếm */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Bộ lọc và Tìm kiếm</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 border border-green-500 rounded-lg hover:bg-green-50 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Làm mới
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tìm kiếm khách hàng
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên, email, số điện thoại..."
                                        ref={searchRef}
                                        defaultValue={filters.search}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleFilterChange("search", searchRef.current.value);
                                            }
                                        }}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange("search", searchRef.current.value)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại khách hàng
                                </label>
                                <select
                                    value={filters.customerType}
                                    onChange={(e) => handleFilterChange("customerType", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                >
                                    <option value="">Tất cả</option>
                                    {Object.entries(customerTypeConfig).map(([type, config]) => (
                                        <option key={type} value={type}>
                                            {config.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="1">Hoạt động</option>
                                    <option value="0">Ngừng hoạt động</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                    Thông tin liên hệ
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                    Loại
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                    Thao tác
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                                <div className="ml-3 space-y-2">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium mb-1">Không có khách hàng nào</p>
                                            <p className="text-sm">Hãy thử thay đổi bộ lọc hoặc tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 w-10 h-10">
                                                    {customer.avatar ? (
                                                        <img
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                            src={customer.avatar}
                                                            alt={customer.name}
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm border border-green-200">
                                                            {customer.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {displayValue(customer.name)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {displayValue(customer.customerCode)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm text-gray-900 truncate max-w-[200px]">
                                                        {displayValue(customer.email)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm text-gray-500">
                                                        {displayValue(customer.phone)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex justify-start">
                                                <button
                                                    onClick={() => showTypeUpdateModal(customer)}
                                                    className="hover:opacity-80 transition-opacity"
                                                    title="Click để thay đổi loại khách hàng"
                                                >
                                                    {renderCustomerType(customer.customerType)}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex justify-start">
                <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        customer.status === 1
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                        customer.status ==+1 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {customer.status ==+ 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">

                                                <button
                                                    onClick={() => handleViewDetail(customer.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {customer.status == 1 ? (
                                                    <button
                                                        onClick={() => showConfirmation(customer, 'lock')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                                        title="Vô hiệu hóa tài khoản"
                                                    >
                                                        <Lock className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => showConfirmation(customer, 'unlock')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 hover:border-green-300"
                                                        title="Kích hoạt tài khoản"
                                                    >
                                                        <Unlock className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-700">
                                    Hiển thị {customers.length} của {pagination.totalElements} khách hàng
                                </p>
                                <div className="flex gap-2">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleFilterChange('page', i)}
                                            disabled={loading}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                filters.page === i
                                                    ? 'bg-green-600 text-white shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-200 border border-gray-300'
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showConfirmModal && customerToAction && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
                            <div className={`p-6 ${actionType === 'lock' ? 'bg-red-500' : 'bg-green-500'}`}>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        {actionType === 'lock' ? (
                                            <Lock className="w-6 h-6 text-white" />
                                        ) : (
                                            <Unlock className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">
                                            {actionType === 'lock' ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                                        </h3>
                                        <p className="text-red-100 font-medium">
                                            {customerToAction.name} - {customerToAction.customerCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                        {actionType === 'lock' ? (
                                            <Lock className="h-6 w-6 text-red-600" />
                                        ) : (
                                            <Unlock className="h-6 w-6 text-green-600" />
                                        )}
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {actionType === 'lock' ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt tài khoản?'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {actionType === 'lock'
                                            ? `Bạn có chắc chắn muốn vô hiệu hóa tài khoản của ${customerToAction.name}? Khách hàng này sẽ không thể đăng nhập vào hệ thống.`
                                            : `Bạn có chắc chắn muốn kích hoạt tài khoản của ${customerToAction.name}? Khách hàng này sẽ có thể đăng nhập vào hệ thống.`
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setCustomerToAction(null);
                                        setActionType('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    className={`px-4 py-2 text-white rounded-xl font-medium transition-colors ${
                                        actionType === 'lock'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {actionType === 'lock' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showTypeModal && customerToUpdateType && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Cập nhật loại khách hàng</h3>
                                        <p className="text-purple-100 font-medium">
                                            {customerToUpdateType.name} - {customerToUpdateType.customerCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                                        <Crown className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Chọn loại khách hàng mới
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Hiện tại: <span className="font-medium">
                                            {customerTypeConfig[customerToUpdateType.customerType]?.name || customerToUpdateType.customerType}
                                        </span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(customerTypeConfig).map(([type, config]) => {
                                        const IconComponent = config.icon;
                                        const isCurrentType = type === customerToUpdateType.customerType;

                                        return (
                                            <button
                                                key={type}
                                                onClick={() => handleUpdateType(type)}
                                                disabled={isCurrentType}
                                                className={`p-4 rounded-xl border-2 transition-all ${
                                                    isCurrentType
                                                        ? 'border-purple-500 bg-purple-50 cursor-not-allowed'
                                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <IconComponent className={`w-4 h-4 ${
                                                        isCurrentType ? 'text-purple-600' : 'text-gray-600'
                                                    }`} />
                                                    <span className={`text-sm font-medium ${
                                                        isCurrentType ? 'text-purple-700' : 'text-gray-700'
                                                    }`}>
                                                        {config.name}
                                                    </span>
                                                </div>
                                                {isCurrentType && (
                                                    <div className="mt-1 text-xs text-purple-600 font-medium">
                                                        Đang chọn
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowTypeModal(false);
                                        setCustomerToUpdateType(null);
                                    }}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDetailModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200">
                            {/* Header với gradient */}
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {selectedCustomer.avatar ? (
                                            <img
                                                className="w-16 h-16 rounded-full border-4 border-white/30 object-cover shadow-lg"
                                                src={selectedCustomer.avatar}
                                                alt={selectedCustomer.name}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                                {selectedCustomer.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{displayValue(selectedCustomer.name)}</h3>
                                            <p className="text-green-100 font-medium">{displayValue(selectedCustomer.customerCode)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <span className="text-2xl font-bold">×</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Thông tin cá nhân */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-blue-100 rounded-xl">
                                                <UserCheck className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4" />
                                                    Họ tên
                                                </span>
                                                <span className="text-sm font-medium text-gray-900">{displayValue(selectedCustomer.name)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    Email
                                                </span>
                                                <span className="text-sm text-gray-900">{displayValue(selectedCustomer.email)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    Số điện thoại
                                                </span>
                                                <span className="text-sm text-gray-900">{displayValue(selectedCustomer.phone)}</span>
                                            </div>
                                            {selectedCustomer.dateOfBirth && (
                                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                    <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Ngày sinh
                                                    </span>
                                                    <span className="text-sm text-gray-900">
                                                        {new Date(selectedCustomer.dateOfBirth).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-purple-100 rounded-xl">
                                                <Shield className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600">Mã khách hàng</span>
                                                <span className="text-sm font-medium text-gray-900">{displayValue(selectedCustomer.customerCode)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600">Loại khách hàng</span>
                                                {renderCustomerType(selectedCustomer.customerType)}
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600">Trạng thái</span>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                                    selectedCustomer.status == 1
                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                        : 'bg-red-100 text-red-800 border-red-200'
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                        selectedCustomer.status == 1 ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></div>
                                                    {selectedCustomer.status == 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                <span className="text-sm font-medium text-gray-600">Ngày tạo</span>
                                                <span className="text-sm text-gray-900">
                                                    {selectedCustomer.createdAt ?
                                                        new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(selectedCustomer.address || selectedCustomer.identityNumber) && (
                                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <IdCard className="w-5 h-5" />
                                            Thông tin bổ sung
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {selectedCustomer.address && (
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">Địa chỉ</span>
                                                        <p className="text-sm text-gray-900 mt-1">{selectedCustomer.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedCustomer.identityNumber && (
                                                <div className="flex items-start gap-3">
                                                    <IdCard className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">CMND/CCCD</span>
                                                        <p className="text-sm text-gray-900 mt-1">{selectedCustomer.identityNumber}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Modal */}
                <NotificationModal
                    isOpen={notificationModal.isOpen}
                    onClose={closeNotification}
                    type={notificationModal.type}
                    title={notificationModal.title}
                    message={notificationModal.message}
                    details={notificationModal.details}
                />
            </div>
        }/>
    );
};

export default AdminCustomerManagement;