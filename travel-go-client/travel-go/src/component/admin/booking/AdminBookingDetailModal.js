import React, {useState} from "react";
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    Clock,
    CreditCard,
    Mail,
    MapPin,
    Phone,
    User,
    Users,
    X
} from "lucide-react";

const AdminBookingDetailModal = ({
                                show,
                                onClose,
                                booking,
                                formatPrice,
                                formatDate
                            }) => {
    const [apiError, setApiError] = useState("");

    const handleClose = () => {
        setApiError("");
        onClose();
    };

    // Tính tổng số người
    const totalPeople = (booking?.adultCount || 0) + (booking?.childCount || 0) + (booking?.babyCount || 0);

    // Tính tổng tiền
    const calculateTotalAmount = () => {
        if (!booking?.tourSchedule) return 0;

        const adultPrice = booking.tourSchedule.price || 0;
        const childPrice = booking.tourSchedule.childPrice || 0;
        const babyPrice = booking.tourSchedule.babyPrice || 0;

        return (
            (booking.adultCount * adultPrice) +
            (booking.childCount * childPrice) +
            (booking.babyCount * babyPrice)
        );
    };

    const totalAmount = calculateTotalAmount();
    const remainingAmount = totalAmount - (booking?.paidAmount || 0);

    const calculateTourDuration = () => {
        if (!booking?.tourSchedule?.startDate || !booking?.tourSchedule?.endDate) {
            return "Không xác định";
        }

        const start = new Date(booking.tourSchedule.startDate);
        const end = new Date(booking.tourSchedule.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return `${diffDays} ngày ${diffDays > 1 ? diffDays - 1 : diffDays} đêm`;
    };

    const tourDuration = calculateTourDuration();

    if (!show || !booking) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <CalendarDays className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                Chi Tiết Đặt Tour
                            </h3>
                            <p className="text-green-100 text-sm">Mã booking: {booking.bookingCode}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-green-100 transition-colors bg-white bg-opacity-20 rounded-full p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {apiError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle size={18} />
                                <span className="text-sm font-medium">{apiError}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cột trái: Thông tin khách hàng và booking */}
                        <div className="space-y-6">
                            {/* Thông tin khách hàng */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                    <User className="text-green-600" size={20} />
                                    Thông Tin Khách Hàng
                                </h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Họ tên
                                            </label>
                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium">
                                                {booking.user?.name || "Không có thông tin"}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Số điện thoại
                                            </label>
                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                {booking.user?.phone || "Không có thông tin"}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Email
                                        </label>
                                        <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            {booking.user?.email || "Không có thông tin"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin booking */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                    <Calendar className="text-blue-600" size={20} />
                                    Thông Tin Booking
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Mã booking</label>
                                        <div className="font-bold text-gray-800 text-lg bg-blue-50 px-3 py-2 rounded-lg border">
                                            {booking.bookingCode}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Trạng thái</label>
                                        <div className={`px-3 py-2 rounded-lg border font-semibold text-center ${
                                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-green-200' :
                                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                                                        'bg-blue-100 text-blue-800 border-blue-200'
                                        }`}>
                                            {booking.status === 'CONFIRMED' ? 'Đã xác nhận' :
                                                booking.status === 'PENDING' ? 'Đang chờ' :
                                                    booking.status === 'CANCELLED' ? 'Đã hủy' :
                                                        booking.status}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Ngày đặt</label>
                                        <div className="font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border">
                                            {new Date(booking.bookingDate).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Số lượng người */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                    <Users className="text-purple-600" size={20} />
                                    Thành Viên Tham Gia
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <div className="bg-blue-100 text-blue-800 rounded-lg p-3">
                                            <div className="text-2xl font-bold">{booking.adultCount || 0}</div>
                                            <div className="text-sm font-medium">Người lớn</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="bg-green-100 text-green-800 rounded-lg p-3">
                                            <div className="text-2xl font-bold">{booking.childCount || 0}</div>
                                            <div className="text-sm font-medium">Trẻ em</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="bg-orange-100 text-orange-800 rounded-lg p-3">
                                            <div className="text-2xl font-bold">{booking.babyCount || 0}</div>
                                            <div className="text-sm font-medium">Em bé</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                    Tổng số thành viên: <span className="font-bold text-gray-800">{totalPeople} người</span>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Thông tin tour và thanh toán */}
                        <div className="space-y-6">
                            {/* Thông tin tour */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                    <MapPin className="text-red-600" size={20} />
                                    Thông Tin Tour
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Tên tour</label>
                                        <div className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-gray-50 font-bold text-gray-800 text-lg">
                                            {booking.tourSchedule?.tour?.title || "Không có thông tin"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Điểm đến</label>
                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium">
                                                {booking.tourSchedule?.tour?.destination || "Không xác định"}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Thời gian tour</label>
                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400" />
                                                {tourDuration}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Ngày bắt đầu</label>
                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-blue-50 font-semibold text-blue-800 text-center">
                                                {formatDate(booking.tourSchedule?.startDate)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Ngày kết thúc</label>
                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-green-50 font-semibold text-green-800 text-center">
                                                {formatDate(booking.tourSchedule?.endDate)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin thanh toán */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                    <CreditCard className="text-green-600" size={20} />
                                    Thông Tin Thanh Toán
                                </h4>

                                <div className="space-y-3">
                                    {/* Chi tiết giá */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Người lớn ({booking.adultCount} × {formatPrice(booking.tourSchedule?.price || 0)})</span>
                                                <span className="font-semibold">{formatPrice((booking.adultCount || 0) * (booking.tourSchedule?.price || 0))}</span>
                                            </div>
                                            {booking.childCount > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Trẻ em ({booking.childCount} × {formatPrice(booking.tourSchedule?.childPrice || 0)})</span>
                                                    <span className="font-semibold">{formatPrice(booking.childCount * (booking.tourSchedule?.childPrice || 0))}</span>
                                                </div>
                                            )}
                                            {booking.babyCount > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Em bé ({booking.babyCount} × {formatPrice(booking.tourSchedule?.babyPrice || 0)})</span>
                                                    <span className="font-semibold">{formatPrice(booking.babyCount * (booking.tourSchedule?.babyPrice || 0))}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tổng tiền */}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                        <span className="font-semibold text-gray-700">Tổng tiền tour:</span>
                                        <span className="font-bold text-lg text-blue-600">{formatPrice(totalAmount)}</span>
                                    </div>

                                    {/* Đã thanh toán */}
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-700">Đã thanh toán:</span>
                                        <span className="font-bold text-lg text-green-600">{formatPrice(booking.paidAmount || 0)}</span>
                                    </div>

                                    {/* Còn lại */}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                        <span className="font-semibold text-gray-700">Còn lại:</span>
                                        <span className={`font-bold text-lg ${
                                            remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                                        }`}>
                                            {formatPrice(remainingAmount)}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    {totalAmount > 0 && (
                                        <div className="pt-3">
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>Tiến độ thanh toán</span>
                                                <span>{Math.round(((booking.paidAmount || 0) / totalAmount) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(((booking.paidAmount || 0) / totalAmount) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ghi chú (nếu có) */}
                            {booking.notes && (
                                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <AlertCircle size={18} className="text-gray-500" />
                                        Ghi Chú Đặc Biệt
                                    </h4>
                                    <div className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-yellow-50 text-gray-700">
                                        {booking.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBookingDetailModal;