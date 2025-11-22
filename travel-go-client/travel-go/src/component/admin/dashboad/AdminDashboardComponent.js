import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Users,
    MapPin,
    DollarSign,
    ShoppingBag,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Eye,
    BarChart3,
} from "lucide-react";
import {getCustomerStats} from "../../../service/admin/usersService";
import {getAllBooking, getBookingStatuses} from "../../../service/booking_service";
import {getActiveTours} from "../../../service/tour_service";
import AdminLayout from "../layout/AdminLayout";


const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTours: 0,
        totalBookings: 0,
        monthlyRevenue: 0,
        activeBookings: 0,
        conversionRate: 0
    });

    const [recentBookings, setRecentBookings] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [timeRange, setTimeRange] = useState("today");

    // Fetch dữ liệu thực từ API
    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch dữ liệu từ các API
            const [customerStats, bookingsData, activeTours, bookingStatuses] = await Promise.all([
                getCustomerStats().catch(err => {
                    console.error("Error fetching customer stats:", err);
                    return null;
                }),
                getAllBooking().catch(err => {
                    console.error("Error fetching bookings:", err);
                    return { content: [] };
                }),
                getActiveTours().catch(err => {
                    console.error("Error fetching active tours:", err);
                    return [];
                }),
                getBookingStatuses().catch(err => {
                    console.error("Error fetching booking statuses:", err);
                    return [];
                })
            ]);

            console.log("Customer Stats:", customerStats);
            console.log("Bookings Data:", bookingsData);
            console.log("Active Tours:", activeTours);
            console.log("Booking Statuses:", bookingStatuses);

            // Tính toán các chỉ số từ dữ liệu thực
            const totalBookings = Array.isArray(bookingsData) ? bookingsData.length :
                bookingsData?.totalElements || bookingsData?.length || 0;

            const paidBookings = Array.isArray(bookingsData) ?
                bookingsData.filter(b => b.status === 'PAID' || b.status === 'COMPLETED') :
                bookingsData?.content?.filter(b => b.status === 'PAID' || b.status === 'COMPLETED') || [];

            const monthlyRevenue = paidBookings.reduce((sum, booking) => {
                return sum + (booking.totalPrice || booking.paidAmount || 0);
            }, 0);

            // CẬP NHẬT: Booking đang xử lý là PENDING và DEPOSIT_PAID
            const activeBookingsCount = Array.isArray(bookingsData) ?
                bookingsData.filter(b => b.status === 'PENDING' || b.status === 'DEPOSIT_PAID').length :
                bookingsData?.content?.filter(b => b.status === 'PENDING' || b.status === 'DEPOSIT_PAID').length || 0;

            const conversionRate = totalBookings > 0 ?
                Math.round((paidBookings.length / totalBookings) * 100) : 0;

            // Cập nhật stats với dữ liệu thực
            setStats({
                totalUsers: customerStats?.totalCustomers || customerStats?.totalUsers || 0,
                totalTours: activeTours?.length || customerStats?.activeTours || 0,
                totalBookings: totalBookings,
                monthlyRevenue: monthlyRevenue,
                activeBookings: activeBookingsCount,
                conversionRate: conversionRate
            });

            // Xử lý recent bookings từ dữ liệu thực
            const bookingsArray = Array.isArray(bookingsData) ?
                bookingsData :
                bookingsData?.content || [];

            const recentBookingsData = bookingsArray
                .sort((a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate))
                .slice(0, 6)
                .map(booking => ({
                    id: booking.id,
                    customer: booking.customerName || booking.user?.fullName || booking.user?.name || "Khách hàng",
                    tour: booking.tour?.title || booking.tourName || booking.tourSchedule?.tour?.title || "Tour",
                    amount: booking.totalPrice || booking.paidAmount || booking.amount || 0,
                    date: booking.bookingDate || booking.createdAt,
                    status: (booking.status?.toLowerCase()) || "pending",
                    guests: booking.numberOfGuests || booking.numberOfPeople || 1
                }));

            setRecentBookings(recentBookingsData);

            const pendingBookingsCount = bookingsArray.filter(b => b.status === 'PENDING').length;
            const depositPaidBookingsCount = bookingsArray.filter(b => b.status === 'DEPOSIT_PAID').length;
            const cancelledBookingsCount = bookingsArray.filter(b => b.status === 'CANCELLED').length;

            const systemAlerts = [];

            if (pendingBookingsCount > 0) {
                systemAlerts.push({
                    id: 1,
                    type: "warning",
                    message: `${pendingBookingsCount} booking đang chờ xác nhận`,
                    time: "Vừa xong",
                    priority: "high"
                });
            }

            if (depositPaidBookingsCount > 0) {
                systemAlerts.push({
                    id: 2,
                    type: "info",
                    message: `${depositPaidBookingsCount} booking đã đặt cọc`,
                    time: "Vừa xong",
                    priority: "medium"
                });
            }

            if (cancelledBookingsCount > 5) {
                systemAlerts.push({
                    id: 3,
                    type: "warning",
                    message: `${cancelledBookingsCount} booking đã bị hủy`,
                    time: "Vừa xong",
                    priority: "medium"
                });
            }

            // Alert về doanh thu
            if (monthlyRevenue > 0) {
                systemAlerts.push({
                    id: 4,
                    type: "info",
                    message: `Doanh thu tháng: ${formatPrice(monthlyRevenue)}`,
                    time: "Vừa xong",
                    priority: "low"
                });
            }

            // Alert hệ thống mặc định
            systemAlerts.push({
                id: 5,
                type: "info",
                message: "Hệ thống hoạt động ổn định",
                time: "Vừa xong",
                priority: "low"
            });

            setAlerts(systemAlerts);
            setLastUpdated(new Date());

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setAlerts([{
                id: 1,
                type: "warning",
                message: "Có lỗi khi tải dữ liệu dashboard",
                time: "Vừa xong",
                priority: "high"
            }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const formatPrice = (amount) => {
        if (!amount) return "0đ";
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace('₫', 'đ');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            completed: { class: "bg-green-100 text-green-700 border border-green-200", text: "Hoàn tất" },
            confirmed: { class: "bg-blue-100 text-blue-700 border border-blue-200", text: "Đã xác nhận" },
            pending: { class: "bg-yellow-100 text-yellow-700 border border-yellow-200", text: "Chờ xác nhận" },
            cancelled: { class: "bg-red-100 text-red-700 border border-red-200", text: "Đã hủy" },
            paid: { class: "bg-emerald-100 text-emerald-700 border border-emerald-200", text: "Đã thanh toán" },
            // Thêm các status từ API
            PAID: { class: "bg-emerald-100 text-emerald-700 border border-emerald-200", text: "Đã thanh toán" },
            CONFIRMED: { class: "bg-blue-100 text-blue-700 border border-blue-200", text: "Đã xác nhận" },
            PENDING: { class: "bg-yellow-100 text-yellow-700 border border-yellow-200", text: "Chờ xác nhận" },
            CANCELLED: { class: "bg-red-100 text-red-700 border border-red-200", text: "Đã hủy" },
            COMPLETED: { class: "bg-green-100 text-green-700 border border-green-200", text: "Hoàn tất" },
            // Thêm DEPOSIT_PAID
            DEPOSIT_PAID: { class: "bg-orange-100 text-orange-700 border border-orange-200", text: "Đã đặt cọc" },
            deposit_paid: { class: "bg-orange-100 text-orange-700 border border-orange-200", text: "Đã đặt cọc" }
        };

        const statusInfo = statusMap[status] || { class: "bg-gray-100 text-gray-600 border border-gray-200", text: "Không rõ" };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                {statusInfo.text}
            </span>
        );
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case "warning":
                return <AlertTriangle className="text-yellow-500" size={18} />;
            case "info":
                return <CheckCircle className="text-green-500" size={18} />;
            default:
                return <CheckCircle className="text-gray-400" size={18} />;
        }
    };

    const statCards = [
        {
            title: "Tổng khách hàng",
            value: stats.totalUsers,
            icon: Users,
            color: "from-blue-500 to-blue-600",
            trend: stats.totalUsers > 0 ? "+12%" : "0%",
            description: "Khách hàng đã đăng ký"
        },
        {
            title: "Tour đang hoạt động",
            value: stats.totalTours,
            icon: MapPin,
            color: "from-green-500 to-green-600",
            trend: stats.totalTours > 0 ? "+5%" : "0%",
            description: "Tour có sẵn"
        },
        {
            title: "Tổng booking",
            value: stats.totalBookings,
            icon: ShoppingBag,
            color: "from-purple-500 to-purple-600",
            trend: stats.totalBookings > 0 ? "+8%" : "0%",
            description: "Đơn đặt tour"
        },
        {
            title: "Doanh thu tháng",
            value: formatPrice(stats.monthlyRevenue),
            icon: DollarSign,
            color: "from-emerald-500 to-emerald-600",
            trend: stats.monthlyRevenue > 0 ? "+15%" : "0%",
            description: "Tổng doanh thu"
        },
    ];

    const quickActions = [
        {
            title: "Quản lý Tour",
            description: "Thêm/sửa tour",
            icon: MapPin,
            color: "bg-blue-500",
            link: "/admin/tours"
        },
        {
            title: "Quản lý Booking",
            description: "Xem tất cả booking",
            icon: ShoppingBag,
            color: "bg-green-500",
            link: "/admin/bookings"
        },
        {
            title: "Quản lý Khách hàng",
            description: "Danh sách khách hàng",
            icon: Users,
            color: "bg-purple-500",
            link: "/admin/customers"
        },
        {
            title: "Báo cáo Doanh thu",
            description: "Phân tích doanh thu",
            icon: BarChart3,
            color: "bg-orange-500",
            link: "/admin/revenue"
        }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "Không có ngày";
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50/30 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Đang tải dữ liệu dashboard...</p>
                        <p className="text-gray-400 text-sm mt-2">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50/30 p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Tổng quan hoạt động hệ thống TravelGo
                            {lastUpdated && (
                                <span className="text-sm text-gray-400 ml-2">
                                    • Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                            <option value="quarter">Quý này</option>
                        </select>

                        <div className="flex gap-2">
                            <button
                                onClick={fetchDashboardData}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                                <span>{loading ? "Đang tải..." : "Làm mới"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-sm`}>
                                        <Icon className="text-white" size={24} />
                                    </div>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                        card.trend !== "0%"
                                            ? "text-green-600 bg-green-50"
                                            : "text-gray-600 bg-gray-50"
                                    }`}>
                                        {card.trend}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-2xl font-bold text-gray-900 mb-1">
                                        {card.value}
                                    </p>
                                    <p className="text-gray-600 font-medium text-sm mb-1">
                                        {card.title}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Charts & Bookings */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Thao tác nhanh
                                </h2>
                                <span className="text-blue-600 text-sm font-medium">
                                    Quản lý hệ thống
                                </span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {quickActions.map((action, index) => {
                                    const Icon = action.icon;
                                    return (
                                        <Link
                                            key={index}
                                            to={action.link}
                                            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
                                        >
                                            <div className={`p-3 rounded-lg ${action.color} text-white mb-3 group-hover:scale-110 transition-transform`}>
                                                <Icon size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 text-center mb-1">
                                                {action.title}
                                            </span>
                                            <span className="text-xs text-gray-500 text-center">
                                                {action.description}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Bookings */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Booking gần đây
                                </h2>
                                <Link
                                    to="/admin/bookings"
                                    className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                                >
                                    <span>Xem tất cả</span>
                                    <Eye size={16} />
                                </Link>
                            </div>

                            {recentBookings.length > 0 ? (
                                <div className="space-y-3">
                                    {recentBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/80 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <ShoppingBag size={16} className="text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-gray-900 truncate">
                                                            {booking.customer}
                                                        </p>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {booking.guests} khách
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {booking.tour}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDate(booking.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="font-bold text-gray-900 whitespace-nowrap mb-2">
                                                    {formatPrice(booking.amount)}
                                                </p>
                                                {getStatusBadge(booking.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>Chưa có booking nào</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Alerts & Stats */}
                    <div className="space-y-8">
                        {/* System Alerts */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Thông báo hệ thống
                                </h2>
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-blue-600" />
                                </div>
                            </div>

                            {alerts.length > 0 ? (
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`flex items-start gap-4 p-4 rounded-xl border ${
                                                alert.priority === 'high'
                                                    ? 'bg-red-50 border-red-200'
                                                    : alert.priority === 'medium'
                                                        ? 'bg-yellow-50 border-yellow-200'
                                                        : 'bg-blue-50 border-blue-200'
                                            }`}
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getAlertIcon(alert.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {alert.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>Không có thông báo</p>
                                </div>
                            )}
                        </div>

                        {/* Additional Stats */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                            <h3 className="font-semibold mb-4">Hiệu suất hệ thống</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-100">Tỷ lệ chuyển đổi</span>
                                    <span className="font-bold">{stats.conversionRate}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-100">Booking đang xử lý</span>
                                    <span className="font-bold">{stats.activeBookings}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-100">Tổng tour hoạt động</span>
                                    <span className="font-bold">{stats.totalTours}</span>
                                </div>
                            </div>
                        </div>

                        {/* Last Updated */}
                        {lastUpdated && (
                            <div className="text-center text-gray-500 text-sm">
                                Cập nhật lúc: {lastUpdated.toLocaleTimeString('vi-VN')} • {lastUpdated.toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;