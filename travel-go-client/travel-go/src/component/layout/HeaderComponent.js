import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaBars,
    FaTimes,
    FaUserCircle,
    FaChevronDown,
    FaCreditCard
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const HeaderComponent = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);

    const headerRef = useRef();
    const menuRef = useRef();
    const userDropdownRef = useRef();
    const navigate = useNavigate();

    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        setUserDropdownOpen(false);
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
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const toggleUserMenu = useCallback(() => {
        setUserDropdownOpen(prev => !prev);
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

                    {/* Auth Desktop */}
                    <div className="hidden md:flex items-center space-x-3">
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
        </>
    );
};

export default HeaderComponent;