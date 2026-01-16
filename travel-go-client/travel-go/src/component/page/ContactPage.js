import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";
import ChatBox from "../components/ChatBox";
import {
    MessageCircle,
    MapPin,
    Phone,
    Mail,
    Clock,
    UserCheck,
    Shield,
    Zap,
    Send,
    Users,
    LogIn,
    ArrowRight,
    X,
    AlertCircle,
    CheckCircle,
    Sparkles,
    Globe,
    Heart,
    ShieldCheck,
    Rocket,
    Star
} from 'lucide-react';
import * as tourService from "../../service/tour_service";
import {contactService} from "../../service/contactService";

// Validation Schema
const contactSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, "Tên quá ngắn (tối thiểu 2 ký tự)")
        .max(50, "Tên quá dài (tối đa 50 ký tự)")
        .required("Vui lòng nhập họ tên"),
    email: Yup.string()
        .email("Email không hợp lệ")
        .required("Vui lòng nhập email"),
    phone: Yup.string()
        .matches(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/,
            "Số điện thoại không hợp lệ")
        .required("Vui lòng nhập số điện thoại"),
    message: Yup.string()
        .min(10, "Nội dung quá ngắn (tối thiểu 10 ký tự)")
        .max(1000, "Nội dung quá dài (tối đa 1000 ký tự)")
        .required("Vui lòng nhập nội dung liên hệ"),
    tourInterest: Yup.string(),
    preferredContact: Yup.string()
        .oneOf(['email', 'phone', 'zalo'], 'Phương thức liên hệ không hợp lệ')
});

// Modal Components (giữ nguyên)
const LoginModal = ({ isOpen, onClose, onConfirm }) => {
    // ... giữ nguyên code modal
};

const SuccessModal = ({ isOpen, onClose, onLogin }) => {
    // ... giữ nguyên code modal
};

