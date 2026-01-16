import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Plane,
    CalendarDays,
    BarChart3,
    Mail,
    Settings,
    LogOut,
    ChevronRight,
    Crown,
    Shield,
} from "lucide-react";
import PropTypes from "prop-types";
import {useAuth} from "../../../context/AuthContext";


const AdminSidebarComponent = ({ collapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [openMenus, setOpenMenus] = useState({});
    const [hoverMenu, setHoverMenu] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const hoverTimeout = useRef(null);

    const toggleMenu = (name) => {
        setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const handleMouseEnter = (name) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoverMenu(name);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => setHoverMenu(null), 150);
    };

    const isActive = (href) => location.pathname === href;
    const isActiveParent = (children) => children?.some(child => isActive(child.href));

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate("/");
    };

    const openLogoutModal = () => {
        setShowLogoutModal(true);
    };

    const menuItems = [
        {
            name: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
            description: "Tổng quan hệ thống"
        },
        {
            name: "Quản lý Tour",
            icon: Plane,
            description: "Quản lý tours & dịch vụ",
            children: [
                { name: "Danh sách Tours", href: "/admin/tours" },
                { name: "Thêm Tour mới", href: "/admin/tours/create" },
            ],
        },
        {
            name: "Quản lý Bookings",
            icon: CalendarDays,
            description: "Quản lý đặt tour",
            children: [
                { name: "Danh sách Bookings", href: "/admin/bookings" },
                { name: "Booking đã huỷ", href: "/admin/bookings/cancelled" },
            ],
        },
        {
            name: "Khách hàng",
            href: "/admin/customers",
            icon: Users,
            description: "Quản lý người dùng"
        },
        {
            name: "Doanh thu",
            icon: BarChart3,
            description: "Thống kê tài chính",
            children: [
                { name: "Tổng quan", href: "/admin/revenue" },
                { name: "Theo tháng", href: "/admin/revenue/monthly" },
            ],
        },
        {
            name: "Liên hệ & Email",
            icon: Mail,
            description: "Quản lý liên hệ",
            children: [
                { name: "Danh sách liên hệ", href: "/admin/contacts" },
                { name: "Gửi email", href: "/admin/email" },
            ],
        },
        {
            name: "Quản lý Blog",
            icon: Mail, // hoặc FileText nếu bạn muốn
            description: "Bài viết & nội dung",
            children: [
                { name: "Danh sách Blog", href: "/admin/blogs" },
                { name: "Tạo Blog mới", href: "/admin/blogs/create" },
            ],
        },

    ];

    // Auto mở menu cha khi đang ở submenu
    useEffect(() => {
        const newOpen = {};
        menuItems.forEach((item) => {
            if (item.children) {
                const activeChild = item.children.some((c) => isActive(c.href));
                if (activeChild) newOpen[item.name] = true;
            }
        });
        setOpenMenus((prev) => ({ ...prev, ...newOpen }));
    }, [location.pathname]);

    const renderMenuItem = (item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const activeParent = item.children ? isActiveParent(item.children) : false;
        const hasChildren = !!item.children;
        const showSubmenu = !collapsed && hasChildren && openMenus[item.name];
        const showFlyout = collapsed && hasChildren && hoverMenu === item.name;

        return (
            <div
                key={item.name}
                onMouseEnter={() => collapsed && hasChildren && handleMouseEnter(item.name)}
                onMouseLeave={() => collapsed && handleMouseLeave()}
                className="relative"
            >
                <div
                    onClick={() => {
                        if (item.href) navigate(item.href);
                        else if (hasChildren) toggleMenu(item.name);
                    }}
                    className={`group flex items-center cursor-pointer px-4 py-3 transition-all duration-200 
                        ${active || activeParent ? "bg-green-50 text-green-600 font-semibold border-r-2 border-green-500" : "text-gray-700 hover:bg-green-50/50"}
                        ${collapsed ? "justify-center" : "justify-between"}
                        hover:shadow-sm rounded-r-xl mx-2 my-1`}
                >
                    <div className="flex items-center">
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                            active || activeParent
                                ? "bg-green-500 text-white shadow-lg"
                                : "bg-green-50 text-green-600 group-hover:bg-green-500 group-hover:text-white"
                        }`}>
                            <Icon size={18} className="shrink-0" />
                        </div>
                        {!collapsed && (
                            <div className="ml-3 flex-1 min-w-0">
                                <span className="text-sm font-medium block">{item.name}</span>
                                {item.description && (
                                    <span className="text-xs text-gray-500 mt-0.5 block">{item.description}</span>
                                )}
                            </div>
                        )}
                    </div>
                    {!collapsed && hasChildren && (
                        <ChevronRight
                            size={14}
                            className={`transition-transform duration-200 ${
                                openMenus[item.name] ? "rotate-90 text-green-500" : "text-gray-400"
                            }`}
                        />
                    )}
                </div>

                {showSubmenu && (
                    <div className="ml-8 border-l-2 border-green-200/50">
                        {item.children.map((child) => {
                            const childActive = isActive(child.href);
                            return (
                                <Link
                                    key={child.name}
                                    to={child.href}
                                    className={`flex items-center px-4 py-2.5 text-sm transition-all duration-200 mx-2 my-1 rounded-lg ${
                                        childActive
                                            ? "text-green-600 font-medium bg-green-50 shadow-sm border border-green-100"
                                            : "text-gray-600 hover:text-green-600 hover:bg-green-50/30"
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full mr-3 ${
                                        childActive ? "bg-green-500" : "bg-gray-300"
                                    }`} />
                                    <span>{child.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {showFlyout && (
                    <div
                        className="absolute left-full top-0 ml-1 bg-white/95 backdrop-blur-lg border border-green-200 rounded-xl shadow-lg py-2 min-w-[200px] z-50"
                        onMouseEnter={() => setHoverMenu(item.name)}
                        onMouseLeave={() => setHoverMenu(null)}
                    >
                        <div className="px-3 py-2 border-b border-green-100">
                            <p className="text-sm font-semibold text-green-600">{item.name}</p>
                            {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            )}
                        </div>
                        {item.children.map((child) => {
                            const childActive = isActive(child.href);
                            return (
                                <Link
                                    key={child.name}
                                    to={child.href}
                                    className={`flex items-center px-3 py-2.5 text-sm transition-colors ${
                                        childActive
                                            ? "text-green-600 font-medium bg-green-50"
                                            : "text-gray-700 hover:bg-green-50"
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full mr-3 ${
                                        childActive ? "bg-green-500" : "bg-gray-300"
                                    }`} />
                                    {child.name}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div
                className={`bg-gradient-to-b from-white to-gray-50/30 border-r border-green-200/60 fixed left-0 top-0 bottom-0 shadow-sm 
                      flex flex-col transition-all duration-300 z-40 backdrop-blur-sm
                      ${collapsed ? "w-20" : "w-72"}`}
            >
                {/* Logo */}
                <div className="flex items-center justify-center py-6 border-b border-green-200/60 bg-white/50">
                    <Link to="/admin" className="flex items-center space-x-3 group">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold p-2 rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                            <Crown size={20} />
                        </div>
                        {!collapsed && (
                            <div className="text-left">
                                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    TravelGo
                                </h1>
                                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                    <Shield size={12} />
                                    Admin Panel
                                </p>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Menu */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-4">
                    <nav className="space-y-1">{menuItems.map((item) => renderMenuItem(item))}</nav>
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-green-200/60 bg-white/30">
                    <button
                        onClick={openLogoutModal}
                        className={`group flex items-center w-full cursor-pointer px-4 py-3 transition-all duration-200 
                            text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl mx-2
                            ${collapsed ? "justify-center" : "justify-start"}`}
                    >
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all duration-200">
                            <LogOut size={18} className="shrink-0" />
                        </div>
                        {!collapsed && (
                            <div className="ml-3">
                                <span className="text-sm font-medium block">Đăng xuất</span>
                                <span className="text-xs text-gray-500 mt-0.5 block">Thoát hệ thống</span>
                            </div>
                        )}
                    </button>
                </div>

                <div className="p-4 text-center text-xs text-gray-400 border-t border-green-200/60 bg-white/30">
                    {!collapsed ? "© 2025 TravelGo Admin" : "© 2025"}
                </div>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-green-200/60">
                        {/* Header */}
                        <div className="p-6 border-b border-green-200/60 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center shadow-lg">
                                    <LogOut size={24} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Xác nhận đăng xuất</h3>
                                    <p className="text-sm text-gray-600 mt-1">Hành động quan trọng</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                                <LogOut size={36} className="text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-3">
                                Đăng xuất khỏi hệ thống?
                            </h4>
                            <p className="text-gray-600 mb-2">
                                Bạn có chắc muốn đăng xuất tài khoản quản trị?
                            </p>
                            <p className="text-sm text-green-600 font-semibold">
                                Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-green-200/60 flex gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-4 px-6 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 font-semibold transition-all duration-200 hover:shadow-md"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
                            >
                                <LogOut size={20} />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

AdminSidebarComponent.propTypes = {
    collapsed: PropTypes.bool.isRequired,
};

export default AdminSidebarComponent;