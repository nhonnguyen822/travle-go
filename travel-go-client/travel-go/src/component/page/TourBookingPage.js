import {useEffect, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";
import {ErrorMessage, Field, Form, Formik} from "formik";
import * as Yup from "yup";
import {createBooking} from "../../service/booking_service";
import {createPayment} from "../../service/payment_service";
import {useAuth} from "../../context/AuthContext";
import {findTourById} from "../../service/tour_service";
import toast from "react-hot-toast";
import {Swiper, SwiperSlide} from "swiper/react";
import {Autoplay, Pagination} from "swiper/modules";
import { CreditCard, Banknote, CheckCircle, Crown, Star } from "lucide-react";
import {getUserByEmail} from "../../service/authService"

const TourBookingPage = () => {
    const {tourId, scheduleId} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {user, loading: authLoading} = useAuth();
    const [tour, setTour] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    
    const discountRates = {
        'NEW': 0,
        'REGULAR': 0.1,      // 10%
        'SILVER': 0.15,      // 15%
        'GOLD': 0.2,         // 20%
        'VIP': 0.25,         // 25%
        'PLATINUM': 0.3,     // 30%
        'DIAMOND': 0.35      // 35%
    };

    const customerTypeConfig = {
        'NEW': { icon: Star, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-600' },
        'REGULAR': { icon: Star, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-600' },
        'SILVER': { icon: Star, color: 'slate', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', textColor: 'text-slate-600' },
        'GOLD': { icon: Crown, color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-600' },
        'VIP': { icon: Crown, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-600' },
        'PLATINUM': { icon: Crown, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-600' },
        'DIAMOND': { icon: Crown, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-600' }
    };

    useEffect(() => {
        const loadTour = async () => {
            try {
                setLoading(true);
                const data = await findTourById(tourId);
                setTour(data);

                const selected = data.schedules?.find(s => s.id === Number(scheduleId));
                setSelectedSchedule(selected || data.schedules?.[0]);
            } catch (error) {
                toast.error("Không thể tải thông tin tour. Vui lòng thử lại!");
            } finally {
                setLoading(false);
            }
        };
        if (tourId && scheduleId) loadTour();
    }, [tourId, scheduleId]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                if (user?.email) {
                    const data = await getUserByEmail(user.email);
                    console.log("User details:", data);
                    setUserDetails(data);
                }
            } catch (err) {
                console.error("Không thể lấy thông tin chi tiết user:", err);
            }
        };
        fetchUserDetails();
    }, [user]);

    const getDiscountRate = () => {
        if (!userDetails?.customerType) return 0;
        return discountRates[userDetails.customerType] || 0;
    };

    const calculateDiscountAmount = (totalAmount) => {
        const discountRate = getDiscountRate();
        return Math.round(totalAmount * discountRate);
    };

    const getCustomerTypeConfig = () => {
        if (!userDetails?.customerType) return null;
        return customerTypeConfig[userDetails.customerType] || customerTypeConfig['NEW'];
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin tour...</p>
                </div>
            </div>
        );
    }

    if (!tour || !selectedSchedule) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg">Không tìm thấy thông tin tour.</p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                        Quay về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const validationSchema = Yup.object({
        adult: Yup.number()
            .typeError("Số lượng người lớn phải là số")
            .min(1, "Phải có ít nhất 1 người lớn")
            .required("Vui lòng nhập số lượng người lớn"),
        child: Yup.number()
            .typeError("Số lượng trẻ em phải là số")
            .min(0, "Số lượng trẻ em không thể âm")
            .required("Vui lòng nhập số lượng trẻ em"),
        baby: Yup.number()
            .typeError("Số lượng em bé phải là số")
            .min(0, "Số lượng em bé không thể âm")
            .required("Vui lòng nhập số lượng em bé"),
        paymentMethod: Yup.string()
            .required("Vui lòng chọn phương thức thanh toán"),
        paymentType: Yup.string()
            .oneOf(['FULL', 'DEPOSIT'], "Vui lòng chọn loại thanh toán")
            .required("Vui lòng chọn loại thanh toán"),
    }).test("total-slots", "Tổng số vé vượt quá số lượng còn lại của tour", function (values) {
        const { adult, child, baby } = values;
        const total = (adult || 0) + (child || 0) + (baby || 0);
        const remaining = selectedSchedule.availableSlots;

        if (total > remaining) {
            return this.createError({
                path: "adult",
                message: `Tổng số vé (${total}) vượt quá số lượng còn lại (${remaining}) của tour`,
            });
        }
        return true;
    });

    const calculateTotalAmount = (values) => {
        return values.adult * selectedSchedule.price +
            values.child * selectedSchedule.childPrice +
            values.baby * selectedSchedule.babyPrice;
    };

    const calculateDiscountedAmount = (values) => {
        const totalAmount = calculateTotalAmount(values);
        const discountAmount = calculateDiscountAmount(totalAmount);
        return totalAmount - discountAmount;
    };

    const calculateDepositAmount = (values) => {
        const total = calculateDiscountedAmount(values);
        return Math.round(total * 0.3);
    };

    // 🧾 Xử lý đặt tour
    const handleBooking = async (values) => {
        try {
            if (!user) {
                navigate("/login");
                toast.error("Vui lòng đăng nhập để đặt tour!");
                return;
            }

            setSubmitting(true);
            const totalAmount = calculateDiscountedAmount(values);
            const discountAmount = calculateDiscountAmount(calculateTotalAmount(values));

            // ✅ Tạo booking với discount
            const bookingPayload = {
                bookingDate: new Date().toISOString().slice(0, 19),
                numberOfPeople: values.adult + values.child + values.baby,
                adultCount: values.adult,
                childCount: values.child,
                babyCount: values.baby,
                paymentMethod: values.paymentMethod,
                paymentStatus: "UNPAID",
                status: "PENDING",
                totalPrice: totalAmount,
                discountAmount: discountAmount,
                discountRate: getDiscountRate() * 100, // Lưu dưới dạng phần trăm
                customerType: userDetails?.customerType,
                tourScheduleId: selectedSchedule.id,
                userId: user.id,
            };

            const bookingRes = await createBooking(bookingPayload);
            if (!bookingRes?.id) throw new Error("Không thể tạo booking!");

            const paymentAmount = values.paymentType === 'FULL'
                ? totalAmount
                : calculateDepositAmount(values);

            if (values.paymentMethod === "VN_PAY") {
                await handleVNPayPayment(bookingRes.id, paymentAmount);
            } else {
                let message = "";
                if (values.paymentMethod === "bank") {
                    message = `✅ Đặt tour thành công! Vui lòng chuyển khoản ${paymentAmount.toLocaleString()} VNĐ.`;
                } else {
                    message = `✅ Đặt tour thành công! ${values.paymentType === 'FULL'
                        ? 'Vui lòng thanh toán toàn bộ'
                        : 'Vui lòng đặt cọc 30%'} khi đến văn phòng.`;
                }

                toast.success(message);
                navigate("/my-bookings");
            }
        } catch (err) {
            toast.error(err.message || "Đặt tour thất bại. Vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    // 💳 Xử lý thanh toán VNPay
    const handleVNPayPayment = async (bookingId, amount) => {
        try {
            const paymentPayload = {
                bookingId,
                totalAmount: amount,
                orderInfo: `Booking|${bookingId}`,
            };

            const paymentRes = await createPayment(paymentPayload);
            if (paymentRes?.paymentUrl) {
                window.location.href = paymentRes.paymentUrl;
            } else {
                throw new Error("Không nhận được URL thanh toán từ server!");
            }
        } catch (err) {
            console.error("Payment Error:", err);
            toast.error("Thanh toán thất bại. Vui lòng thử lại!");
        }
    };

    const customerConfig = getCustomerTypeConfig();
    const discountRate = getDiscountRate();

    return (
        <div className="min-h-screen bg-gray-50">
            <HeaderComponent/>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <section className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/2">
                            <div className="h-80 lg:h-96 rounded-xl overflow-hidden">
                                <Swiper
                                    modules={[Pagination, Autoplay]}
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                                    loop={true}
                                    className="w-full h-full"
                                >
                                    {tour.images?.map((img, idx) => (
                                        <SwiperSlide key={idx}>
                                            <img
                                                src={img.imageUrl}
                                                alt={`${tour.name} - Slide ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>

                        <div className="lg:w-1/2 space-y-4">
                            <h1 className="text-3xl font-bold text-gray-900">{tour.name}</h1>
                            <p className="text-gray-600 leading-relaxed text-left">{tour.description}</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">📅 Ngày khởi hành:</span>
                                    <span className="text-green-600 font-medium">{selectedSchedule.startDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">⏱️ Thời lượng:</span>
                                    <span>{tour.durationDays} ngày {tour.durationNights > 0 && `${tour.durationNights} đêm`}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Formik
                    initialValues={{
                        adult: 1,
                        child: 0,
                        baby: 0,
                        paymentMethod: "VN_PAY",
                        paymentType: "DEPOSIT",
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleBooking}
                >
                    {({ values, setFieldValue }) => {
                        const totalAmount = calculateTotalAmount(values);
                        const discountAmount = calculateDiscountAmount(totalAmount);
                        const discountedAmount = calculateDiscountedAmount(values);
                        const depositAmount = calculateDepositAmount(values);
                        const paymentAmount = values.paymentType === 'FULL' ? discountedAmount : depositAmount;
                        const totalPeople = values.adult + values.child + values.baby;

                        return (
                            <Form className="space-y-6">
                                <section className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🎫 Chọn số lượng vé</h2>

                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full">
                                            <thead className="bg-green-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Loại khách</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Giá vé</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Số lượng</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Thành tiền</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                            {[
                                                { type: "adult", label: "Người lớn", price: selectedSchedule.price },
                                                { type: "child", label: "Trẻ em", price: selectedSchedule.childPrice },
                                                { type: "baby", label: "Em bé", price: selectedSchedule.babyPrice },
                                            ].map(({ type, label, price }) => (
                                                <tr key={type} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
                                                    <td className="px-6 py-4">
                                                        {Number(price).toLocaleString("vi-VN")} VNĐ
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Field
                                                            type="number"
                                                            name={type}
                                                            min={type === "adult" ? 1 : 0}
                                                            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                        <ErrorMessage
                                                            name={type}
                                                            component="div"
                                                            className="text-red-500 text-sm mt-1"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-green-600">
                                                        {Number(values[type] * price).toLocaleString("vi-VN")} VNĐ
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        {discountAmount > 0 && (
                                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <Crown className="w-5 h-5 text-yellow-600" />
                                                        <div>
                                                            <span className="text-yellow-800 font-semibold">
                                                                Ưu đãi {userDetails?.customerType}
                                                            </span>
                                                            <p className="text-sm text-yellow-600">
                                                                Giảm {discountRate * 100}% cho khách hàng {userDetails?.customerType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-yellow-800 font-bold text-lg">
                                                        -{Number(discountAmount).toLocaleString("vi-VN")} VNĐ
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </section>

                                <section className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Loại thanh toán</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                                                values.paymentType === 'DEPOSIT'
                                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-25'
                                            }`}
                                            onClick={() => setFieldValue('paymentType', 'DEPOSIT')}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                                                    values.paymentType === 'DEPOSIT'
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-gray-400'
                                                }`}>
                                                    {values.paymentType === 'DEPOSIT' && (
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900">Đặt cọc 30%</h3>
                                                    <p className="text-2xl font-bold text-blue-600 my-2">
                                                        {Number(depositAmount).toLocaleString("vi-VN")} VNĐ
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Thanh toán 30% để giữ chỗ, số tiền còn lại thanh toán trước ngày khởi hành
                                                    </p>
                                                    <div className="mt-2 text-xs text-blue-600">
                                                        Còn lại: {Number(discountedAmount - depositAmount).toLocaleString("vi-VN")} VNĐ
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                                                values.paymentType === 'FULL'
                                                    ? 'border-green-500 bg-green-50 shadow-md'
                                                    : 'border-gray-300 hover:border-green-300 hover:bg-green-25'
                                            }`}
                                            onClick={() => setFieldValue('paymentType', 'FULL')}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                                                    values.paymentType === 'FULL'
                                                        ? 'border-green-500 bg-green-500'
                                                        : 'border-gray-400'
                                                }`}>
                                                    {values.paymentType === 'FULL' && (
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900">Thanh toán toàn bộ</h3>
                                                    <p className="text-2xl font-bold text-green-600 my-2">
                                                        {Number(discountedAmount).toLocaleString("vi-VN")} VNĐ
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Thanh toán 100% ngay bây giờ
                                                    </p>
                                                    <div className="mt-2 text-xs text-green-600">
                                                        {discountAmount > 0 ? `Đã giảm ${discountRate * 100}%` : 'Nhận ưu đãi đặc biệt'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ErrorMessage
                                        name="paymentType"
                                        component="div"
                                        className="text-red-500 text-sm mt-2"
                                    />
                                </section>

                                {/* Phương thức thanh toán */}
                                <section className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">💳 Phương thức thanh toán</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { value: "VN_PAY", label: "VNPay", icon: CreditCard, description: "Thanh toán qua cổng VNPay" },
                                            { value: "bank", label: "Chuyển khoản", icon: Banknote, description: "Chuyển khoản ngân hàng" },
                                        ].map(({ value, label, icon: Icon, description }) => (
                                            <label
                                                key={value}
                                                className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                    values.paymentMethod === value
                                                        ? 'border-green-500 bg-green-50 shadow-md'
                                                        : 'border-gray-300 hover:border-green-300 hover:bg-green-25'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Field
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value={value}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        values.paymentMethod === value
                                                            ? 'border-green-500 bg-green-500'
                                                            : 'border-gray-400'
                                                    }`}>
                                                        {values.paymentMethod === value && (
                                                            <CheckCircle className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                    <Icon className="w-6 h-6 text-gray-700" />
                                                    <span className="font-semibold text-gray-900">{label}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 ml-8">{description}</p>
                                            </label>
                                        ))}
                                    </div>
                                    <ErrorMessage
                                        name="paymentMethod"
                                        component="div"
                                        className="text-red-500 text-sm mt-2"
                                    />
                                </section>

                                <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-green-200">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                Số tiền cần thanh toán:
                                            </h3>
                                            <p className="text-3xl font-bold text-green-600">
                                                {Number(paymentAmount).toLocaleString("vi-VN")} VNĐ
                                            </p>
                                            {discountAmount > 0 && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    🎉 Đã giảm {Number(discountAmount).toLocaleString("vi-VN")} VNĐ
                                                    ({discountRate * 100}% từ hạng {userDetails?.customerType})
                                                </p>
                                            )}
                                            {values.paymentType === 'DEPOSIT' && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    (Đặt cọc 30% - {Number(depositAmount).toLocaleString("vi-VN")} VNĐ)
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting || totalPeople === 0}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    {values.paymentMethod === 'VN_PAY' ? '💳 Thanh toán ngay' : '✅ Xác nhận đặt tour'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </section>
                            </Form>
                        );
                    }}
                </Formik>
            </div>

            <FooterComponent/>
        </div>
    );
};

export default TourBookingPage;