import React, { useState, useEffect } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import AdminLayout from "../layout/AdminLayout";
import {getAllBooking} from "../../../service/booking_service";


export default function MonthlyRevenueChart() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedTour, setSelectedTour] = useState("");
    const [data, setData] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Lấy danh sách tour từ bookings
    const tours = [...new Set(bookings
        .filter(b => b.status === "PAID" || b.status === "CONFIRMED")
        .map(b => b.tourSchedule?.tour?.title)
        .filter(title => title) // Loại bỏ các giá trị undefined/null
    )];

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (bookings.length > 0) {
            generateMonthlyData();
        }
    }, [year, selectedTour, bookings]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getAllBooking();
            setBookings(response.content || response || []);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError("Không thể tải dữ liệu bookings");
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyData = () => {
        const monthly = Array.from({ length: 12 }, (_, i) => ({
            month: `${i + 1}`,
            revenue: 0,
        }));

        bookings.forEach((booking) => {
            // Chỉ tính các booking có trạng thái PAID hoặc CONFIRMED
            if (booking.status !== "PAID" && booking.status !== "CONFIRMED") return;

            const date = new Date(booking.bookingDate);
            if (date.getFullYear() !== Number(year)) return;

            // Lọc theo tour nếu được chọn
            const tourTitle = booking.tourSchedule?.tour?.title;
            if (selectedTour && tourTitle !== selectedTour) return;

            // Sử dụng paidAmount nếu có, nếu không thì tính toán từ price
            let revenue = 0;
            if (booking.paidAmount && booking.paidAmount > 0) {
                revenue = booking.paidAmount;
            } else if (booking.tourSchedule?.price) {
                // Tính toán dựa trên số lượng người và giá
                const basePrice = booking.tourSchedule.price;
                const adultCount = booking.adultCount || 0;
                const childCount = booking.childCount || 0;
                const babyCount = booking.babyCount || 0;

                const childPrice = booking.tourSchedule.childPrice || (basePrice * 0.5);
                const babyPrice = booking.tourSchedule.babyPrice || (basePrice * 0.2);

                revenue = (adultCount * basePrice) +
                    (childCount * childPrice) +
                    (babyCount * babyPrice);
            }

            monthly[date.getMonth()].revenue += revenue;
        });

        setData(monthly);
    };

    const formatCurrency = (value) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // Hàm để lấy tên tháng
    const getMonthName = (monthNumber) => {
        const months = [
            "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
            "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
        ];
        return months[parseInt(monthNumber) - 1] || monthNumber;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="bg-white rounded-lg shadow p-6 w-full">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-lg">Đang tải dữ liệu...</div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="bg-white rounded-lg shadow p-6 w-full">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-red-500 text-lg">{error}</div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="bg-white rounded-lg shadow p-6 w-full">
                <h2 className="text-lg font-bold mb-4">📊 Doanh thu theo tháng</h2>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Năm</label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                            className="border p-2 rounded w-full sm:w-32"
                            min="2020"
                            max="2030"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tour</label>
                        <select
                            value={selectedTour}
                            onChange={(e) => setSelectedTour(e.target.value)}
                            className="border p-2 rounded w-full sm:w-48"
                        >
                            <option value="">Tất cả tour</option>
                            {tours.map((tour) => (
                                <option key={tour} value={tour}>
                                    {tour}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Chart */}
                {data.some(item => item.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="month"
                                tickFormatter={getMonthName}
                            />
                            <YAxis
                                tickFormatter={(value) => (value / 1000000).toFixed(1) + "M"}
                            />
                            <Tooltip
                                formatter={(value) => [formatCurrency(value), "Doanh thu"]}
                                labelFormatter={(label) => `Tháng ${label}`}
                            />
                            <Bar
                                dataKey="revenue"
                                fill="#3b82f6"
                                name="Doanh thu"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-gray-500 text-lg">
                            Không có dữ liệu doanh thu cho năm {year}
                            {selectedTour && ` và tour ${selectedTour}`}
                        </div>
                    </div>
                )}

                {/* Thống kê tổng quan */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600">Tổng doanh thu năm</div>
                        <div className="text-xl font-bold text-blue-800">
                            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600">Số booking hợp lệ</div>
                        <div className="text-xl font-bold text-green-800">
                            {bookings.filter(b =>
                                (b.status === "PAID" || b.status === "CONFIRMED") &&
                                new Date(b.bookingDate).getFullYear() === year &&
                                (!selectedTour || b.tourSchedule?.tour?.title === selectedTour)
                            ).length}
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600">Tháng cao nhất</div>
                        <div className="text-xl font-bold text-purple-800">
                            {data.length > 0 ?
                                `Tháng ${data.reduce((max, item, index) =>
                                    item.revenue > data[max].revenue ? index : max, 0
                                ) + 1}`
                                : "N/A"
                            }
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}