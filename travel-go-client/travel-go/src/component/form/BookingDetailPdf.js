import React from "react";

const BookingDetailPdf = React.forwardRef(({ booking }, ref) => {
    const tour = booking?.tourSchedule?.tour;
    const schedule = booking?.tourSchedule;

    if (!booking || !tour || !schedule) return null;

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString("vi-VN");

    // Tính toán chiều cao ước tính cho mỗi ngày
    const estimateDayHeight = (day) => {
        let height = 80; // Chiều cao cơ bản cho title và padding
        day.activities?.forEach(act => {
            height += 100; // Mỗi activity khoảng 100px
            if (act.imageUrl) height += 20; // Thêm nếu có ảnh
        });
        return height;
    };

    // Kiểm tra xem có cần xuống trang không dựa trên chiều cao tích lũy
    const checkPageBreak = (currentIndex, accumulatedHeight) => {
        const currentDayHeight = estimateDayHeight(tour.itineraryDays[currentIndex]);
        // Nếu thêm ngày này vượt quá 700px (khoảng 1 trang A4) thì xuống trang
        if (accumulatedHeight + currentDayHeight > 700 && currentIndex > 0) {
            return true;
        }
        return false;
    };

    let accumulatedHeight = 0;

    return (
        <div
            ref={ref}
            style={{
                fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                width: "100%",
                maxWidth: "800px",
                margin: "0 auto",
                background: "#f8fafc",
                color: "#1e293b",
                padding: "15px",
                borderRadius: "12px",
                boxSizing: "border-box",
            }}
        >
            {/* HEADER - Cố định chiều cao */}
            <header
                style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    textAlign: "center",
                    marginBottom: "18px",
                    height: "80px", // Cố định chiều cao
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <h1 style={{ fontSize: "22px", margin: 0, fontWeight: 700 }}>
                    Chi tiết Booking Tour
                </h1>
                <p style={{ fontSize: "13px", opacity: 0.9, margin: "4px 0 0 0" }}>
                    Cảm ơn bạn đã chọn đồng hành cùng TravelGo
                </p>
            </header>

            {/* THÔNG TIN TOUR - Cố định chiều cao */}
            <section
                style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    marginBottom: "18px",
                    minHeight: "180px", // Chiều cao tối thiểu
                }}
            >
                <h2
                    style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#2563eb",
                        borderBottom: "2px solid #e2e8f0",
                        paddingBottom: "5px",
                        marginBottom: "10px",
                    }}
                >
                    🏝️ Thông tin tour
                </h2>

                <p style={{ margin: "6px 0", fontSize: "14px" }}><b>Tiêu đề:</b> {tour.title}</p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><b>Điểm đến:</b> {tour.destination}</p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><b>Thời lượng:</b> {tour.duration} ngày</p>

                <div
                    style={{
                        background: "#f1f5f9",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginTop: "8px",
                    }}
                >
                    <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Ngày khởi hành:</b> {formatDate(schedule.startDate)}</p>
                    <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Ngày kết thúc:</b> {formatDate(schedule.endDate)}</p>
                </div>
            </section>

            {/* CHI TIẾT HÀNH TRÌNH - Xử lý page break thông minh */}
            {tour.itineraryDays?.length > 0 && (
                <section
                    style={{
                        background: "#fff",
                        padding: "15px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                        marginBottom: "18px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#2563eb",
                            borderBottom: "2px solid #e2e8f0",
                            paddingBottom: "5px",
                            marginBottom: "12px",
                        }}
                    >
                        📅 Chi tiết hành trình theo ngày
                    </h2>

                    {tour.itineraryDays.map((day, idx) => {
                        const dayHeight = estimateDayHeight(day);
                        const needPageBreak = checkPageBreak(idx, accumulatedHeight);
                        accumulatedHeight += dayHeight;

                        if (needPageBreak) {
                            accumulatedHeight = dayHeight; // Reset cho trang mới
                        }

                        return (
                            <div
                                key={idx}
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                    pageBreakInside: "avoid", // Quan trọng: không cắt ngày
                                    breakInside: "avoid",
                                    ...(needPageBreak && {
                                        pageBreakBefore: "always",
                                        breakBefore: "page"
                                    })
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: "15px",
                                        color: "#0f172a",
                                        marginBottom: "8px",
                                        pageBreakAfter: "avoid"
                                    }}
                                >
                                    Ngày {day.dayIndex || idx + 1}: {day.title}
                                </div>

                                {day.description && (
                                    <p style={{
                                        fontSize: "13px",
                                        color: "#475569",
                                        marginBottom: "10px",
                                        lineHeight: "1.4"
                                    }}>
                                        {day.description}
                                    </p>
                                )}

                                {day.activities?.map((act, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginTop: "8px",
                                            alignItems: "flex-start",
                                            borderBottom: "1px dashed #e2e8f0",
                                            paddingBottom: "8px",
                                            pageBreakInside: "avoid",
                                            breakInside: "avoid",
                                        }}
                                    >
                                        {act.imageUrl && (
                                            <img
                                                src={act.imageUrl}
                                                alt={act.title}
                                                style={{
                                                    width: "100px", // Giảm kích thước ảnh
                                                    height: "75px",
                                                    objectFit: "cover",
                                                    borderRadius: "6px",
                                                    flexShrink: 0,
                                                    pageBreakInside: "avoid",
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none'; // Ẩn ảnh nếu lỗi
                                                }}
                                            />
                                        )}
                                        <div style={{
                                            flex: 1,
                                            fontSize: "12px",
                                            minHeight: "75px" // Đảm bảo chiều cao đồng nhất
                                        }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: "#334155",
                                                marginBottom: "4px"
                                            }}>
                                                {act.title}
                                            </div>
                                            {act.time && (
                                                <div style={{
                                                    color: "#64748b",
                                                    fontSize: "11px",
                                                    marginBottom: "4px"
                                                }}>
                                                    🕒 {act.time}
                                                </div>
                                            )}
                                            {act.details && (
                                                <p style={{
                                                    margin: "0",
                                                    color: "#475569",
                                                    lineHeight: "1.3",
                                                    fontSize: "11px"
                                                }}>
                                                    {act.details}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </section>
            )}

            {/* FOOTER - Cố định ở cuối */}
            <footer
                style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "20px",
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "8px",
                    pageBreakBefore: "avoid"
                }}
            >
                <p style={{ margin: "3px 0" }}>
                    © 2025 TravelGo • Email: support@travelgo.example • Hotline: +84 123 456 789
                </p>
                <p style={{ margin: 0 }}>Website: www.travelgo.vn</p>
            </footer>
        </div>
    );
});

export default BookingDetailPdf;