import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Bell,
    Menu,
    LogOut,
    Settings,
    User,
    X,
    Crown,
    ChevronDown,
    Calendar,
    Home,
    CreditCard,
    MapPin,
    Mail,
    Clock,
    Eye,
    CheckCheck,
    TrendingUp,
    FileText,
    Wifi,
    WifiOff,
    RefreshCw
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {useAdminNotification} from "../../../context/AdminNotificationContext";
import {useAuth} from "../../../context/AuthContext";


const AdminHeaderComponent = ({ onToggleSidebar }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showAllNotificationsModal, setShowAllNotificationsModal] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // ✅ ADMIN NOTIFICATION CONTEXT
    const {
        notifications = [],
        unreadCount = 0,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        loading: notificationsLoading = false,
        isConnected,
        connectionStatus,
        reconnect,
        subscribeToAdminTopics
    } = useAdminNotification();

    // ✅ Mock data for monthly revenue
    const monthlyRevenue = 48856000;

    const defaultAvatar = "https://res.cloudinary.com/dnrxauvuu/image/upload/v1723456813/default-avatar.png";

    // ✅ Lọc chỉ thông báo chưa đọc
    const unreadNotifications = useMemo(() => {
        return notifications.filter(notification => !notification.isRead);
    }, [notifications]);

    // ✅ Auto subscribe admin topics khi component mount
    useEffect(() => {
        if (subscribeToAdminTopics) {
            console.log('⚡ AdminHeaderComponent - Subscribing to admin topics');
            subscribeToAdminTopics();
        }
    }, [subscribeToAdminTopics]);

    // ✅ Click outside handler
    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowUserMenu(false);
            handleCloseNotifications();
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    // ✅ Logout handler
    const handleLogout = useCallback(() => {
        logout();
        setShowUserMenu(false);
        setShowLogoutModal(false);
        navigate("/");
    }, [logout, navigate]);

    const openLogoutModal = useCallback(() => {
        setShowLogoutModal(true);
        setShowUserMenu(false);
    }, []);

    // ✅ Notification styling functions
    const getNotificationColor = useCallback((type) => {
        const colors = {
            SUCCESS: "from-green-50 to-emerald-50 border-green-200",
            WARNING: "from-amber-50 to-orange-50 border-amber-200",
            ERROR: "from-red-50 to-rose-50 border-red-200",
            INFO: "from-blue-50 to-cyan-50 border-blue-200",
            PAYMENT: "from-purple-50 to-violet-50 border-purple-200",
            PAYMENT_SUCCESS: "from-green-50 to-emerald-50 border-green-200",
            PAYMENT_FAILED: "from-red-50 to-rose-50 border-red-200",
            ADMIN_ALERT: "from-orange-50 to-red-50 border-orange-200",
            SYSTEM_ALERT: "from-purple-50 to-indigo-50 border-purple-200"
        };
        return colors[type] || colors.INFO;
    }, []);

    const getNotificationIcon = useCallback((type) => {
        const icons = {
            SUCCESS: '✅',
            WARNING: '⚠️',
            ERROR: '❌',
            INFO: '💡',
            PAYMENT: '💳',
            PAYMENT_SUCCESS: '💰',
            PAYMENT_FAILED: '💸',
            ADMIN_ALERT: '🔔',
            SYSTEM_ALERT: '⚡'
        };
        return icons[type] || icons.INFO;
    }, []);

    const getNotificationIconComponent = useCallback((type) => {
        const components = {
            SUCCESS: CheckCheck,
            WARNING: Calendar,
            ERROR: X,
            INFO: Bell,
            PAYMENT: CreditCard,
            PAYMENT_SUCCESS: CheckCheck,
            PAYMENT_FAILED: X,
            ADMIN_ALERT: Crown,
            SYSTEM_ALERT: TrendingUp
        };
        return components[type] || Bell;
    }, []);

    const getNotificationIconColor = useCallback((type) => {
        const colors = {
            SUCCESS: "text-green-600",
            WARNING: "text-amber-600",
            ERROR: "text-red-600",
            INFO: "text-blue-600",
            PAYMENT: "text-purple-600",
            PAYMENT_SUCCESS: "text-green-600",
            PAYMENT_FAILED: "text-red-600",
            ADMIN_ALERT: "text-orange-600",
            SYSTEM_ALERT: "text-purple-600"
        };
        return colors[type] || colors.INFO;
    }, []);

    const getNotificationTitle = useCallback((notification) => {
        if (notification.title) {
            return notification.title;
        }

        switch (notification.type) {
            case 'PAYMENT_SUCCESS':
                return 'Thanh toán thành công';
            case 'PAYMENT_FAILED':
                return 'Thanh toán thất bại';
            case 'ADMIN_ALERT':
                return 'Cảnh báo hệ thống';
            case 'SYSTEM_ALERT':
                return 'Thông báo quan trọng';
            case 'PAYMENT':
                return 'Thông báo thanh toán';
            default:
                return 'Thông báo hệ thống';
        }
    }, []);

    const getNotificationMessage = useCallback((notification) => {
        if (notification.message) {
            return notification.message;
        }
        return 'Có thông báo mới từ hệ thống quản trị';
    }, []);

    // ✅ Refresh notifications handler
    const handleRefreshNotifications = useCallback(async () => {
        if (refreshNotifications) {
            await refreshNotifications();
        }
    }, [refreshNotifications]);

    // ✅ Reconnect WebSocket handler
    const handleReconnect = useCallback(async () => {
        if (reconnect) {
            await reconnect();
        }
    }, [reconnect]);

    // ✅ Notification handlers với modal
    const handleNotificationClick = useCallback(async (notification) => {
        if (!notification.isRead && markAsRead) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        setSelectedNotification(notification);
        setShowNotificationModal(true);
        handleCloseNotifications();
    }, [markAsRead]);

    const handleMarkAllAsRead = useCallback(async () => {
        if (!markAllAsRead) return;

        setIsMarkingAll(true);
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    }, [markAllAsRead]);

    // ✅ Dropdown handlers với animation
    const toggleNotifications = useCallback(() => {
        if (showNotifications) {
            handleCloseNotifications();
        } else {
            setShowNotifications(true);
            setShowUserMenu(false);
            setIsClosing(false);
        }
    }, [showNotifications]);

    const toggleUserMenu = useCallback(() => {
        if (showUserMenu) {
            setShowUserMenu(false);
        } else {
            setShowUserMenu(true);
            handleCloseNotifications();
        }
    }, [showUserMenu]);

    const handleCloseNotifications = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setShowNotifications(false);
            setIsClosing(false);
        }, 200);
    }, []);

    // ✅ Format functions
    const formatNotificationTime = useCallback((timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Vừa xong';
            if (diffMins < 60) return `${diffMins} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            if (diffDays < 7) return `${diffDays} ngày trước`;

            return date.toLocaleDateString('vi-VN');
        } catch (error) {
            return '--:--';
        }
    }, []);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }, []);

    const formatDetailedTime = useCallback((timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '--:--';
        }
    }, []);

    // ✅ Connection status component
    const ConnectionStatus = useMemo(() => {
        const getStatusConfig = () => {
            switch (connectionStatus) {
                case 'connected':
                    return {
                        icon: Wifi,
                        color: 'text-green-500',
                        bgColor: 'bg-green-100',
                        borderColor: 'border-green-200',
                        text: 'Đã kết nối',
                        description: 'WebSocket đang hoạt động'
                    };
                case 'connecting':
                    return {
                        icon: RefreshCw,
                        color: 'text-blue-500',
                        bgColor: 'bg-blue-100',
                        borderColor: 'border-blue-200',
                        text: 'Đang kết nối...',
                        description: 'Đang thiết lập kết nối'
                    };
                case 'disconnected':
                    return {
                        icon: WifiOff,
                        color: 'text-gray-500',
                        bgColor: 'bg-gray-100',
                        borderColor: 'border-gray-200',
                        text: 'Ngắt kết nối',
                        description: 'Không thể kết nối WebSocket'
                    };
                case 'error':
                    return {
                        icon: WifiOff,
                        color: 'text-red-500',
                        bgColor: 'bg-red-100',
                        borderColor: 'border-red-200',
                        text: 'Lỗi kết nối',
                        description: 'Có lỗi xảy ra với kết nối'
                    };
                default:
                    return {
                        icon: WifiOff,
                        color: 'text-gray-500',
                        bgColor: 'bg-gray-100',
                        borderColor: 'border-gray-200',
                        text: 'Không xác định',
                        description: 'Trạng thái kết nối không xác định'
                    };
            }
        };

        const config = getStatusConfig();
        const StatusIcon = config.icon;

        return (
            <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border ${config.borderColor} cursor-pointer transition-all hover:scale-105`}
                onClick={handleReconnect}
                title={`${config.text} - ${config.description}`}
            >
                <StatusIcon size={14} className={config.color} />
                <span className={`text-xs font-medium ${config.color}`}>
                    {config.text}
                </span>
            </div>
        );
    }, [connectionStatus, handleReconnect]);

    // ✅ Render UNREAD notification items
    const renderUnreadNotificationItems = useCallback(() => {
        if (notificationsLoading) {
            return (
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 font-medium">Đang tải thông báo...</p>
                    <p className="text-xs text-gray-400 mt-1">Vui lòng chờ trong giây lát</p>
                </div>
            );
        }

        if (!unreadNotifications || unreadNotifications.length === 0) {
            return (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Không có thông báo mới</p>
                    <p className="text-xs text-gray-500">
                        Tất cả thông báo đã được đọc
                    </p>
                </div>
            );
        }

        const displayNotifications = unreadNotifications.slice(0, 5);

        return (
            <div className="space-y-3 p-3">
                {displayNotifications.map((notification, index) => {
                    const IconComponent = getNotificationIconComponent(notification.type);
                    const iconColor = getNotificationIconColor(notification.type);

                    return (
                        <div
                            key={`${notification.id}-${index}`}
                            className={`group p-4 rounded-xl border-2 bg-gradient-to-r cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${getNotificationColor(notification.type)}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center shadow-sm border border-gray-200`}>
                                        <IconComponent size={18} className={iconColor} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                                            {getNotificationTitle(notification)}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {notification.amount && (
                                                <span className="text-xs font-bold bg-white/90 px-2 py-1 rounded-lg text-green-600 border border-green-200 shadow-sm">
                                                    {formatCurrency(notification.amount)}
                                                </span>
                                            )}
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                        {getNotificationMessage(notification)}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            <span>{formatNotificationTime(notification.createdAt)}</span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Eye size={14} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {unreadNotifications.length > 5 && (
                    <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 text-center font-medium">
                            +{unreadNotifications.length - 5} thông báo chưa đọc khác
                        </p>
                    </div>
                )}
            </div>
        );
    }, [
        unreadNotifications,
        notificationsLoading,
        handleNotificationClick,
        getNotificationColor,
        getNotificationIconComponent,
        getNotificationIconColor,
        getNotificationTitle,
        getNotificationMessage,
        formatNotificationTime,
        formatCurrency
    ]);

    // ✅ Render ALL notification items (cho modal tất cả thông báo)
    const renderAllNotificationItems = useCallback(() => {
        if (notificationsLoading) {
            return (
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 font-medium">Đang tải thông báo...</p>
                    <p className="text-xs text-gray-400 mt-1">Vui lòng chờ trong giây lát</p>
                </div>
            );
        }

        if (!notifications || notifications.length === 0) {
            return (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Không có thông báo</p>
                    <p className="text-xs text-gray-500">
                        Sẵn sàng nhận thông báo
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3 p-3">
                {notifications.map((notification, index) => {
                    const IconComponent = getNotificationIconComponent(notification.type);
                    const iconColor = getNotificationIconColor(notification.type);

                    return (
                        <div
                            key={`${notification.id}-${index}`}
                            className={`group p-4 rounded-xl border-2 bg-gradient-to-r cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                                !notification.isRead
                                    ? getNotificationColor(notification.type)
                                    : 'from-gray-50 to-gray-100 border-gray-200'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                                        !notification.isRead
                                            ? 'bg-white/90 border-gray-200'
                                            : 'bg-gray-200/80 border-gray-300'
                                    }`}>
                                        <IconComponent size={18} className={iconColor} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className={`font-semibold text-sm line-clamp-1 ${
                                            !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                                        }`}>
                                            {getNotificationTitle(notification)}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {notification.amount && (
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border shadow-sm ${
                                                    !notification.isRead
                                                        ? 'bg-white/90 text-green-600 border-green-200'
                                                        : 'bg-gray-200/80 text-gray-500 border-gray-300'
                                                }`}>
                                                    {formatCurrency(notification.amount)}
                                                </span>
                                            )}
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>

                                    <p className={`text-sm line-clamp-2 mb-2 leading-relaxed ${
                                        !notification.isRead ? 'text-gray-600' : 'text-gray-500'
                                    }`}>
                                        {getNotificationMessage(notification)}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            <span>{formatNotificationTime(notification.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!notification.isRead ? (
                                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200">
                                                    Mới
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                                                    Đã đọc
                                                </span>
                                            )}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye size={14} className="text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }, [
        notifications,
        notificationsLoading,
        handleNotificationClick,
        getNotificationColor,
        getNotificationIconComponent,
        getNotificationIconColor,
        getNotificationTitle,
        getNotificationMessage,
        formatNotificationTime,
        formatCurrency
    ]);

    // ✅ User avatar component với fallback an toàn
    const UserAvatar = useMemo(() => (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border border-white shadow-sm overflow-hidden">
            {user?.avatar && !imageError ? (
                <img
                    src={user.avatar}
                    alt="Admin"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            ) : (
                <span className="text-white font-bold text-xs">
                    {user?.fullName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'A'}
                </span>
            )}
        </div>
    ), [user, imageError]);

    // ✅ Safe customer info
    const userInfo = useMemo(() => ({
        fullName: user?.fullName || user?.name || "Administrator",
        email: user?.email || "admin@travelgo.com"
    }), [user]);

    return (
        <>
            <header className="w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Left Section - Logo & Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleSidebar}
                            className="group flex items-center justify-center w-10 h-10 text-gray-500 hover:text-green-600 hover:bg-gray-50 rounded-xl transition-all duration-300"
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={20} className="group-hover:scale-110 transition-transform" />
                        </button>

                        <Link to="/admin" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Crown size={18} className="text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                                    TravelGo Admin
                                </h1>
                                <p className="text-xs text-gray-500 leading-tight">
                                    Hệ thống quản trị
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-2" ref={dropdownRef}>
                        {/* Connection Status */}
                        {ConnectionStatus}

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={toggleNotifications}
                                className="group relative flex items-center justify-center w-10 h-10 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-xl transition-all duration-300 shadow-sm border border-gray-200 bg-white"
                                aria-label="Thông báo"
                                disabled={notificationsLoading}
                                title={`Thông báo (${unreadCount} chưa đọc)`}
                            >
                                <Bell size={18} className="group-hover:scale-110 transition-transform" />

                                {/* Unread count badge */}
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-sm animate-bounce">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className={`absolute right-0 top-14 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 transform transition-all duration-300 ${
                                    isClosing
                                        ? 'opacity-0 scale-95 translate-y-2'
                                        : 'opacity-100 scale-100 translate-y-0'
                                }`}>
                                    {/* Header */}
                                    <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 rounded-t-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-xl text-gray-900 mb-2">Thông báo Admin</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-600 font-medium">
                                                        {unreadCount} chưa đọc
                                                    </span>
                                                    <div className="w-px h-4 bg-gray-300"></div>
                                                    <span className="text-sm text-gray-600">
                                                        {notifications.length} thông báo
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={handleRefreshNotifications}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                                    title="Làm mới thông báo"
                                                    disabled={notificationsLoading}
                                                >
                                                    <FileText size={16} className={notificationsLoading ? 'animate-spin' : ''} />
                                                </button>
                                                <button
                                                    onClick={handleCloseNotifications}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                                    aria-label="Đóng thông báo"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Connection Status in Dropdown */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={`font-medium ${
                                                    isConnected ? 'text-green-600' : 'text-amber-600'
                                                }`}>
                                                    {isConnected ? '🟢 Đang nhận thông báo' : '🟡 Đang kết nối...'}
                                                </span>
                                            </div>
                                            {!isConnected && (
                                                <button
                                                    onClick={handleReconnect}
                                                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                    title="Kết nối lại WebSocket"
                                                >
                                                    <RefreshCw size={12} className="inline mr-1" />
                                                    Kết nối lại
                                                </button>
                                            )}
                                        </div>

                                        {/* Quick Actions */}
                                        {unreadCount > 0 && (
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 shadow-sm"
                                                    disabled={isMarkingAll || notificationsLoading}
                                                >
                                                    <CheckCheck size={14} />
                                                    {isMarkingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notifications List */}
                                    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {renderUnreadNotificationItems()}
                                    </div>

                                    {/* Footer với CTA */}
                                    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-2xl">
                                        <button
                                            className="w-full group flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]"
                                            onClick={() => {
                                                setShowAllNotificationsModal(true);
                                                handleCloseNotifications();
                                            }}
                                        >
                                            <Eye size={16} />
                                            Xem tất cả thông báo
                                            <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                                                {notifications.length}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={toggleUserMenu}
                                className="group flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-all duration-300"
                                aria-label="Menu người dùng"
                            >
                                {UserAvatar}
                                <ChevronDown
                                    size={14}
                                    className={`text-gray-400 group-hover:text-green-600 transition-all duration-300 ${
                                        showUserMenu ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {/* User Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 transform transition-all duration-200">
                                    {/* Header */}
                                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-xl text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                                                <Crown size={16} className="text-yellow-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">
                                                    {userInfo.fullName}
                                                </p>
                                                <p className="text-green-100 text-xs truncate mt-0.5">
                                                    {userInfo.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <Link
                                            to="/"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 text-gray-700 transition-colors text-sm group"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <Home size={16} className="text-green-600 group-hover:scale-110 transition-transform" />
                                            <span>Về trang chủ</span>
                                        </Link>
                                        <Link
                                            to="/admin/profile"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 text-gray-700 transition-colors text-sm group"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <User size={16} className="text-green-600 group-hover:scale-110 transition-transform" />
                                            <span>Hồ sơ của tôi</span>
                                        </Link>
                                        <Link
                                            to="/admin/settings"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 text-gray-700 transition-colors text-sm group"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <Settings size={16} className="text-green-600 group-hover:scale-110 transition-transform" />
                                            <span>Cài đặt hệ thống</span>
                                        </Link>
                                    </div>

                                    <div className="p-2 border-t border-gray-200">
                                        <button
                                            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-red-50 text-red-600 transition-colors text-sm font-medium group"
                                            onClick={openLogoutModal}
                                        >
                                            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ✅ MODAL TẤT CẢ THÔNG BÁO */}
            {showAllNotificationsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <FileText size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-xl">Tất cả thông báo</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {unreadCount} chưa đọc / {notifications.length} tổng số
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium border border-blue-200"
                                            disabled={isMarkingAll || notificationsLoading}
                                        >
                                            {isMarkingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowAllNotificationsModal(false)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                        aria-label="Đóng modal"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body - TẤT CẢ THÔNG BÁO */}
                        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {renderAllNotificationItems()}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500">
                                    Hiển thị {notifications.length} thông báo
                                </p>
                                <button
                                    onClick={() => setShowAllNotificationsModal(false)}
                                    className="py-2 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Detail Modal */}
            {showNotificationModal && selectedNotification && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg border-2 ${getNotificationColor(selectedNotification.type)}`}>
                                        <span className="text-xl">{getNotificationIcon(selectedNotification.type)}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-xl">Chi tiết thông báo</h3>
                                        <p className="text-sm text-gray-600 mt-1">Thông tin đầy đủ</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                    aria-label="Đóng modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-6">
                                {/* Main Content */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <h4 className="font-bold text-gray-900 text-lg mb-3">
                                        {getNotificationTitle(selectedNotification)}
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {selectedNotification.message || 'Không có nội dung chi tiết'}
                                    </p>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Thời gian */}
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock size={16} className="text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">Thời gian</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">
                                            {formatDetailedTime(selectedNotification.createdAt)}
                                        </p>
                                    </div>

                                    {/* Trạng thái */}
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bell size={16} className="text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">Trạng thái</span>
                                        </div>
                                        <p className={`font-medium ${selectedNotification.isRead ? 'text-green-600' : 'text-blue-600'}`}>
                                            {selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                        </p>
                                    </div>

                                    {/* Số tiền */}
                                    {selectedNotification.amount && (
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 md:col-span-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard size={16} className="text-green-600" />
                                                <span className="text-sm font-medium text-green-700">Số tiền</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-600">
                                                {selectedNotification.amount.toLocaleString()} VND
                                            </p>
                                        </div>
                                    )}

                                    {/* Tour */}
                                    {selectedNotification.tourName && (
                                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 md:col-span-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin size={16} className="text-purple-600" />
                                                <span className="text-sm font-medium text-purple-700">Tour</span>
                                            </div>
                                            <p className="text-gray-900 font-medium">
                                                {selectedNotification.tourName}
                                            </p>
                                        </div>
                                    )}

                                    {/* Khách hàng */}
                                    {selectedNotification.userEmail && (
                                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 md:col-span-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Mail size={16} className="text-orange-600" />
                                                <span className="text-sm font-medium text-orange-700">Khách hàng</span>
                                            </div>
                                            <p className="text-gray-900 font-medium">
                                                {selectedNotification.userEmail}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors text-center"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 transform transition-all duration-200 scale-100">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                    <LogOut size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Xác nhận đăng xuất</h3>
                                    <p className="text-sm text-gray-600">Hành động quan trọng</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Đóng modal"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <LogOut size={24} className="text-red-500" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-lg">
                                Đăng xuất khỏi hệ thống?
                            </h4>
                            <p className="text-gray-600 text-sm">
                                Bạn có chắc muốn đăng xuất tài khoản quản trị?
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={16} />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default React.memo(AdminHeaderComponent);