import React from "react";

// Helper function để chuyển đổi trạng thái
const getVietnameseStatus = (status) => {
    switch(status) {
        case 'PENDING':
            return 'ĐANG CHỜ XÁC NHẬN';
        case 'CONFIRMED':
            return 'ĐÃ XÁC NHẬN';
        case 'CANCELLED':
            return 'ĐÃ HỦY';
        case 'DEPOSIT_PAID':
            return 'ĐÃ ĐẶT CỌC';
        case 'PAID':
            return 'ĐÃ THANH TOÁN';
        default:
            return status || 'ĐÃ XÁC NHẬN';
    }
};

// Helper function để lấy icon
const getStatusIcon = (status) => {
    switch(status) {
        case 'PENDING':
            return '⏳';
        case 'CONFIRMED':
        case 'PAID':
            return '✓';
        case 'DEPOSIT_PAID':
            return '💰';
        case 'CANCELLED':
            return '✗';
        default:
            return '✓';
    }
};

// Helper function để tính tổng tiền
const calculateTotalAmount = (booking) => {
    const { adultCount, childCount, babyCount } = booking;
    const { price, childPrice, babyPrice } = booking.tourSchedule;

    const adultTotal = adultCount * price;
    const childTotal = childCount * childPrice;
    const babyTotal = babyCount * babyPrice;

    return adultTotal + childTotal + babyTotal;
};

// Helper function để format tiền
const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const TicketPdf = React.forwardRef(({ booking, tour, schedule, qrDataUrl }, ref) => {
    const vietnameseStatus = getVietnameseStatus(booking.status);
    const statusIcon = getStatusIcon(booking.status);

    // Tính toán tổng tiền
    const totalAmount = calculateTotalAmount(booking);
    const paidAmount = booking.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;

    return (
        <div
            ref={ref}
            style={{
                fontFamily: "'DejaVu Sans', Arial, sans-serif",
                width: "800px",
                background: "#f4f4f6",
                color: "#222",
                padding: "0",
                margin: "0",
            }}
        >
            <div style={{ margin: "0 auto", padding: "0", width: "100%" }}>
                {/* Header */}
                <div
                    style={{
                        background: "linear-gradient(90deg,#10b981,#059669)",
                        color: "#fff",
                        padding: "20px",
                        borderRadius: "12px 12px 0 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: "24px" }}>TravelGo</div>
                    <div style={{ fontWeight: 600, fontSize: "16px" }}>Vé điện tử - Xác nhận đặt tour</div>
                </div>

                {/* Cover image */}
                <img
                    src={tour.image}
                    alt="cover"
                    style={{ width: "100%", height: "250px", objectFit: "cover" }}
                />

                {/* Content */}
                <div style={{ background: "#fff", padding: "20px", borderRadius: "0 0 12px 12px" }}>
                    <h1 style={{ fontSize: "22px", marginBottom: "10px" }}>{tour.title}</h1>
                    <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                        Thời gian: {new Date(schedule.startDate).toLocaleDateString("vi-VN")} -{" "}
                        {new Date(schedule.endDate).toLocaleDateString("vi-VN")} · {tour.duration} ngày
                    </div>

                    <div style={{ fontWeight: 600, fontSize: "16px", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", marginBottom: "10px" }}>
                        Thông tin đặt vé
                    </div>

                    <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                        <div>Mã Booking: <strong>{booking.bookingCode}</strong></div>
                        <div>Khách hàng: <strong>{booking.user.name}</strong></div>
                        <div>Email: <strong>{booking.user.email}</strong></div>
                        <div>Số người: <strong>{booking.numberOfPeople}</strong></div>

                        <div style={{ margin: "10px 0", padding: "10px", background: "#f8f9fa", borderRadius: "6px" }}>
                            <div style={{ fontWeight: 600, marginBottom: "5px" }}>Chi tiết số lượng:</div>
                            <div>Người lớn: <strong>{booking.adultCount}</strong> × {formatCurrency(booking.tourSchedule.price)}</div>
                            {booking.childCount > 0 && (
                                <div>Trẻ em: <strong>{booking.childCount}</strong> × {formatCurrency(booking.tourSchedule.childPrice)}</div>
                            )}
                            {booking.babyCount > 0 && (
                                <div>Em bé: <strong>{booking.babyCount}</strong> × {formatCurrency(booking.tourSchedule.babyPrice)}</div>
                            )}
                        </div>

                        <div style={{ margin: "10px 0", padding: "10px", background: "#e8f6ef", borderRadius: "6px" }}>
                            <div style={{ fontWeight: 600, marginBottom: "5px" }}>Thông tin thanh toán:</div>
                            <div>Tổng tiền: <strong style={{ color: "#dc2626", fontSize: "16px" }}>{formatCurrency(totalAmount)}</strong></div>
                            <div>Đã thanh toán: <strong style={{ color: "#059669" }}>{formatCurrency(paidAmount)}</strong></div>
                        </div>

                        <div>
                            Trạng thái:
                            <strong style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                backgroundColor:
                                    booking.status === 'CONFIRMED' || booking.status === 'PAID' ? '#e8f6ef' :
                                        booking.status === 'DEPOSIT_PAID' ? '#e0f2fe' :
                                            booking.status === 'PENDING' ? '#fff9e6' : '#fdeaea',
                                color:
                                    booking.status === 'CONFIRMED' || booking.status === 'PAID' ? '#27ae60' :
                                        booking.status === 'DEPOSIT_PAID' ? '#0369a1' :
                                            booking.status === 'PENDING' ? '#f39c12' : '#e74c3c'
                            }}>
                                <span style={{ marginRight: '4px' }}>{statusIcon}</span>
                                {vietnameseStatus}
                            </strong>
                        </div>
                    </div>

                    <div style={{ display: "flex", marginTop: "20px", gap: "30px" }}>
                        {qrDataUrl && (
                            <div>
                                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Mã QR (quét để kiểm tra vé)</div>
                                <img src={qrDataUrl} alt="QR" style={{ width: "120px", height: "120px" }} />
                            </div>
                        )}
                        <div style={{ fontSize: "13px", color: "#374151" }}>
                            <p>Hướng dẫn:</p>
                            <ul>
                                <li>Vui lòng mang bản in hoặc trình vé trên điện thoại khi check-in.</li>
                                <li>Liên hệ hotline: <strong>+84 123 456 789</strong> nếu cần hỗ trợ.</li>
                                {remainingAmount > 0 && (
                                    <li>Vui lòng thanh toán số tiền còn lại trước ngày khởi hành.</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div style={{ marginTop: "30px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                        TravelGo • Email: support@travelgo.example • Hotline: +84 123 456 789
                    </div>
                </div>
            </div>
        </div>
    );
});

export default TicketPdf;