import React, { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { X, Plus, User, Phone, Mail, Calendar, Users } from "lucide-react";

import { toast } from "react-toastify";
import {getActiveTours} from "../../../service/tour_service";
import {getSchedulesByTourId} from "../../../service/schedule_service";

const AdminCreateBookingModal = ({ show, onClose, onCreate, loading }) => {
    const [tours, setTours] = useState([]);
    const [tourSchedules, setTourSchedules] = useState([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);


    const validationSchema = Yup.object({
        customerName: Yup.string()
            .required("Họ tên là bắt buộc")
            .min(2, "Họ tên phải có ít nhất 2 ký tự"),
        phone: Yup.string()
            .required("Số điện thoại là bắt buộc")
            .matches(/^(0[3|5|7|8|9])+([0-9]{8})\b/, "Số điện thoại không hợp lệ"),
        customerEmail: Yup.string()
            .email("Email không hợp lệ")
            .nullable(),
        tourId: Yup.string()
            .required("Vui lòng chọn tour"),
        startDate: Yup.string()
            .required("Vui lòng chọn ngày khởi hành"),
        adults: Yup.number()
            .required("Số người lớn là bắt buộc")
            .min(1, "Phải có ít nhất 1 người lớn")
            .max(20, "Tối đa 20 người lớn"),
        children: Yup.number()
            .min(0, "Số trẻ em không được âm")
            .max(20, "Tối đa 20 trẻ em"),
        babies: Yup.number()
            .min(0, "Số em bé không được âm")
            .max(20, "Tối đa 20 em bé"),
        notes: Yup.string()
            .max(500, "Ghi chú không được vượt quá 500 ký tự"),
        totalPrice: Yup.number()
            .min(0, "Tổng tiền không hợp lệ")
    });


    const formik = useFormik({
        initialValues: {
            customerName: "",
            phone: "",
            customerEmail: "",
            tourId: "",
            startDate: "",
            adults: 1,
            children: 0,
            babies: 0,
            notes: "",
            totalPrice: 0
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const totalPeople = values.adults + values.children + values.babies;
            if (totalPeople < 1) {
                toast.error("❌ Số lượng người phải lớn hơn 0");
                setSubmitting(false);
                return;
            }

            try {
                setApiLoading(true);
                await onCreate(values);
                resetForm();
                onClose();
            } catch (error) {
                console.error("❌ Lỗi trong modal:", error);
            } finally {
                setApiLoading(false);
                setSubmitting(false);
            }
        },
        validateOnChange: true,
        validateOnBlur: true
    });

    const fetchTours = useCallback(async () => {
        try {
            setApiLoading(true);
            const toursData = await getActiveTours();
            setTours(toursData || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách tour:", error);
            toast.error("❌ Lỗi khi tải danh sách tour");
            setTours([]);
        } finally {
            setApiLoading(false);
        }
    }, []);

    const fetchTourSchedules = useCallback(async (tourId) => {
        try {
            setApiLoading(true);
            const schedules = await getSchedulesByTourId(tourId);
            const availableSchedules = (schedules || []).filter(schedule =>
                schedule.status === 'UPCOMING' || schedule.status === 'ONGOING'
            );

            setTourSchedules(availableSchedules);
            formik.setFieldValue("startDate", "");
            setSelectedSchedule(null);

        } catch (error) {
            console.error("Lỗi khi tải lịch trình:", error);
            toast.error("❌ Lỗi khi tải lịch trình tour");
            setTourSchedules([]);
        } finally {
            setApiLoading(false);
        }
    }, [formik]);

    const handleTourChange = async (tourId) => {
        formik.setFieldValue("tourId", tourId);

        if (tourId) {
            const selectedTour = tours.find(tour => tour.id === parseInt(tourId));
            setSelectedTour(selectedTour);
            await fetchTourSchedules(tourId);
        } else {
            setSelectedTour(null);
            setTourSchedules([]);
        }
    };

    const handleStartDateChange = (startDate) => {
        formik.setFieldValue("startDate", startDate);

        if (startDate) {
            const selectedSchedule = tourSchedules.find(schedule =>
                schedule.startDate === startDate
            );
            setSelectedSchedule(selectedSchedule);
            calculateTotalPrice(formik.values.adults, formik.values.children, formik.values.babies, selectedSchedule);
        } else {
            setSelectedSchedule(null);
            formik.setFieldValue("totalPrice", 0);
        }
    };

    const handlePeopleChange = (name, value) => {
        const numValue = parseInt(value) || 0;
        formik.setFieldValue(name, numValue);

        if (selectedSchedule) {
            const adults = name === "adults" ? numValue : formik.values.adults;
            const children = name === "children" ? numValue : formik.values.children;
            const babies = name === "babies" ? numValue : formik.values.babies;
            calculateTotalPrice(adults, children, babies, selectedSchedule);
        }
    };

    const calculateTotalPrice = (adults, children, babies, schedule = selectedSchedule) => {
        if (!schedule) return;

        const adultPrice = schedule.price || 0;
        const childPrice = schedule.childPrice || 0;
        const babyPrice = schedule.babyPrice || 0;

        const total = (adults * adultPrice) + (children * childPrice) + (babies * babyPrice);
        formik.setFieldValue("totalPrice", total);
    };

    // Reset form khi đóng/mở modal
    useEffect(() => {
        if (show) {
            formik.resetForm();
            setTourSchedules([]);
            setSelectedTour(null);
            setSelectedSchedule(null);
            fetchTours();
        }
    }, [show]);

    const formatDate = (dateStr) => {
        return dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "";
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const totalPeople = formik.values.adults + formik.values.children + formik.values.babies;

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Plus size={24} className="text-green-600" />
                        <h2 className="text-xl font-bold text-gray-800">Tạo Booking Mới</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={apiLoading || loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <User size={20} />
                            Thông tin khách hàng
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ tên *
                                </label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formik.values.customerName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    required
                                    disabled={apiLoading || loading}
                                    className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.customerName && formik.errors.customerName
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Nhập họ tên khách hàng"
                                />
                                {formik.touched.customerName && formik.errors.customerName && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.customerName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số điện thoại *
                                </label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formik.values.phone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        required
                                        disabled={apiLoading || loading}
                                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                            formik.touched.phone && formik.errors.phone
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                                {formik.touched.phone && formik.errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.phone}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="customerEmail"
                                    value={formik.values.customerEmail}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    disabled={apiLoading || loading}
                                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.customerEmail && formik.errors.customerEmail
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Nhập email khách hàng"
                                />
                            </div>
                            {formik.touched.customerEmail && formik.errors.customerEmail && (
                                <p className="text-red-500 text-sm mt-1">{formik.errors.customerEmail}</p>
                            )}
                        </div>
                    </div>

                    {/* Thông tin tour */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar size={20} />
                            Thông tin tour
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn tour *
                                </label>
                                <select
                                    name="tourId"
                                    value={formik.values.tourId}
                                    onChange={(e) => handleTourChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    required
                                    disabled={apiLoading || loading}
                                    className={`w-full border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.tourId && formik.errors.tourId
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <option value="">Chọn tour</option>
                                    {tours.map(tour => (
                                        <option key={tour.id} value={tour.id}>
                                            {tour.title} - {formatCurrency(tour.basePrice || 0)}
                                        </option>
                                    ))}
                                </select>
                                {formik.touched.tourId && formik.errors.tourId && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.tourId}</p>
                                )}
                                {apiLoading && <p className="text-sm text-gray-500 mt-1">Đang tải tours...</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày khởi hành *
                                </label>
                                <select
                                    name="startDate"
                                    value={formik.values.startDate}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    required
                                    disabled={!formik.values.tourId || apiLoading || loading}
                                    className={`w-full border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.startDate && formik.errors.startDate
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <option value="">Chọn ngày khởi hành</option>
                                    {tourSchedules.map(schedule => (
                                        <option key={schedule.id} value={schedule.startDate}>
                                            {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                            ({schedule.status === 'UPCOMING' ? 'Sắp diễn ra' : 'Đang diễn ra'})
                                        </option>
                                    ))}
                                </select>
                                {formik.touched.startDate && formik.errors.startDate && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.startDate}</p>
                                )}
                                {apiLoading && formik.values.tourId && <p className="text-sm text-gray-500 mt-1">Đang tải lịch trình...</p>}
                            </div>
                        </div>

                        {/* Hiển thị thông tin giá */}
                        {selectedSchedule && (
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-semibold text-gray-800 mb-2">Thông tin giá:</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Người lớn:</span>
                                        <p className="font-semibold">{formatCurrency(selectedSchedule.price || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Trẻ em:</span>
                                        <p className="font-semibold">{formatCurrency(selectedSchedule.childPrice || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Em bé:</span>
                                        <p className="font-semibold">{formatCurrency(selectedSchedule.babyPrice || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Số lượng người */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Users size={20} />
                            Số lượng người
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Người lớn
                                </label>
                                <input
                                    type="number"
                                    name="adults"
                                    value={formik.values.adults}
                                    onChange={(e) => handlePeopleChange("adults", e.target.value)}
                                    onBlur={formik.handleBlur}
                                    min="1"
                                    max="20"
                                    disabled={apiLoading || loading}
                                    className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.adults && formik.errors.adults
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                                {formik.touched.adults && formik.errors.adults && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.adults}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trẻ em
                                </label>
                                <input
                                    type="number"
                                    name="children"
                                    value={formik.values.children}
                                    onChange={(e) => handlePeopleChange("children", e.target.value)}
                                    onBlur={formik.handleBlur}
                                    min="0"
                                    max="20"
                                    disabled={apiLoading || loading}
                                    className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.children && formik.errors.children
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                                {formik.touched.children && formik.errors.children && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.children}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Em bé
                                </label>
                                <input
                                    type="number"
                                    name="babies"
                                    value={formik.values.babies}
                                    onChange={(e) => handlePeopleChange("babies", e.target.value)}
                                    onBlur={formik.handleBlur}
                                    min="0"
                                    max="20"
                                    disabled={apiLoading || loading}
                                    className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                        formik.touched.babies && formik.errors.babies
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                                {formik.touched.babies && formik.errors.babies && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.babies}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-blue-800 text-sm font-medium">
                                    Tổng số người: <span className="font-bold">{totalPeople}</span>
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl">
                                <p className="text-green-800 text-sm font-medium">
                                    Tổng tiền: <span className="font-bold">{formatCurrency(formik.values.totalPrice)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú
                        </label>
                        <textarea
                            name="notes"
                            value={formik.values.notes}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            rows="3"
                            disabled={apiLoading || loading}
                            className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 ${
                                formik.touched.notes && formik.errors.notes
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="Nhập ghi chú (nếu có)"
                        />
                        {formik.touched.notes && formik.errors.notes && (
                            <p className="text-red-500 text-sm mt-1">{formik.errors.notes}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                            disabled={apiLoading || loading || formik.isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={apiLoading || loading || formik.isSubmitting || !formik.isValid}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {(apiLoading || loading || formik.isSubmitting) ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Tạo Booking
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminCreateBookingModal;