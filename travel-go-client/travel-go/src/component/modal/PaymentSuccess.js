import React, {useEffect, useRef, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import Confetti from "react-confetti";
import {getBookingById} from "../../service/booking_service";
import {sendBookingEmail} from "../../service/email_service";
import html2pdf from "html2pdf.js";
import TicketPdf from "../form/TicketPdf";
import BookingDetailPdf from "../form/BookingDetailPdf";
import QRCode from "qrcode";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const [booking, setBooking] = useState(null);
    const [showConfetti, setShowConfetti] = useState(true);
    const [mailStatus, setMailStatus] = useState("sending");

    const ticketRef = useRef(null);
    const detailRef = useRef(null);
    const hasSentMail = useRef(false); // ✅ cờ gửi mail

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) return;
            try {
                const res = await getBookingById(bookingId);
                setBooking(res);
            } catch (err) {
                console.error("Lỗi khi tải booking:", err);
            }
        };

        fetchBooking();
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, [bookingId]);

    useEffect(() => {
        const generateQrCode = async () => {
            if (!booking || booking.qrDataUrl) return; // tránh tạo lại

            const verifyUrl = `${window.location.origin}/verify/${booking.id}`;
            try {
                const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                    width: 300,
                    margin: 2,
                });
                // ✅ cập nhật state booking có qrDataUrl
                setBooking((prev) => ({...prev, qrDataUrl}));
            } catch (err) {
                console.error("Lỗi tạo QR:", err);
            }
        };

        generateQrCode();
    }, [booking?.id]);

    useEffect(() => {
        const generatePdfAndSendMail = async () => {
            if (!booking?.qrDataUrl || hasSentMail.current) return; // chỉ gửi 1 lần

            try {
                // Chờ DOM render xong
                await new Promise((resolve) => requestAnimationFrame(resolve));

                // ----- Ticket PDF -----
                const ticketBlob = await html2pdf()
                    .set({
                        margin: 10,
                        filename: `Ve_Tour_${booking.id}.pdf`,
                        jsPDF: {unit: "mm", format: "a4"},
                        html2canvas: {scale: 2, useCORS: true},
                    })
                    .from(ticketRef.current)
                    .outputPdf("blob");

                // ----- Booking Detail PDF -----
                const detailBlob = await html2pdf()
                    .set({
                        margin: 10,
                        filename: `ChiTietBooking_${booking.id}.pdf`,
                        jsPDF: {unit: "mm", format: "a4"},
                        html2canvas: {scale: 2, useCORS: true},
                        pagebreak: {mode: ["css", "legacy"]}
                    })
                    .from(detailRef.current)
                    .outputPdf("blob");

                // ----- Gửi mail -----
                const formData = new FormData();
                formData.append("email", booking.user.email);
                formData.append("ticketPdf", ticketBlob, `Ve_Tour_${booking.id}.pdf`);
                formData.append("detailPdf", detailBlob, `ChiTietBooking_${booking.id}.pdf`);
                formData.append("bookingId", booking.id);
                formData.append("subject", "Xác nhận đặt tour TravelGo");
                formData.append(
                    "message",
                    `Chào ${booking.user.name},\n\nBạn đã đặt tour thành công. Vui lòng xem chi tiết vé và hành trình trong 2 file PDF đính kèm.`
                );

                await sendBookingEmail(formData);
                setMailStatus("success");
                hasSentMail.current = true; // ✅ đánh dấu đã gửi
            } catch (err) {
                console.error("Lỗi gửi mail:", err);
                setMailStatus("failed");
            }
        };

        generatePdfAndSendMail();
    }, [booking]);

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div
                    className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const tour = booking?.tourSchedule?.tour;
    const schedule = booking?.tourSchedule;

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-green-100 to-white text-gray-900 relative">
            {showConfetti && <Confetti recycle={false} numberOfPieces={300}/>}

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
                    <p className="text-gray-700 mb-6">Cảm ơn {booking.user.name || "bạn"} đã đặt tour</p>

                    <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg mx-auto">
                        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-1">{tour?.title}</h2>
                        <p className="text-center text-gray-600 mb-6">{tour?.description}</p>

                        <div className="border-t border-gray-200 pt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Ngày đi:</span>
                                    <span
                                        className="text-gray-800">{new Date(schedule?.startDate).toLocaleDateString("vi-VN")}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Ngày về:</span>
                                    <span
                                        className="text-gray-800">{new Date(schedule?.endDate).toLocaleDateString("vi-VN")}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Số người:</span>
                                    <span className="text-gray-800">{booking.numberOfPeople}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                                    <span className="font-medium text-gray-700">Tổng tiền:</span>
                                    <span className="font-semibold text-green-600 text-lg">
                    {booking.totalPrice?.toLocaleString("vi-VN", {style: "currency", currency: "VND"})}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        {mailStatus === "sending" &&
                            <p className="text-blue-600 font-medium">Vé đang được gửi qua email, vui lòng chờ...</p>}
                        {mailStatus === "success" &&
                            <p className="text-green-600 font-medium">Email vé đã được gửi thành công!</p>}
                        {mailStatus === "failed" &&
                            <p className="text-red-600 font-medium">Gửi email thất bại, vui lòng thử lại sau.</p>}
                    </div>

                    <div className="mt-6 flex justify-center gap-4">
                        <Link to="/tours">
                            <button
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold">Xem
                                tour khác
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hidden PDF templates (offscreen, không display:none) */}
            <div style={{position: "absolute", left: "-9999px", top: "-9999px"}}>
                <TicketPdf
                    ref={ticketRef}
                    booking={booking}
                    tour={tour}
                    schedule={booking.tourSchedule}
                    qrDataUrl={booking.qrDataUrl}
                />
                <BookingDetailPdf
                    ref={detailRef}
                    booking={booking}
                />
            </div>
        </div>
    );
};

export default PaymentSuccess;
