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

const mockBookings = [
    { tour: "Vịnh Hạ Long", bookingDate: "2025-01-15", totalPrice: 1300000, status: "CONFIRMED" },
    { tour: "Vịnh Hạ Long", bookingDate: "2025-02-10", totalPrice: 2600000, status: "CONFIRMED" },
    { tour: "Sa Pa 4N3Đ", bookingDate: "2025-01-20", totalPrice: 1250000, status: "CONFIRMED" },
    { tour: "Phú Quốc 3N2Đ", bookingDate: "2025-03-05", totalPrice: 2600000, status: "CONFIRMED" },
    { tour: "Vịnh Hạ Long", bookingDate: "2025-03-12", totalPrice: 1300000, status: "CONFIRMED" },
    { tour: "Sa Pa 4N3Đ", bookingDate: "2025-04-15", totalPrice: 2500000, status: "CONFIRMED" },
    { tour: "Phú Quốc 3N2Đ", bookingDate: "2025-05-05", totalPrice: 2600000, status: "CANCELLED" }, // ko tính
];

export default function MonthlyRevenueChart() {
    const [year, setYear] = useState(2025);
    const [selectedTour, setSelectedTour] = useState("");
    const [data, setData] = useState([]);

    const tours = [...new Set(mockBookings.map((b) => b.tour))];

    useEffect(() => {
        generateMonthlyData();
    }, [year, selectedTour]);

    const generateMonthlyData = () => {
        const monthly = Array.from({ length: 12 }, (_, i) => ({
            month: `${i + 1}`,
            revenue: 0,
        }));

        mockBookings.forEach((b) => {
            const date = new Date(b.bookingDate);
            if (b.status !== "CONFIRMED") return; // chỉ tính confirmed
            if (date.getFullYear() !== Number(year)) return;
            if (selectedTour && b.tour !== selectedTour) return;

            monthly[date.getMonth()].revenue += b.totalPrice;
        });

        setData(monthly);
    };

    const formatCurrency = (value) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    return (
        <AdminLayout children={<div className="bg-white rounded-lg shadow p-6 w-full">
            <h2 className="text-lg font-bold mb-4">📊 Doanh thu theo tháng</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Năm</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="border p-2 rounded w-full sm:w-32"
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
                        {tours.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => value / 1000000 + "M"} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
            </ResponsiveContainer>
        </div>}/>

    );
}
