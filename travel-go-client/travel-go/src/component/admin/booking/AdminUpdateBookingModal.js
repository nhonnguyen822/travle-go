import React, { useState, useEffect } from "react";
import { X, Save, DollarSign, AlertCircle, Calendar } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getScheduleByBookingId } from "../../../service/schedule_service";

const AdminUpdateBookingModal = ({
                              show,
                              onClose,
                              onUpdate,
                              booking,
                              loading = false,
                              formatPrice,
                              formatDate
                          }) => {
    const [apiError, setApiError] = useState("");
    const [totalAmount, setTotalAmount] = useState(0);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState(null);

    const formik = useFormik({
        initialValues: {
            customerName: "",
            customerEmail: "",
            phone: "",
            adults: 1,
            children: 0,
            babies: 0,
            notes: ""
        },
        validationSchema: Yup.object({
            customerName: Yup.string()
                .required("Tên khách hàng là bắt buộc")
                .min(2, "Tên phải có ít nhất 2 ký tự")
                .max(50, "Tên không được vượt quá 50 ký tự"),
            customerEmail: Yup.string()
                .email("Email không hợp lệ")
                .required("Email là bắt buộc")
                .max(100, "Email không được vượt quá 100 ký tự"),
            phone: Yup.string()
                .required("Số điện thoại là bắt buộc")
                .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ"),
            adults: Yup.number()
                .min(1, "Số người lớn phải lớn hơn 0")
                .required("Vui lòng nhập số người lớn"),
            children: Yup.number()
                .min(0, "Số trẻ em không được âm")
                .required("Vui lòng nhập số trẻ em"),
            babies: Yup.number()
                .min(0, "Số em bé không được âm")
                .required("Vui lòng nhập số em bé"),
            notes: Yup.string()
                .max(500, "Ghi chú không được vượt quá 500 ký tự")
        }),
        onSubmit: async (values) => {
            try {
                setApiError("");

                // Tạo booking request theo đúng format AdminBookingRequest
                const bookingRequest = {
                    customerName: values.customerName,
                    customerEmail: values.customerEmail,
                    phone: values.phone,
                    tourId: currentSchedule?.tour?.id || booking.tourSchedule?.tour?.id,
                    startDate: formatDateForBackend(booking.tourSchedule?.startDate),
                    adults: values.adults,
                    children: values.children,
                    babies: values.babies,
                    notes: values.notes
                };
                await onUpdate(booking.id, bookingRequest);
            } catch (error) {
                setApiError(error.message || "❌ Có lỗi xảy ra khi cập nhật booking. Vui lòng thử lại.");
            }
        }
    });

    // Format date cho backend (yyyy-MM-dd)
    const formatDateForBackend = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Load schedule theo booking ID khi mở modal
    useEffect(() => {
        if (show && booking?.id) {
            loadScheduleByBookingId(booking.id);
        }
    }, [show, booking]);

    // Khởi tạo form values khi có booking
    useEffect(() => {
        if (booking) {
            formik.setValues({
                customerName: booking.user?.name || "",
                customerEmail: booking.user?.email || "",
                phone: booking.user?.phone || "",
                adults: booking.adultCount || 1,
                children: booking.childCount || 0,
                babies: booking.babyCount || 0,
                notes: booking.notes || ""
            });
        }
    }, [booking]);

    useEffect(() => {
        if (currentSchedule || booking?.tourSchedule) {
            calculateTotalAmount();
        }
    }, [formik.values.adults, formik.values.children, formik.values.babies, currentSchedule]);


    const loadScheduleByBookingId = async (bookingId) => {
        setLoadingSchedules(true);
        try {
            console.log("🔄 Đang load schedule cho booking:", bookingId);
            const schedule = await getScheduleByBookingId(bookingId);
            console.log("📊 Schedule nhận được:", schedule);

            if (schedule) {
                setCurrentSchedule(schedule);
            } else {
                console.warn("⚠️ Không tìm thấy schedule cho booking này");
                setCurrentSchedule(null);
            }
        } catch (error) {
            console.error("❌ Lỗi khi load schedule:", error);
            setCurrentSchedule(null);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const calculateTotalAmount = () => {
        const schedule = currentSchedule || booking?.tourSchedule;
        if (!schedule) {
            setTotalAmount(0);
            return;
        }

        const adultPrice = schedule.price || 0;
        const childPrice = schedule.childPrice || 0;
        const babyPrice = schedule.babyPrice || 0;

        const total = (
            (formik.values.adults * adultPrice) +
            (formik.values.children * childPrice) +
            (formik.values.babies * babyPrice)
        );

        setTotalAmount(total);
    };

    const handleClose = () => {
        setApiError("");
        formik.resetForm();
        setTotalAmount(0);
        setCurrentSchedule(null);
        onClose();
    };

    // Tính tổng số người
    const totalPeople = formik.values.adults + formik.values.children + formik.values.babies;

    // Lấy thông tin giá từ schedule hiện tại hoặc booking
    const schedule = currentSchedule || booking?.tourSchedule;
    const adultPrice = schedule?.price || 0;
    const childPrice = schedule?.childPrice || 0;
    const babyPrice = schedule?.babyPrice || 0;

    // Hàm hiển thị trạng thái booking theo tiếng Việt
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING':
                return { text: 'Đang chờ xác nhận', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
            case 'DEPOSIT_PAID':
                return { text: 'Đã đặt cọc', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
            case 'PAID':
                return { text: 'Đã thanh toán', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
            case 'CANCELLED':
                return { text: 'Đã hủy', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
            default:
                return { text: status, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
        }
    };

    const statusDisplay = getStatusDisplay(booking?.status);

    if (!show || !booking) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Save className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                Chỉnh Sửa Booking
                            </h3>
                            <p className="text-gray-500 text-sm">Mã: {booking.bookingCode}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* THÔNG BÁO TRẠNG THÁI HIỆN TẠI (chỉ để thông tin, không chặn chỉnh sửa) */}
                <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-700">
                        <AlertCircle size={18} />
                        <span className="font-medium">Trạng thái hiện tại: {statusDisplay.text}</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">
                        Bạn có thể chỉnh sửa thông tin khách hàng và số lượng người.
                        {booking.status === 'PAID' && " Lưu ý: Booking đã thanh toán hoàn tất."}
                        {booking.status === 'CANCELLED' && " Lưu ý: Booking đã bị hủy."}
                    </p>
                </div>

                <form onSubmit={formik.handleSubmit}>
                    <div className="p-6">
                        {/* Hiển thị lỗi API */}
                        {apiError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium">{apiError}</span>
                                </div>
                            </div>
                        )}

                        {/* Loading indicator */}
                        {loadingSchedules && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                                    <span className="text-sm font-medium">Đang tải thông tin lịch trình...</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Thông tin booking hiện tại */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Calendar className="text-blue-600" size={20} />
                                    Thông Tin Booking Hiện Tại
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="block text-gray-600 mb-1">Mã booking</label>
                                        <div className="font-semibold text-gray-800">{booking.bookingCode}</div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Trạng thái</label>
                                        <div className={`px-2 py-1 rounded-lg text-center font-medium ${statusDisplay.bg} ${statusDisplay.color} ${statusDisplay.border}`}>
                                            {statusDisplay.text}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Ngày đặt</label>
                                        <div className="font-semibold text-gray-800">{formatDate(booking.bookingDate)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Tour</label>
                                        <div className="font-semibold text-gray-800">{booking.tourSchedule?.tour?.title}</div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Ngày khởi hành</label>
                                        <div className="font-semibold text-gray-800">{formatDate(booking.tourSchedule?.startDate)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Số người hiện tại</label>
                                        <div className="font-semibold text-gray-800">
                                            {(booking.adultCount || 0) + (booking.childCount || 0) + (booking.babyCount || 0)} người
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin lịch trình */}
                            {currentSchedule && (
                                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                                    <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                                        <Calendar className="text-green-600" size={20} />
                                        Thông Tin Lịch Trình
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <label className="block text-gray-600 mb-1">Ngày bắt đầu</label>
                                            <div className="font-semibold text-gray-800">{formatDate(currentSchedule.startDate)}</div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 mb-1">Ngày kết thúc</label>
                                            <div className="font-semibold text-gray-800">{formatDate(currentSchedule.endDate)}</div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 mb-1">Giá người lớn</label>
                                            <div className="font-semibold text-gray-800">{formatPrice(currentSchedule.price)}</div>
                                        </div>
                                        {currentSchedule.childPrice > 0 && (
                                            <div>
                                                <label className="block text-gray-600 mb-1">Giá trẻ em</label>
                                                <div className="font-semibold text-gray-800">{formatPrice(currentSchedule.childPrice)}</div>
                                            </div>
                                        )}
                                        {currentSchedule.babyPrice > 0 && (
                                            <div>
                                                <label className="block text-gray-600 mb-1">Giá em bé</label>
                                                <div className="font-semibold text-gray-800">{formatPrice(currentSchedule.babyPrice)}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!currentSchedule && !loadingSchedules && (
                                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                    <div className="flex items-center gap-2 text-yellow-700">
                                        <AlertCircle size={16} />
                                        <span className="text-sm">Không tìm thấy thông tin lịch trình hiện tại</span>
                                    </div>
                                </div>
                            )}

                            {/* Form chỉnh sửa */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                                    Thông Tin Chỉnh Sửa
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Customer Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên khách hàng *
                                        </label>
                                        <input
                                            type="text"
                                            name="customerName"
                                            value={formik.values.customerName}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            disabled={loading}
                                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                formik.touched.customerName && formik.errors.customerName
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                        {formik.touched.customerName && formik.errors.customerName && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {formik.errors.customerName}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số điện thoại *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formik.values.phone}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            disabled={loading}
                                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                formik.touched.phone && formik.errors.phone
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                        {formik.touched.phone && formik.errors.phone && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {formik.errors.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="customerEmail"
                                            value={formik.values.customerEmail}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            disabled={loading}
                                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                formik.touched.customerEmail && formik.errors.customerEmail
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                        {formik.touched.customerEmail && formik.errors.customerEmail && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {formik.errors.customerEmail}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Số lượng người */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Số lượng người *
                                    </label>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1 ">Người lớn *</label>
                                            <input
                                                type="number"
                                                name="adults"
                                                min="1"
                                                value={formik.values.adults}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                disabled={true}
                                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                    formik.touched.adults && formik.errors.adults
                                                        ? 'border-red-500'
                                                        : 'border-gray-300'
                                                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                            {formik.touched.adults && formik.errors.adults && (
                                                <div className="text-red-500 text-xs mt-1">
                                                    {formik.errors.adults}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Trẻ em *</label>
                                            <input
                                                type="number"
                                                name="children"
                                                min="0"
                                                value={formik.values.children}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                disabled={true}
                                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                    formik.touched.children && formik.errors.children
                                                        ? 'border-red-500'
                                                        : 'border-gray-300'
                                                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                            {formik.touched.children && formik.errors.children && (
                                                <div className="text-red-500 text-xs mt-1">
                                                    {formik.errors.children}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Em bé *</label>
                                            <input
                                                type="number"
                                                name="babies"
                                                min="0"
                                                value={formik.values.babies}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                disabled={true}
                                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                    formik.touched.babies && formik.errors.babies
                                                        ? 'border-red-500'
                                                        : 'border-gray-300'
                                                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                            {formik.touched.babies && formik.errors.babies && (
                                                <div className="text-red-500 text-xs mt-1">
                                                    {formik.errors.babies}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 text-sm text-gray-600">
                                        Tổng số người: <span className="font-semibold">{totalPeople}</span>
                                    </div>
                                </div>

                                {/* Tổng số tiền */}
                                {totalAmount > 0 && (
                                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <DollarSign className="h-6 w-6 text-green-600" />
                                                <div>
                                                    <h5 className="font-bold text-gray-800">Tổng số tiền</h5>
                                                    <p className="text-sm text-gray-600">Số tiền cần thu từ khách hàng</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-green-600">
                                                    {formatPrice(totalAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú thêm
                                    </label>
                                    <textarea
                                        name="notes"
                                        placeholder="Ghi chú đặc biệt cho booking..."
                                        rows="3"
                                        value={formik.values.notes}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        disabled={loading}
                                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                            formik.touched.notes && formik.errors.notes
                                                ? 'border-red-500'
                                                : 'border-gray-300'
                                        } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                    {formik.touched.notes && formik.errors.notes && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {formik.errors.notes}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formik.values.notes.length}/500 ký tự
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formik.isValid || !formik.dirty}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUpdateBookingModal;