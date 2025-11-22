import React, { useEffect, useState } from "react";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";
import { TrendingUp, Users, DollarSign, Package, Calendar, RefreshCw } from "lucide-react";
import AdminLayout from "../layout/AdminLayout";
import {getAllBooking} from "../../../service/booking_service";


export default function AdminRevenueDashboard() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [revenueByTour, setRevenueByTour] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [kpi, setKpi] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        totalPeople: 0,
        confirmedBookings: 0,
        conversionRate: 0
    });

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const statusColors = {
        PAID: "#10B981",
        CONFIRMED: "#3B82F6",
        PENDING: "#F59E0B",
        CANCELLED: "#EF4444",
        COMPLETED: "#8B5CF6"
    };

    const statusLabels = {
        PAID: "Đã thanh toán",
        CONFIRMED: "Đã xác nhận",
        PENDING: "Đang chờ",
        CANCELLED: "Đã huỷ",
        COMPLETED: "Hoàn thành"
    };

    const fetchBookings = async () => {
        try {
            setRefreshing(true);
            const bookingsData = await getAllBooking();
            const safeBookingsData = Array.isArray(bookingsData) ? bookingsData : [];
            setBookings(safeBookingsData);
            setFilteredBookings(safeBookingsData);
        } catch (error) {
            setBookings([]);
            setFilteredBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);


    const handleFilter = () => {
        if (!Array.isArray(bookings)) {
            setFilteredBookings([]);
            return;
        }

        if (!fromDate && !toDate) {
            setFilteredBookings(bookings);
            return;
        }

        const from = fromDate ? new Date(fromDate) : new Date("1970-01-01");
        const to = toDate ? new Date(toDate) : new Date("2100-12-31");

        const filtered = bookings.filter(b => {
            if (!b || !b.bookingDate) return false;
            const bookingDate = new Date(b.bookingDate);
            return bookingDate >= from && bookingDate <= to;
        });
        setFilteredBookings(filtered);
    };

    const handleResetFilter = () => {
        setFromDate("");
        setToDate("");
        setFilteredBookings(Array.isArray(bookings) ? bookings : []);
    };

    const handleRefresh = () => {
        fetchBookings();
    };

    useEffect(() => {
        const safeFilteredBookings = Array.isArray(filteredBookings) ? filteredBookings : [];

        const paidBookings = safeFilteredBookings.filter(b =>
            b && (b.status === "PAID" || b.status === "COMPLETED")
        );

        const totalRevenue = paidBookings.reduce((sum, b) => {
            const amount = b?.paidAmount || 0;
            return sum + (typeof amount === 'number' ? amount : 0);
        }, 0);

        const totalBookings = safeFilteredBookings.length;
        const totalPeople = safeFilteredBookings.reduce((sum, b) => {
            const people = b?.numberOfPeople || 0;
            return sum + (typeof people === 'number' ? people : 0);
        }, 0);

        const confirmedCount = paidBookings.length;
        const conversionRate = totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;

        setKpi({
            totalRevenue,
            totalBookings,
            totalPeople,
            confirmedBookings: confirmedCount,
            conversionRate
        });

        // Doanh thu theo tour - với safe access
        const revenueMap = {};
        paidBookings.forEach(b => {
            if (!b) return;
            const title = b.tourSchedule?.tour?.title || "Unknown Tour";
            const amount = b.paidAmount || 0;
            if (!revenueMap[title]) revenueMap[title] = 0;
            revenueMap[title] += amount;
        });

        setRevenueByTour(Object.keys(revenueMap).map(tour => ({
            tour,
            revenue: revenueMap[tour]
        })).sort((a, b) => b.revenue - a.revenue));

        const statusCount = { PAID: 0, CONFIRMED: 0, PENDING: 0, CANCELLED: 0, COMPLETED: 0 };
        safeFilteredBookings.forEach(b => {
            if (!b || !b.status) return;
            const status = b.status.toUpperCase();
            if (statusCount[status] !== undefined) {
                statusCount[status]++;
            }
        });

        setStatusData(Object.keys(statusCount).map(k => ({
            name: statusLabels[k] || k,
            value: statusCount[k],
            color: statusColors[k]
        })).filter(item => item.value > 0));

    }, [filteredBookings]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Tổng quan Doanh thu</h1>
                        <p className="text-gray-600">Dữ liệu thực từ hệ thống</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-all duration-200 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Đang cập nhật..." : "Làm mới"}
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    value={fromDate}
                                    onChange={e => setFromDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    value={toDate}
                                    onChange={e => setToDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleFilter}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-all duration-200 flex items-center gap-2"
                            >
                                <TrendingUp size={18} />
                                Áp dụng
                            </button>
                            <button
                                onClick={handleResetFilter}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                            >
                                Đặt lại
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium mb-1">Tổng doanh thu</p>
                                <p className="text-2xl font-bold text-gray-900">{formatPrice(kpi.totalRevenue)}</p>
                                <p className="text-xs text-blue-600 mt-1">{kpi.confirmedBookings} booking đã thanh toán</p>
                            </div>
                            <div className="p-3 bg-blue-500 rounded-xl">
                                <DollarSign className="text-white" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium mb-1">Booking đã thanh toán</p>
                                <p className="text-2xl font-bold text-gray-900">{kpi.confirmedBookings}</p>
                                <p className="text-xs text-green-600 mt-1">/{kpi.totalBookings} tổng booking</p>
                            </div>
                            <div className="p-3 bg-green-500 rounded-xl">
                                <Users className="text-white" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium mb-1">Tổng số khách</p>
                                <p className="text-2xl font-bold text-gray-900">{kpi.totalPeople}</p>
                                <p className="text-xs text-purple-600 mt-1">Khách hàng</p>
                            </div>
                            <div className="p-3 bg-purple-500 rounded-xl">
                                <Users className="text-white" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium mb-1">Tỷ lệ chuyển đổi</p>
                                <p className="text-2xl font-bold text-gray-900">{kpi.conversionRate}%</p>
                                <p className="text-xs text-orange-600 mt-1">Tỷ lệ thành công</p>
                            </div>
                            <div className="p-3 bg-orange-500 rounded-xl">
                                <TrendingUp className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Doanh thu theo tour */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package size={20} className="text-green-600" />
                            Doanh thu theo Tour
                        </h3>
                        {revenueByTour.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueByTour} margin={{ top: 20, right: 20, bottom: 60, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="tour"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                        width={60}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatPrice(value), "Doanh thu"]}
                                        labelFormatter={(label) => `Tour: ${label}`}
                                    />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                Không có dữ liệu doanh thu
                            </div>
                        )}
                    </div>

                    {/* Phân bố trạng thái booking */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Phân bố Trạng thái Booking
                        </h3>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={2}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                Không có dữ liệu trạng thái
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}