const ContactPage = () => {
    const [submitStatus, setSubmitStatus] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [activeTours, setActiveTours] = useState([]);
    const [isLoadingTours, setIsLoadingTours] = useState(false);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Load danh sách tour active
    useEffect(() => {
        let isMounted = true;

        const loadActiveTours = async () => {
            setIsLoadingTours(true);
            try {
                const tours = await tourService.getActiveTours();
                if (isMounted && tours && Array.isArray(tours)) {
                    setActiveTours(tours);
                }
            } catch (error) {
                console.error("Error loading tours:", error);
                if (isMounted) {
                    setActiveTours([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingTours(false);
                }
            }
        };

        loadActiveTours();

        return () => {
            isMounted = false;
        };
    }, []);

    // Xử lý mở chat
    const handleQuickChat = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        setShowChat(true);
        setIsChatMinimized(false);
    };

    const handleCloseChat = () => {
        setShowChat(false);
    };

    const handleToggleChatMinimize = () => {
        setIsChatMinimized(!isChatMinimized);
    };

    // Xử lý đăng nhập từ modal
    const handleLoginConfirm = () => {
        setShowLoginModal(false);
        navigate("/login", {
            state: {
                from: "/contact",
                message: "Đăng nhập để chat với hỗ trợ viên"
            }
        });
    };

    // Xử lý submit form
    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setIsFormLoading(true);
            setSubmitStatus({ type: 'loading', message: 'Đang gửi liên hệ...' });

            // Chỉ gửi các trường cơ bản cần thiết
            const submitData = {
                name: values.name,
                email: values.email,
                phone: values.phone,
                message: values.message,
                tourInterest: values.tourInterest || null,
                preferredContact: values.preferredContact,
            };

            // Gọi service để gửi liên hệ
            const response = await contactService.createContact(submitData);

            if (response.success || response.data || response.id) {
                setSubmitStatus({
                    type: 'success',
                    message: '✅ Gửi liên hệ thành công!'
                });
                resetForm();

                // Hiển thị modal thành công sau 500ms
                setTimeout(() => {
                    setShowSuccessModal(true);
                }, 500);

            } else {
                throw new Error(response.message || 'Gửi thất bại');
            }
        } catch (error) {
            console.error('❌ Submit error:', error);

            let errorMessage = '❌ Có lỗi xảy ra khi gửi liên hệ. Vui lòng thử lại hoặc gọi hotline 1900 1234.';

            if (error.status === 401) {
                errorMessage = '❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.status === 400) {
                errorMessage = error.message || '❌ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
            } else if (error.status === 500) {
                errorMessage = '❌ Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
            }

            setSubmitStatus({
                type: 'error',
                message: errorMessage
            });
        } finally {
            setIsFormLoading(false);
            setSubmitting(false);
        }
    };

    // Khởi tạo giá trị mặc định
    const getInitialValues = () => {
        return {
            name: "",
            email: "",
            phone: "",
            message: "",
            tourInterest: "",
            preferredContact: "email"
        };
    };

    // Contact information (giữ nguyên)
    const contactInfo = [
        // ... giữ nguyên
    ];

    // Features stats (giữ nguyên)
    const features = [
        // ... giữ nguyên
    ];

    if (authLoading || isLoadingTours) {
        return (
            <>
                <HeaderComponent />
                <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-500
                                border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium">Đang tải trang liên hệ...</p>
                        <p className="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }

    return (
        <>
            <HeaderComponent />

            {/* Modals */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onConfirm={handleLoginConfirm}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onLogin={() => {
                    setShowSuccessModal(false);
                    navigate("/login", {
                        state: {
                            from: "/contact",
                            message: "Đăng nhập để chat với hỗ trợ viên"
                        }
                    });
                }}
            />

            {/* Floating Chat Button */}
            {!showChat && (
                <button
                    onClick={handleQuickChat}
                    className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl 
                        hover:shadow-3xl z-40 flex items-center justify-center
                        transition-all duration-300 hover:scale-110 active:scale-95 group
                        ${isAuthenticated
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-500/30'
                        : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-gray-500/30'
                    }`}
                    aria-label={isAuthenticated ? "Mở chat hỗ trợ" : "Đăng nhập để chat"}
                >
                    <div className="relative">
                        <MessageCircle size={28} />
                        {!isAuthenticated && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full
                                flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">!</span>
                            </div>
                        )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute -top-16 right-0 bg-gray-900 text-white text-sm px-3 py-2
                        rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200
                        whitespace-nowrap shadow-lg pointer-events-none transform group-hover:-translate-y-2">
                        {isAuthenticated ? '💬 Chat với hỗ trợ viên' : '🔐 Đăng nhập để chat'}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2
                            w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                </button>
            )}

            {/* Chat Box */}
            {showChat && isAuthenticated && (
                <ChatBox
                    onClose={handleCloseChat}
                    isMinimized={isChatMinimized}
                    onToggleMinimize={handleToggleChatMinimize}
                    position="bottom-right"
                />
            )}

            {/* Main Content */}
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600">
                    {/* Animated background elements */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-4 py-20 relative">
                        <div className="max-w-4xl mx-auto text-center">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <span className="text-sm text-white font-medium">Hỗ trợ khách hàng 24/7</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-in fade-in duration-700">
                                Liên hệ với <span className="text-yellow-300">TravelGo</span>
                            </h1>

                            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn mọi lúc, mọi nơi.
                                Chọn phương thức liên hệ phù hợp nhất với bạn!
                            </p>

                            {/* Authentication Status */}
                            <div className={`max-w-2xl mx-auto mb-12 rounded-2xl p-5 backdrop-blur-sm
                                ${isAuthenticated
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30'
                                : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                            }`}>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                                                    <UserCheck className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-green-100 font-medium">Xin chào, <span className="text-white font-bold">{user.fullName || user.name || user.email}</span></p>
                                                    <p className="text-green-200 text-sm">Bạn có thể sử dụng chat hỗ trợ ngay!</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleQuickChat}
                                                className="px-5 py-2.5 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-lg"
                                            >
                                                Mở chat ngay
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                                                    <LogIn className="w-5 h-5 text-yellow-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-yellow-100 font-medium">Chưa đăng nhập?</p>
                                                    <p className="text-yellow-200 text-sm">Đăng nhập để sử dụng chat hỗ trợ trực tiếp</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate("/login", {
                                                    state: {
                                                        from: "/contact",
                                                        message: "Đăng nhập để chat với hỗ trợ viên"
                                                    }
                                                })}
                                                className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
                                            >
                                                Đăng nhập ngay
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className={`${feature.bgColor} backdrop-blur-sm rounded-2xl p-4 border border-white/20`}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                                                <feature.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-2xl font-bold text-white">{feature.value}</div>
                                                <div className="text-xs text-green-100">{feature.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Decorative wave */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg className="w-full h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path
                                d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                                opacity=".25"
                                className="fill-current text-white"
                            ></path>
                            <path
                                d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35,6.36,119.13-4.36C750.77,35.55,777,19.78,800,14.09V0Z"
                                opacity=".5"
                                className="fill-current text-white"
                            ></path>
                            <path
                                d="M0,0V5.63C149.93,59,314.09,71.78,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
                                className="fill-current text-white"
                            ></path>
                        </svg>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 -mt-10">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Form Section */}
                        <div className="space-y-8">
                            {/* Form Card */}
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8
                                transform transition-all duration-300 hover:shadow-3xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600
                                        rounded-2xl flex items-center justify-center shadow-lg">
                                        <Send size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">Gửi yêu cầu hỗ trợ</h2>
                                        <p className="text-gray-600 mt-1">
                                            Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại trong 2-4 giờ làm việc
                                        </p>
                                    </div>
                                </div>

                                <Formik
                                    initialValues={getInitialValues()}
                                    validationSchema={contactSchema}
                                    onSubmit={handleSubmit}
                                    enableReinitialize={true}
                                >
                                    {({ isSubmitting, errors, touched, values }) => (
                                        <Form className="space-y-6">
                                            {/* Name Field */}
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="block text-sm font-semibold
                                                    text-gray-700">
                                                    Họ và tên *
                                                </label>
                                                <div className="relative">
                                                    <Field
                                                        type="text"
                                                        id="name"
                                                        name="name"
                                                        className={`w-full px-4 py-3.5 border-2 rounded-xl 
                                                            focus:ring-0 focus:outline-none focus:border-blue-500
                                                            transition-all duration-200 ${
                                                            errors.name && touched.name
                                                                ? 'border-red-400 bg-red-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                        placeholder="Nguyễn Văn A"
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <UserCheck className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                </div>
                                                <ErrorMessage name="name" component="div"
                                                              className="text-sm text-red-600" />
                                            </div>

                                            {/* Email & Phone Fields */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="block text-sm font-semibold
                                                        text-gray-700">
                                                        Email *
                                                    </label>
                                                    <div className="relative">
                                                        <Field
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            className={`w-full px-4 py-3.5 border-2 rounded-xl 
                                                                focus:ring-0 focus:outline-none focus:border-blue-500
                                                                transition-all duration-200 ${
                                                                errors.email && touched.email
                                                                    ? 'border-red-400 bg-red-50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                            placeholder="your@email.com"
                                                        />
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <Mail className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                    </div>
                                                    <ErrorMessage name="email" component="div"
                                                                  className="text-sm text-red-600" />
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="phone" className="block text-sm font-semibold
                                                        text-gray-700">
                                                        Số điện thoại *
                                                    </label>
                                                    <div className="relative">
                                                        <Field
                                                            type="tel"
                                                            id="phone"
                                                            name="phone"
                                                            className={`w-full px-4 py-3.5 border-2 rounded-xl 
                                                                focus:ring-0 focus:outline-none focus:border-blue-500
                                                                transition-all duration-200 ${
                                                                errors.phone && touched.phone
                                                                    ? 'border-red-400 bg-red-50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                            placeholder="0987 654 321"
                                                        />
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <Phone className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                    </div>
                                                    <ErrorMessage name="phone" component="div"
                                                                  className="text-sm text-red-600" />
                                                </div>
                                            </div>

                                            {/* Tour Interest */}
                                            <div className="space-y-2">
                                                <label htmlFor="tourInterest" className="block text-sm font-semibold
                                                    text-gray-700">
                                                    Tour quan tâm
                                                </label>
                                                <Field
                                                    as="select"
                                                    id="tourInterest"
                                                    name="tourInterest"
                                                    className="w-full px-4 py-3.5 border-2 border-gray-200
                                                        rounded-xl focus:ring-0 focus:outline-none focus:border-blue-500
                                                        transition-all duration-200 bg-white hover:bg-gray-50"
                                                    disabled={isLoadingTours}
                                                >
                                                    <option value="">Chọn tour bạn quan tâm (không bắt buộc)</option>
                                                    {isLoadingTours ? (
                                                        <option value="" disabled>Đang tải danh sách tour...</option>
                                                    ) : (
                                                        <>
                                                            {activeTours.length > 0 ? (
                                                                activeTours.map(tour => (
                                                                    <option key={tour._id || tour.id} value={tour._id || tour.id}>
                                                                        {tour.name} - {tour.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tour.price) : 'Liên hệ'}
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                <option value="" disabled>Tạm thời chưa có tour nào</option>
                                                            )}
                                                            <option value="other">Tour khác (ghi rõ trong nội dung)</option>
                                                            <option value="consultation">Cần tư vấn thiết kế tour riêng</option>
                                                        </>
                                                    )}
                                                </Field>
                                                {isLoadingTours && (
                                                    <p className="text-sm text-gray-500 mt-1">Đang tải danh sách tour...</p>
                                                )}
                                            </div>

                                            {/* Preferred Contact Method */}
                                            <div className="space-y-3">
                                                <label className="block text-sm font-semibold text-gray-700">
                                                    Ưu tiên liên hệ lại bằng
                                                </label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { value: 'email', label: 'Email', icon: '📧', color: 'border-blue-500' },
                                                        { value: 'phone', label: 'Điện thoại', icon: '📱', color: 'border-green-500' },
                                                        { value: 'zalo', label: 'Zalo', icon: '💬', color: 'border-purple-500' }
                                                    ].map(method => (
                                                        <label
                                                            key={method.value}
                                                            className={`flex flex-col items-center justify-center 
                                                                p-4 border-2 rounded-xl cursor-pointer transition-all 
                                                                duration-200 ${
                                                                values.preferredContact === method.value
                                                                    ? `${method.color} bg-gradient-to-br from-white to-gray-50 shadow-md`
                                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <Field
                                                                type="radio"
                                                                name="preferredContact"
                                                                value={method.value}
                                                                className="sr-only"
                                                            />
                                                            <span className="text-2xl mb-2">{method.icon}</span>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {method.label}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Message Content */}
                                            <div className="space-y-2">
                                                <label htmlFor="message" className="block text-sm font-semibold
                                                    text-gray-700">
                                                    Nội dung chi tiết *
                                                </label>
                                                <Field
                                                    as="textarea"
                                                    id="message"
                                                    name="message"
                                                    rows="5"
                                                    className={`w-full px-4 py-3.5 border-2 rounded-xl 
                                                        focus:ring-0 focus:outline-none focus:border-blue-500
                                                        transition-all duration-200 resize-none ${
                                                        errors.message && touched.message
                                                            ? 'border-red-400 bg-red-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                    placeholder="Mô tả chi tiết yêu cầu của bạn: số người, ngày đi, ngân sách, yêu cầu đặc biệt..."
                                                />
                                                <div className="flex justify-between items-center">
                                                    <ErrorMessage name="message" component="div"
                                                                  className="text-sm text-red-600" />
                                                    <div className={`text-xs ${
                                                        values.message.length > 950 ? 'text-red-500' : 'text-gray-500'
                                                    }`}>
                                                        {values.message.length}/1000 ký tự
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Submit Status Message */}
                                            {submitStatus && (
                                                <div className={`mt-4 p-4 rounded-xl border-2 ${
                                                    submitStatus.type === 'success'
                                                        ? 'bg-green-50 border-green-200 text-green-800'
                                                        : submitStatus.type === 'error'
                                                            ? 'bg-red-50 border-red-200 text-red-800'
                                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        {submitStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                        {submitStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                                                        {submitStatus.type === 'loading' && (
                                                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        )}
                                                        <span className="font-medium">{submitStatus.message}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || isFormLoading}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600
                                                    text-white py-4 px-6 rounded-xl font-semibold
                                                    hover:from-blue-700 hover:to-indigo-700
                                                    disabled:from-gray-400 disabled:to-gray-500
                                                    disabled:cursor-not-allowed transition-all duration-300
                                                    shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                                                    active:translate-y-0 flex items-center justify-center gap-3"
                                            >
                                                {isSubmitting || isFormLoading ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent
                                                            rounded-full animate-spin"></div>
                                                        Đang gửi...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={20} />
                                                        Gửi yêu cầu ngay
                                                    </>
                                                )}
                                            </button>
                                        </Form>
                                    )}
                                </Formik>
                            </div>

                            {/* Contact Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {contactInfo.map((info, index) => (
                                    <div
                                        key={index}
                                        className={`${info.bgColor} rounded-2xl shadow-lg p-6
                                            hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md`}>
                                                <info.icon className={`w-7 h-7 ${info.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                                    {info.title}
                                                </h3>
                                                <p className="text-gray-700 font-medium">
                                                    {info.description}
                                                </p>
                                                {info.subDescription && (
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        {info.subDescription}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Chat Support Section */}
                        <div className="space-y-8">
                            {/* Chat Support Card */}
                            <div className={`rounded-3xl shadow-2xl p-8 transition-all duration-300
                                ${isAuthenticated
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100'
                                : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
                            }`}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg
                                        ${isAuthenticated
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                                    }`}>
                                        <MessageCircle size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">Chat hỗ trợ trực tuyến</h2>
                                        <p className="text-gray-600 mt-1">
                                            {isAuthenticated
                                                ? 'Hỗ trợ ngay lập tức, không phải chờ đợi'
                                                : 'Đăng nhập để sử dụng tính năng chat hỗ trợ'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Support Features */}
                                    <div className={`rounded-xl p-4 border backdrop-blur-sm transition-all duration-300
                                        ${isAuthenticated
                                        ? 'bg-white/80 border-green-200 hover:bg-white'
                                        : 'bg-white/60 border-gray-200 hover:bg-white/80'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                                                ${isAuthenticated
                                                ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                                                : 'bg-gray-100'
                                            }`}>
                                                <Zap className={`w-6 h-6 ${isAuthenticated ? 'text-green-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold text-lg ${isAuthenticated ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    Hỗ trợ tức thì
                                                </h4>
                                                <p className={`mt-1 ${isAuthenticated ? 'text-gray-600' : 'text-gray-500'}`}>
                                                    {isAuthenticated
                                                        ? 'Chat trực tiếp với nhân viên hỗ trợ. Phản hồi trong vòng 5 phút.'
                                                        : 'Đăng nhập để chat trực tiếp với hỗ trợ viên ngay lập tức.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-4 border backdrop-blur-sm transition-all duration-300
                                        ${isAuthenticated
                                        ? 'bg-white/80 border-green-200 hover:bg-white'
                                        : 'bg-white/60 border-gray-200 hover:bg-white/80'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                                                ${isAuthenticated
                                                ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                                                : 'bg-gray-100'
                                            }`}>
                                                <Shield className={`w-6 h-6 ${isAuthenticated ? 'text-green-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold text-lg ${isAuthenticated ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {isAuthenticated ? 'Lịch sử chat được lưu' : 'Bảo mật thông tin'}
                                                </h4>
                                                <p className={`mt-1 ${isAuthenticated ? 'text-gray-600' : 'text-gray-500'}`}>
                                                    {isAuthenticated
                                                        ? 'Toàn bộ lịch sử chat được lưu trữ để tra cứu khi cần.'
                                                        : 'Đăng nhập để lưu lịch sử chat và được ưu tiên hỗ trợ.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-4 border backdrop-blur-sm transition-all duration-300
                                        ${isAuthenticated
                                        ? 'bg-white/80 border-green-200 hover:bg-white'
                                        : 'bg-white/60 border-gray-200 hover:bg-white/80'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                                                ${isAuthenticated
                                                ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                                                : 'bg-gray-100'
                                            }`}>
                                                <Clock className={`w-6 h-6 ${isAuthenticated ? 'text-green-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold text-lg ${isAuthenticated ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    Hỗ trợ 24/7
                                                </h4>
                                                <p className={`mt-1 ${isAuthenticated ? 'text-gray-600' : 'text-gray-500'}`}>
                                                    {isAuthenticated
                                                        ? 'Đội ngũ hỗ trợ luôn sẵn sàng mọi lúc, mọi nơi. Không ngày nghỉ.'
                                                        : 'Hệ thống hoạt động 24/7. Đăng nhập để chat bất kỳ lúc nào.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Action Button */}
                                <button
                                    onClick={handleQuickChat}
                                    className={`w-full mt-8 text-white py-4 px-6 rounded-xl font-semibold
                                        transition-all duration-300 shadow-lg hover:shadow-xl
                                        transform hover:-translate-y-0.5 active:translate-y-0
                                        flex items-center justify-center gap-3 group
                                        ${isAuthenticated
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                        : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                                    }`}
                                >
                                    {isAuthenticated ? (
                                        <>
                                            <MessageCircle size={20} />
                                            {showChat
                                                ? (isChatMinimized ? 'Mở chat hỗ trợ' : 'Chat đang mở')
                                                : 'Bắt đầu chat ngay'
                                            }
                                            {!showChat && (
                                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            Đăng nhập để chat
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                {/* Chat Status */}
                                {showChat && isAuthenticated && !isChatMinimized && (
                                    <div className="mt-6 text-center">
                                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100
                                            text-green-800 text-sm px-4 py-2.5 rounded-full border border-green-200 shadow-sm">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            Đã kết nối với phòng chat của bạn
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Info */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-xl p-8 border border-blue-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Star className="w-6 h-6 text-blue-600" />
                                    Tại sao nên chọn TravelGo?
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold">✓</span>
                                        </div>
                                        <p className="text-gray-700">Đội ngũ hỗ trợ chuyên nghiệp, nhiều năm kinh nghiệm</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold">✓</span>
                                        </div>
                                        <p className="text-gray-700">Phản hồi nhanh chóng, giải đáp mọi thắc mắc 24/7</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold">✓</span>
                                        </div>
                                        <p className="text-gray-700">Bảo mật thông tin khách hàng tuyệt đối</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold">✓</span>
                                        </div>
                                        <p className="text-gray-700">Hỗ trợ đa kênh: Hotline, Email, Chat trực tuyến</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterComponent />
        </>
    );
};

export default ContactPage;