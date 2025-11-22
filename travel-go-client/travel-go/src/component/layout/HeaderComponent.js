import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaBars,
    FaTimes,
    FaUserCircle,
    FaChevronDown,
    FaBell,
    FaMapMarkerAlt,
    FaCreditCard,
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaEye
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const HeaderComponent = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    const headerRef = useRef();
    const menuRef = useRef();
    const userDropdownRef = useRef();
    const notificationRef = useRef();
    const navigate = useNavigate();

    const { user, logout, isAuthenticated } = useAuth();

    // Mock data for notifications (có thể thay thế bằng API call)
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        setUserDropdownOpen(false);
        setShowNotifications(false);
        navigate("/");
    };

    // Lấy chiều cao header
    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Đóng menu khi click ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Đóng menu mobile
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            // Đóng user dropdown
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
            // Đóng notifications
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch notifications từ API (mock function)
    const fetchNotifications = useCallback(async () => {
        setNotificationsLoading(true);
        try {
            // Mock data - thay thế bằng API call thực tế
            const mockNotifications = [
                {
                    id: 1,
                    type: 'BOOKING_CONFIRMED',
                    title: 'Đặt tour thành công',
                    message: 'Tour Hạ Long của bạn đã được xác nhận',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    amount: 2500000,
                    tourName: 'Hạ Long 2 ngày 1 đêm'
                },
                {
                    id: 2,
                    type: 'TOUR_REMINDER',
                    title: 'Nhắc nhở tour',
                    message: 'Tour Sapa của bạn sẽ diễn ra vào ngày mai',
                    isRead: true,
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    tourName: 'Sapa 3 ngày 2 đêm'
                }
            ];
            setNotifications(mockNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setNotificationsLoading(false);
        }
    }, []);

    // Mark as read function
    const markAsRead = useCallback(async (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, isRead: true } : notif
            )
        );
    }, []);

    // Mark all as read function
    const markAllAsRead = useCallback(async () => {
        setIsMarkingAll(true);
        try {
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    }, []);

    // Refresh notifications
    const refreshNotifications = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Fetch notifications khi component mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated, fetchNotifications]);

    // Notification functions
    const getNotificationColor = useCallback((type) => {
        const colors = {
            SUCCESS: "bg-green-50 border-green-200",
            WARNING: "bg-amber-50 border-amber-200",
            ERROR: "bg-red-50 border-red-200",
            INFO: "bg-blue-50 border-blue-200",
            PAYMENT: "bg-purple-50 border-purple-200",
            PAYMENT_SUCCESS: "bg-green-50 border-green-200",
            PAYMENT_FAILED: "bg-red-50 border-red-200",
            BOOKING_CONFIRMED: "bg-green-50 border-green-200",
            BOOKING_CANCELLED: "bg-red-50 border-red-200",
            TOUR_REMINDER: "bg-blue-50 border-blue-200",
            USER_NOTIFICATION: "bg-blue-50 border-blue-200"
        };
        return colors[type] || colors.INFO;
    }, []);

    const getNotificationIcon = useCallback((type) => {
        const icons = {
            SUCCESS: FaCheckCircle,
            WARNING: FaExclamationTriangle,
            ERROR: FaExclamationTriangle,
            INFO: FaInfoCircle,
            PAYMENT: FaCreditCard,
            PAYMENT_SUCCESS: FaCheckCircle,
            PAYMENT_FAILED: FaExclamationTriangle,
            BOOKING_CONFIRMED: FaCheckCircle,
            BOOKING_CANCELLED: FaTimes,
            TOUR_REMINDER: FaMapMarkerAlt,
            USER_NOTIFICATION: FaBell
        };
        return icons[type] || FaInfoCircle;
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
            BOOKING_CONFIRMED: "text-green-600",
            BOOKING_CANCELLED: "text-red-600",
            TOUR_REMINDER: "text-blue-600",
            USER_NOTIFICATION: "text-blue-600"
        };
        return colors[type] || colors.INFO;
    }, []);

    const getNotificationTitle = useCallback((notification) => {
        if (notification.title) return notification.title;

        switch (notification.type) {
            case 'BOOKING_CONFIRMED':
                return 'Đặt tour thành công';
            case 'BOOKING_CANCELLED':
                return 'Hủy đặt tour';
            case 'PAYMENT_SUCCESS':
                return 'Thanh toán thành công';
            case 'PAYMENT_FAILED':
                return 'Thanh toán thất bại';
            case 'TOUR_REMINDER':
                return 'Nhắc nhở tour';
            case 'USER_NOTIFICATION':
                return 'Thông báo cá nhân';
            default:
                return 'Thông báo từ TravelGo';
        }
    }, []);

    const handleNotificationClick = useCallback(async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        setSelectedNotification(notification);
        setShowNotificationModal(true);
        setShowNotifications(false);
    }, [markAsRead]);

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

    // Render notification items
    const renderNotificationItems = useCallback(() => {
        if (notificationsLoading) {
            return (
                <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Đang tải thông báo...</p>
                </div>
            );
        }

        if (!notifications || notifications.length === 0) {
            return (
                <div className="p-6 text-center">
                    <FaBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 mb-1">Không có thông báo</p>
                    <p className="text-xs text-gray-500">Thông báo mới sẽ xuất hiện ở đây</p>
                </div>
            );
        }

        const unreadNotifications = notifications.filter(n => !n.isRead);
        const displayNotifications = unreadNotifications.slice(0, 5);

        return (
            <div className="space-y-2 p-3">
                {displayNotifications.map((notification, index) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const iconColor = getNotificationIconColor(notification.type);

                    return (
                        <div
                            key={`${notification.id}-${index}`}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getNotificationColor(notification.type)}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 pt-1">
                                    <IconComponent size={16} className={iconColor} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                                        {getNotificationTitle(notification)}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                        {notification.message || 'Có thông báo mới từ hệ thống'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {formatNotificationTime(notification.createdAt)}
                                        </span>
                                        {!notification.isRead && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <FaEye size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {unreadNotifications.length > 5 && (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 text-center">
                            +{unreadNotifications.length - 5} thông báo chưa đọc khác
                        </p>
                    </div>
                )}
            </div>
        );
    }, [
        notifications,
        notificationsLoading,
        handleNotificationClick,
        getNotificationColor,
        getNotificationIcon,
        getNotificationIconColor,
        getNotificationTitle,
        formatNotificationTime
    ]);

    // Hàm lấy chữ cái đầu cho avatar
    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const toggleNotifications = useCallback(() => {
        setShowNotifications(prev => !prev);
        setUserDropdownOpen(false);
    }, []);

    const toggleUserMenu = useCallback(() => {
        setUserDropdownOpen(prev => !prev);
        setShowNotifications(false);
    }, []);

    return (
        <>
            {/* Header cố định */}
            <header
                ref={headerRef}
                className={`fixed top-0 left-0 w-full z-50 backdrop-blur-sm shadow-md transition-all duration-300 ${
                    isScrolled ? "bg-white/95" : "bg-white"
                }`}
            >
                <div className="container mx-auto flex items-center justify-between px-6 py-4">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold text-green-500 hover:text-green-600 transition-colors">
                        TravelGo
                    </Link>

                    {/* Menu Desktop */}
                    <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
                        <Link to="/" className="hover:text-green-500 transition-colors">Trang chủ</Link>
                        <Link to="/tours" className="hover:text-green-500 transition-colors">Tour</Link>
                        <Link to="/blog" className="hover:text-green-500 transition-colors">Blog</Link>
                        <Link to="/contact" className="hover:text-green-500 transition-colors">Liên hệ</Link>
                    </nav>

                    {/* Auth Desktop với Notifications */}
                    <div className="hidden md:flex items-center space-x-3" ref={notificationRef}>
                        {/* Notification Bell - Hiển thị khi đã đăng nhập */}
                        {isAuthenticated && user && (
                            <>
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={toggleNotifications}
                                        className="relative flex items-center justify-center w-10 h-10 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                        aria-label="Thông báo"
                                        title={`Thông báo (${unreadCount} chưa đọc)`}
                                        disabled={notificationsLoading}
                                    >
                                        <FaBell size={18} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                                            {/* Header */}
                                            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-gray-900">
                                                        Thông báo của tôi
                                                    </h4>
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={markAllAsRead}
                                                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50 transition-colors"
                                                            disabled={isMarkingAll || notificationsLoading}
                                                        >
                                                            {isMarkingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">
                                                        {notifications.length} thông báo
                                                    </span>
                                                    <button
                                                        onClick={refreshNotifications}
                                                        className="text-green-600 hover:text-green-700 text-xs"
                                                    >
                                                        Làm mới
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Notifications List */}
                                            <div className="max-h-96 overflow-y-auto">
                                                {renderNotificationItems()}
                                            </div>

                                            {/* Footer */}
                                            {notifications.length > 0 && (
                                                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                                    <Link
                                                        to="/user/notifications"
                                                        className="block w-full text-center py-2 text-sm text-green-600 hover:text-green-700 font-medium bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                                                        onClick={() => setShowNotifications(false)}
                                                    >
                                                        Xem tất cả thông báo
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* User Menu */}
                        {isAuthenticated && user ? (
                            <div className="relative" ref={userDropdownRef}>
                                <button
                                    onClick={toggleUserMenu}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                >
                                    {/* Avatar */}
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
                                            {getInitials(user.fullName)}
                                        </div>
                                    )}

                                    <span className="text-gray-700 font-medium max-w-32 truncate">
                                        {user.fullName || user.email}
                                    </span>
                                    <FaChevronDown
                                        className={`text-gray-500 transition-transform duration-200 ${
                                            userDropdownOpen ? "rotate-180" : ""
                                        }`}
                                        size={12}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {userDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user.fullName || user.email}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Role: {user.role}
                                            </p>
                                        </div>

                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <FaUserCircle className="mr-2" size={14} />
                                            Hồ sơ
                                        </Link>

                                        <Link
                                            to="/user/notifications"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <FaBell className="mr-2" size={14} />
                                            Thông báo
                                            {unreadCount > 0 && (
                                                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>

                                        <Link
                                            to="/user/bookings"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <FaCreditCard className="mr-2" size={14} />
                                            Đơn đặt tour
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <FaTimes className="mr-2" size={14} />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Chưa đăng nhập
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2 text-sm font-medium text-white rounded bg-green-600 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                                >
                                    Đăng ký ngay
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden text-2xl text-gray-700 relative z-60 hover:text-green-500 transition-colors"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
                    >
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </header>

            {/* Banner cách header */}
            <div style={{ marginTop: headerHeight }} />

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
                    menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
                onClick={() => setMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <div
                ref={menuRef}
                className={`fixed top-[64px] right-0 bg-white shadow-lg z-50 w-2/4 max-w-xs transform transition-transform duration-300 md:hidden
                    ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                <nav className="flex flex-col items-start text-left space-y-0 px-6 py-4 text-gray-700 font-medium">
                    <Link
                        to="/"
                        className="hover:text-green-500 transition-colors w-full py-3 border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Trang chủ
                    </Link>
                    <Link
                        to="/tours"
                        className="hover:text-green-500 transition-colors w-full py-3 border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Tour
                    </Link>
                    <Link
                        to="/blog"
                        className="hover:text-green-500 transition-colors w-full py-3 border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Blog
                    </Link>
                    <Link
                        to="/contact"
                        className="hover:text-green-500 transition-colors w-full py-3 border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Liên hệ
                    </Link>
                    <Link
                        to="/map"
                        className="hover:text-green-500 transition-colors w-full py-3 border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Bản đồ
                    </Link>

                    <div className="pt-3 flex flex-col space-y-3 mt-2 w-full">
                        {isAuthenticated && user ? (
                            // Mobile - Đã đăng nhập
                            <>
                                <div className="flex items-center space-x-3 py-3 border-b border-gray-100">
                                    {/* Avatar mobile */}
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                                            {getInitials(user.fullName)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.fullName || user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Role: {user.role}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to="/user/notifications"
                                    className="flex items-center text-gray-700 hover:text-green-600 transition-colors w-full py-2"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <FaBell className="mr-3" />
                                    Thông báo
                                    {unreadCount > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    to="/profile"
                                    className="flex items-center text-gray-700 hover:text-green-600 transition-colors w-full py-2"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <FaUserCircle className="mr-3" />
                                    Hồ sơ
                                </Link>

                                <Link
                                    to="/user/bookings"
                                    className="flex items-center text-gray-700 hover:text-green-600 transition-colors w-full py-2"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <FaCreditCard className="mr-3" />
                                    Đơn đặt tour
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center text-red-600 hover:text-red-700 transition-colors w-full py-2 text-left"
                                >
                                    <FaTimes className="mr-3" />
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            // Mobile - Chưa đăng nhập
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-green-600 transition-colors w-full py-3 text-center border border-gray-300 rounded-lg"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-3 text-center text-sm font-medium text-white rounded bg-green-600 shadow-md hover:shadow-lg transition-all duration-200 w-full"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Đăng ký ngay
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>

            {/* Notification Detail Modal */}
            {showNotificationModal && selectedNotification && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Chi tiết thông báo</h3>
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <FaTimes size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 overflow-y-auto max-h-96">
                            <div className="space-y-4">
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2">
                                        {getNotificationTitle(selectedNotification)}
                                    </h4>
                                    <p className="text-gray-700 text-sm">
                                        {selectedNotification.message || 'Không có nội dung chi tiết'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Thời gian</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatNotificationTime(selectedNotification.createdAt)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
                                        <p className={`text-sm font-medium ${selectedNotification.isRead ? 'text-green-600' : 'text-blue-600'}`}>
                                            {selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                        </p>
                                    </div>
                                </div>

                                {selectedNotification.amount && (
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                        <p className="text-xs text-green-600 mb-1">Số tiền</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {formatCurrency(selectedNotification.amount)}
                                        </p>
                                    </div>
                                )}

                                {selectedNotification.tourName && (
                                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                        <p className="text-xs text-purple-600 mb-1">Tour</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedNotification.tourName}
                                        </p>
                                    </div>
                                )}

                                {selectedNotification.bookingCode && (
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                        <p className="text-xs text-amber-600 mb-1">Mã đặt tour</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedNotification.bookingCode}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex gap-3">
                                {!selectedNotification.isRead && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await markAsRead(selectedNotification.id);
                                                setSelectedNotification(prev => prev ? { ...prev, isRead: true } : null);
                                            } catch (error) {
                                                console.error('Error marking notification as read:', error);
                                            }
                                        }}
                                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                    >
                                        Đánh dấu đã đọc
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    className={`py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors ${!selectedNotification.isRead ? 'flex-1' : 'w-full'}`}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HeaderComponent;