import {useNavigate, useParams} from "react-router-dom";
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaChild,
    FaClock,
    FaEdit,
    FaExclamationTriangle,
    FaMoneyBillWave,
    FaPlus,
    FaTag,
    FaTimes,
    FaTimesCircle,
    FaTrash
} from "react-icons/fa";
import {Swiper, SwiperSlide} from "swiper/react";
import {Autoplay, Pagination} from "swiper/modules";
import {useEffect, useMemo, useState} from "react";



import {Form, Formik} from "formik";
import * as Yup from "yup";

import {findTourById} from "../../../service/tour_service";
import AdminLayout from "../layout/AdminLayout";
import {createSchedule, deleteSchedule, updateSchedule} from "../../../service/schedule_service";
import TourMapSection from "../../layout/TourMapSection";

const scheduleValidationSchema = Yup.object().shape({
    startDate: Yup.date()
        .required("Ngày khởi hành là bắt buộc")
        .min(new Date(), "Không thể chọn ngày trong quá khứ"),
    endDate: Yup.date()
        .required("Ngày kết thúc là bắt buộc")
        .min(Yup.ref('startDate'), "Ngày kết thúc phải sau ngày bắt đầu"),
    price: Yup.number()
        .required("Giá người lớn là bắt buộc")
        .min(1000, "Giá người lớn phải từ 1,000 VNĐ trở lên")
        .max(100000000, "Giá người lớn không thể vượt quá 100,000,000 VNĐ")
        .typeError("Giá người lớn phải là số"),
    childPrice: Yup.number()
        .required("Giá trẻ em là bắt buộc")
        .min(0, "Giá trẻ em không thể âm")
        .max(Yup.ref('price'), "Giá trẻ em không thể cao hơn giá người lớn")
        .test(
            'child-price-percentage',
            'Giá trẻ em thường từ 50-80% giá người lớn',
            function(value) {
                const { price } = this.parent;
                if (!price || !value) return true;

                const percentage = (value / price) * 100;
                return percentage >= 0 && percentage <= 100;
            }
        )
        .typeError("Giá trẻ em phải là số"),
    babyPrice: Yup.number()
        .required("Giá em bé là bắt buộc")
        .min(0, "Giá em bé không thể âm")
        .max(Yup.ref('price'), "Giá em bé không thể cao hơn giá người lớn")
        .test(
            'baby-price-percentage',
            'Giá em bé thường từ 0-30% giá người lớn',
            function(value) {
                const { price } = this.parent;
                if (!price || !value) return true;

                const percentage = (value / price) * 100;
                return percentage >= 0 && percentage <= 100;
            }
        )
        .typeError("Giá em bé phải là số")
});

const PricePercentageDisplay = ({ adultPrice, childPrice, babyPrice }) => {
    if (!adultPrice || adultPrice <= 0) return null;

    const childPercentage = childPrice ? ((childPrice / adultPrice) * 100).toFixed(1) : 0;
    const babyPercentage = babyPrice ? ((babyPrice / adultPrice) * 100).toFixed(1) : 0;

    const getPercentageColor = (percentage) => {
        if (percentage > 80) return 'text-red-500';
        if (percentage > 60) return 'text-orange-500';
        if (percentage > 40) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getPercentageRecommendation = (type, percentage) => {
        if (type === 'child') {
            if (percentage > 80) return '⚠️ Cao - Nên dưới 80%';
            if (percentage < 50) return 'ℹ️ Thấp - Thông thường 50-80%';
            return '✅ Tốt';
        }
        if (type === 'baby') {
            if (percentage > 30) return '⚠️ Cao - Thông thường dưới 30%';
            if (percentage > 0) return '✅ Tốt';
            return 'ℹ️ Miễn phí';
        }
        return '';
    };
    const formatVietnameseDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };


    return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
                📊 Tỷ lệ phần trăm so với giá người lớn
            </h4>
            <div className="space-y-2 text-xs">
                {childPrice > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700">Trẻ em:</span>
                        <div className="text-right">
                            <span className={`font-medium ${getPercentageColor(childPercentage)}`}>
                                {childPercentage}%
                            </span>
                            <span className="text-blue-600 text-xs ml-2">
                                {getPercentageRecommendation('child', childPercentage)}
                            </span>
                        </div>
                    </div>
                )}
                {babyPrice > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700">Em bé:</span>
                        <div className="text-right">
                            <span className={`font-medium ${getPercentageColor(babyPercentage)}`}>
                                {babyPercentage}%
                            </span>
                            <span className="text-blue-600 text-xs ml-2">
                                {getPercentageRecommendation('baby', babyPercentage)}
                            </span>
                        </div>
                    </div>
                )}
                {(!childPrice || !babyPrice) && (
                    <p className="text-blue-600 text-xs">Nhập giá để xem tỷ lệ phần trăm</p>
                )}
            </div>
        </div>
    );
};


const Modal = ({ isOpen, onClose, children, title }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div
                className="fixed inset-0"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden transform transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaCalendarAlt className="text-green-600" />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <FaTimes className="text-gray-500 hover:text-gray-700" size={16} />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

const AdminTourDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "warning",
        onConfirm: null,
        scheduleToDelete: null,
    });

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const data = await findTourById(id);
                console.log(data)
                setTour(data);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu tour:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const { includedServices, excludedServices } = useMemo(() => {
        const includedServices = tour?.services?.filter(s => s.type === "INCLUDED") || [];
        const excludedServices = tour?.services?.filter(s => s.type === "EXCLUDED") || [];
        return { includedServices, excludedServices };
    }, [tour]);

    const { childrenPolicies, cancellationPolicies } = useMemo(() => {
        const childrenPolicies = tour?.policies?.filter(p => p.type === "CHILDREN") || [];
        const cancellationPolicies = tour?.policies?.filter(p => p.type === "CANCELLATION") || [];
        return { childrenPolicies, cancellationPolicies };
    }, [tour]);

    const formatCurrency = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handlePriceInput = (e, setFieldValue, fieldName) => {
        const rawValue = e.target.value.replace(/\./g, '');
        const numericValue = parseInt(rawValue) || 0;
        setFieldValue(fieldName, numericValue);
        const formattedValue = formatCurrency(numericValue);
        e.target.value = formattedValue;
    };

    const handlePriceFocus = (e, fieldName, values, setFieldValue) => {
        const rawValue = values[fieldName] || '';
        e.target.value = rawValue.toString();
    };

    const handlePriceBlur = (e, fieldName, values, setFieldValue, handleBlur) => {
        const rawValue = e.target.value.replace(/\./g, '');
        const numericValue = parseInt(rawValue) || 0;
        setFieldValue(fieldName, numericValue);
        const formattedValue = formatCurrency(numericValue);
        e.target.value = formattedValue;
        handleBlur(e);
    };

    const formatVietnameseDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };


    const showAlert = (title, message, type = "warning", onConfirm = null, scheduleToDelete = null) => {
        setAlertModal({
            isOpen: true,
            title,
            message,
            type,
            onConfirm,
            scheduleToDelete,
        });
    };

    const closeAlert = () => {
        setAlertModal({
            isOpen: false,
            title: "",
            message: "",
            type: "warning",
            onConfirm: null,
            scheduleToDelete: null,
        });
        setDeleteLoading(false);
    };

    const calculateEndDate = (startDate) => {
        if (!startDate || !tour?.durationDays) return '';
        const date = new Date(startDate);
        date.setDate(date.getDate() + parseInt(tour.durationDays));
        return date.toISOString().split('T')[0];
    };

    const handleCreateSchedule = async (values, { resetForm }) => {
        setIsSubmitting(true);
        try {
            const scheduleData = {
                startDate: values.startDate,
                endDate: values.endDate,
                price: Number(values.price),
                childPrice: Number(values.childPrice),
                babyPrice: Number(values.babyPrice)
            };
            await createSchedule(id, scheduleData);
            const updatedTour = await findTourById(id);
            setTour(updatedTour);
            setIsModalOpen(false);
            resetForm();
            showAlert("Thành công", "Đã tạo lịch trình mới thành công", "success");
        } catch (error) {
            let errorMessage = "Không thể tạo lịch trình. Vui lòng thử lại.";
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            }
            showAlert("Có lỗi xảy ra", errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSchedule = async (values) => {
        setIsSubmitting(true);
        try {
            const scheduleData = {
                startDate: values.startDate,
                endDate: values.endDate,
                price: Number(values.price),
                childPrice: Number(values.childPrice),
                babyPrice: Number(values.babyPrice),
            };
            await updateSchedule(editingSchedule.id, scheduleData);
            const updatedTour = await findTourById(id);
            setTour(updatedTour);
            setIsModalOpen(false);
            setEditingSchedule(null);
            showAlert("Thành công", "Đã cập nhật lịch trình thành công", "success");
        } catch (error) {
            let errorMessage = "Không thể cập nhật lịch trình. Vui lòng thử lại.";
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            }
            showAlert("Có lỗi xảy ra", errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelSchedule = async (schedule) => {
        showAlert(
            "Xác nhận hủy lịch trình",
            `Bạn có chắc muốn hủy lịch trình khởi hành ngày "${schedule.startDate}"? Lịch trình sẽ được đánh dấu là đã hủy và ẩn khỏi hệ thống.`,
            "warning",
            async () => {
                setDeleteLoading(true);
                try {
                    await deleteSchedule(schedule.id, {
                        ...schedule,
                        status: 'CANCELLED'
                    });
                    const updatedTour = await findTourById(id);
                    setTour(updatedTour);
                    showAlert("Thành công", "Đã hủy lịch trình thành công", "success");
                } catch (err) {
                    console.error("❌ Lỗi hủy lịch trình:", err);
                    let errorMessage = "Không thể hủy lịch trình. Vui lòng thử lại.";
                    if (err.response && err.response.data) {
                        errorMessage = err.response.data.message || errorMessage;
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    showAlert("Không thể thực hiện thao tác này", errorMessage, "warning");
                } finally {
                    setDeleteLoading(false);
                }
            },
            schedule
        );
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleAddSchedule = () => {
        setEditingSchedule(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'UPCOMING': { label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800 border-blue-200' },
            'ACTIVE': { label: 'Đang mở đặt', color: 'bg-green-100 text-green-800 border-green-200' },
            'ONGOING': { label: 'Đang diễn ra', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            'COMPLETED': { label: 'Đã hoàn thành', color: 'bg-gray-100 text-gray-800 border-gray-200' },
            'CANCELLED': { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-200' }
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    const getAlertModalStyles = () => {
        switch (alertModal.type) {
            case "success":
                return {
                    borderColor: "border-green-500",
                    iconComponent: (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ),
                    title: "text-green-600",
                    button: "bg-green-600 hover:bg-green-700",
                };
            case "warning":
                return {
                    borderColor: "border-yellow-500",
                    iconComponent: (
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    ),
                    title: "text-yellow-600",
                    button: "bg-yellow-600 hover:bg-yellow-700",
                    cancelButton: "bg-gray-500 hover:bg-gray-600",
                };
            case "error":
                return {
                    borderColor: "border-red-500",
                    iconComponent: (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ),
                    title: "text-red-600",
                    button: "bg-red-600 hover:bg-red-700",
                };
            default:
                return {
                    borderColor: "border-blue-500",
                    iconComponent: (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    ),
                    title: "text-blue-600",
                    button: "bg-blue-600 hover:bg-blue-700",
                };
        }
    };

    const modalStyles = getAlertModalStyles();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-3 text-gray-600 text-sm">Đang tải thông tin tour...</p>
            </div>
        </div>
    );

    if (!tour) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-3">❌</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy tour</h2>
                <p className="text-gray-600 text-sm">Tour bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            </div>
        </div>
    );

    return (
        <AdminLayout children={
            <div className="w-full bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                    {/* Header Section */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-start">
                            <div className="w-full lg:w-2/5">
                                <div className="w-full h-48 lg:h-64 rounded-lg overflow-hidden shadow-md">
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
                                                    alt={`Slide ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">{tour.name}</h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <FaCalendarAlt className="text-green-600 text-sm" />
                                        <span><strong>Thời lượng:</strong> {tour.durationDays} ngày</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <FaTag className="text-blue-600 text-sm" />
                                        <span><strong>Điểm đến:</strong> {tour.destination}</span>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-100 text-left">
                                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm ">
                                        <FaCheckCircle className="text-green-600 text-sm" />
                                        Điểm nhấn hành trình
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed text-sm">{tour.highLight}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Management Section */}
                    <section className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                        <FaCalendarAlt className="text-green-600 text-lg" />
                                    </div>
                                    Quản lý lịch khởi hành
                                </h2>
                            </div>
                            <button
                                onClick={handleAddSchedule}
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 flex items-center gap-2 group text-sm"
                            >
                                <FaPlus className="group-hover:scale-110 transition-transform text-sm" />
                                Thêm lịch mới
                            </button>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">STT</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Ngày khởi hành</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Ngày kết thúc</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 text-xs uppercase tracking-wider">Giá người lớn (VNĐ)</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 text-xs uppercase tracking-wider">Giá trẻ em (VNĐ)</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 text-xs uppercase tracking-wider">Giá em bé (VNĐ)</th>
                                    <th className="px-3 py-2 text-center font-semibold text-gray-700 text-xs uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-3 py-2 text-center font-semibold text-gray-700 text-xs uppercase tracking-wider">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {tour.schedules?.filter(schedule => schedule.status !== 'CANCELLED').map((item, idx) => {
                                    const statusInfo = getStatusInfo(item.status);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-3 py-2 text-gray-600 font-medium">{idx + 1}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-green-600 text-xs" />
                                                    <span className="font-medium text-gray-900 text-sm">
            {formatVietnameseDate(item.startDate)}
        </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700 font-medium text-sm">
                                                {formatVietnameseDate(item.endDate)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="font-bold text-green-600 text-sm">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="text-blue-600 font-semibold text-sm">
                                                    {formatCurrency(item.childPrice)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="text-purple-600 font-semibold text-sm">
                                                    {formatCurrency(item.babyPrice)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} min-w-[90px] text-center`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEditSchedule(item)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center gap-1 shadow-sm hover:shadow-md text-xs"
                                                    >
                                                        <FaEdit size={12} /> Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelSchedule(item)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center gap-1 shadow-sm hover:shadow-md text-xs"
                                                    >
                                                        <FaTrash size={12} /> Hủy
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            {!tour.schedules || tour.schedules.filter(schedule => schedule.status !== 'CANCELLED').length === 0 && (
                                <div className="text-center py-12 bg-gray-50">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaCalendarAlt className="text-gray-400 text-lg" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-500 mb-1">Chưa có lịch khởi hành</h3>
                                    <p className="text-gray-400 text-sm">Hãy thêm lịch khởi hành đầu tiên cho tour này</p>
                                </div>
                            )}
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-3">
                            {tour.schedules?.filter(schedule => schedule.status !== 'CANCELLED').map((item, idx) => {
                                const statusInfo = getStatusInfo(item.status);
                                return (
                                    <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        {/* Header với STT và Status */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">#{idx + 1}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {/* Thông tin ngày */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="space-y-1">
                                                <div className="text-xs text-gray-500 font-medium">Ngày khởi hành</div>
                                                <div className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-green-600 text-xs" />
                                                    <span className="font-semibold text-gray-900 text-sm">{item.startDate}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-gray-500 font-medium">Ngày kết thúc</div>
                                                <div className="font-semibold text-gray-900 text-sm">{item.endDate}</div>
                                            </div>
                                        </div>

                                        {/* Thông tin giá */}
                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                <span className="text-xs text-gray-600">Người lớn</span>
                                                <span className="font-bold text-green-600 text-sm">{formatCurrency(item.price)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                <span className="text-xs text-gray-600">Trẻ em</span>
                                                <span className="font-semibold text-blue-600 text-sm">{formatCurrency(item.childPrice)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">Em bé</span>
                                                <span className="font-semibold text-purple-600 text-sm">{formatCurrency(item.babyPrice)}</span>
                                            </div>
                                        </div>

                                        {/* Nút thao tác */}
                                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleEditSchedule(item)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium transition-all flex items-center justify-center gap-1 text-xs"
                                            >
                                                <FaEdit size={12} /> Sửa
                                            </button>
                                            <button
                                                onClick={() => handleCancelSchedule(item)}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm font-medium transition-all flex items-center justify-center gap-1 text-xs"
                                            >
                                                <FaTrash size={12} /> Hủy
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {!tour.schedules || tour.schedules.filter(schedule => schedule.status !== 'CANCELLED').length === 0 && (
                                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <FaCalendarAlt className="text-gray-400 text-lg" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-500 mb-1">Chưa có lịch khởi hành</h3>
                                    <p className="text-gray-400 text-xs">Hãy thêm lịch khởi hành đầu tiên cho tour này</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Itinerary */}
                    <section className="mt-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                            📌 Lịch trình chi tiết
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tour.itineraryDays?.map((day) => (
                                <div
                                    key={day.dayIndex}
                                    className="bg-white p-3 rounded-lg shadow-md text-left"
                                >
                                    <h3 className="text-base font-semibold text-green-600 mb-3">
                                        Ngày {day.dayIndex}: {day.title}
                                    </h3>

                                    <div className="space-y-3">
                                        {day.activities?.map((act, j) => (
                                            <div
                                                key={j}
                                                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-gray-100 pb-3 last:border-none"
                                            >
                                                <div className="flex items-center gap-1 text-green-600 font-semibold min-w-[60px]">
                                                    <FaClock className="flex-shrink-0 text-sm" />
                                                    <span className="text-xs">{act.time?.slice(0, 5)}</span>
                                                </div>

                                                <div className={`text-left ${act.imageUrl ? "flex-1" : "w-full"}`}>
                                                    <p className="font-semibold text-gray-800 text-sm">{act.title}</p>
                                                    {act.details && (
                                                        <p className="text-gray-600 text-xs mt-1">{act.details}</p>
                                                    )}
                                                </div>
                                                {act.imageUrl && (
                                                    <div className="w-full sm:w-[30%] flex-shrink-0">
                                                        <img
                                                            src={act.imageUrl}
                                                            alt={act.title}
                                                            className="w-full aspect-[4/3] object-cover rounded shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Included & Excluded */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-3 text-green-600">✅ Dịch vụ bao gồm</h2>
                            <div className="space-y-2">
                                {includedServices.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <FaCheckCircle className="text-green-500 mt-0.5 text-sm"/>
                                        <p className="text-gray-700 text-sm">{item.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-3 text-red-500">❌ Không bao gồm</h2>
                            <div className="space-y-2">
                                {excludedServices.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <FaTimesCircle className="text-red-500 mt-0.5 text-sm"/>
                                        <p className="text-gray-700 text-sm">{item.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Policies */}
                    <section className="bg-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
                            📜 Chính sách & Quy định
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg text-blue-500 mb-3 flex items-center justify-center gap-2">
                                    <FaChild className="text-blue-500 text-sm"/> Quy định trẻ em
                                </h3>
                                <div className="space-y-2">
                                    {childrenPolicies.map((p, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <FaChild className="text-blue-400 mt-0.5 text-sm"/>
                                            <p className="text-gray-700 text-sm">{p.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-red-500 mb-3 flex items-center justify-center gap-2">
                                    <FaExclamationTriangle className="text-red-500 text-sm"/> Điều kiện hoãn / hủy
                                </h3>
                                <div className="space-y-2">
                                    {cancellationPolicies.map((p, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <FaExclamationTriangle className="text-red-400 mt-0.5 text-sm"/>
                                            <p className="text-gray-700 text-sm">{p.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <TourMapSection
                        destination={tour.destination}
                        latitude={tour.latitude}
                        longitude={tour.longitude}
                    />
                </div>

                {/* Modal for Create/Edit Schedule */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingSchedule ? 'Chỉnh sửa lịch khởi hành' : 'Thêm lịch khởi hành mới'}
                >
                    <div className="p-4">
                        <Formik
                            initialValues={{
                                startDate: editingSchedule?.startDate || '',
                                endDate: editingSchedule?.endDate || '',
                                price: editingSchedule?.price || '',
                                childPrice: editingSchedule?.childPrice || '',
                                babyPrice: editingSchedule?.babyPrice || ''
                            }}
                            validationSchema={scheduleValidationSchema}
                            onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                            enableReinitialize
                        >
                            {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
                                <Form className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                <FaCalendarAlt className="text-green-600 text-sm" />
                                                Ngày khởi hành *
                                            </label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={values.startDate}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    const endDate = calculateEndDate(e.target.value);
                                                    setFieldValue('endDate', endDate);
                                                }}
                                                onBlur={handleBlur}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                            />
                                            {errors.startDate && touched.startDate && (
                                                <div className="text-red-500 text-xs flex items-center gap-1">
                                                    <FaTimesCircle size={12} /> {errors.startDate}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-700">
                                                Ngày kết thúc *
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={values.endDate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                min={values.startDate || new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                            />
                                            {errors.endDate && touched.endDate && (
                                                <div className="text-red-500 text-xs flex items-center gap-1">
                                                    <FaTimesCircle size={12} /> {errors.endDate}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <FaClock className="text-green-600 text-xs" />
                                                Tự động tính: {tour.durationDays} ngày từ ngày bắt đầu
                                            </p>
                                        </div>

                                        {/* Giá người lớn */}
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                <FaMoneyBillWave className="text-green-600 text-sm" />
                                                Giá người lớn (VNĐ) *
                                            </label>
                                            <input
                                                type="text"
                                                name="price"
                                                defaultValue={values.price ? formatCurrency(values.price) : ''}
                                                onFocus={(e) => handlePriceFocus(e, 'price', values, setFieldValue)}
                                                onChange={(e) => handlePriceInput(e, setFieldValue, 'price')}
                                                onBlur={(e) => handlePriceBlur(e, 'price', values, setFieldValue, handleBlur)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right text-sm"
                                                placeholder={formatCurrency(tour.basePrice)}
                                            />
                                            {errors.price && touched.price && (
                                                <div className="text-red-500 text-xs flex items-center gap-1">
                                                    <FaTimesCircle size={12} /> {errors.price}
                                                </div>
                                            )}
                                        </div>

                                        {/* Giá trẻ em */}
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-700">
                                                Giá trẻ em (VNĐ) *
                                            </label>
                                            <input
                                                type="text"
                                                name="childPrice"
                                                defaultValue={values.childPrice ? formatCurrency(values.childPrice) : ''}
                                                onFocus={(e) => handlePriceFocus(e, 'childPrice', values, setFieldValue)}
                                                onChange={(e) => handlePriceInput(e, setFieldValue, 'childPrice')}
                                                onBlur={(e) => handlePriceBlur(e, 'childPrice', values, setFieldValue, handleBlur)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right text-sm"
                                                placeholder={formatCurrency(tour.basePrice/2)}
                                            />
                                            {errors.childPrice && touched.childPrice && (
                                                <div className="text-red-500 text-xs flex items-center gap-1">
                                                    <FaTimesCircle size={12} /> {errors.childPrice}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-700">
                                                Giá em bé (VNĐ) *
                                            </label>
                                            <input
                                                type="text"
                                                name="babyPrice"
                                                defaultValue={values.babyPrice ? formatCurrency(values.babyPrice) : ''}
                                                onFocus={(e) => handlePriceFocus(e, 'babyPrice', values, setFieldValue)}
                                                onChange={(e) => handlePriceInput(e, setFieldValue, 'babyPrice')}
                                                onBlur={(e) => handlePriceBlur(e, 'babyPrice', values, setFieldValue, handleBlur)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right text-sm"
                                                placeholder={formatCurrency(tour.basePrice/4)}
                                            />
                                            {errors.babyPrice && touched.babyPrice && (
                                                <div className="text-red-500 text-xs flex items-center gap-1">
                                                    <FaTimesCircle size={12} /> {errors.babyPrice}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <PricePercentageDisplay
                                        adultPrice={Number(values.price) || 0}
                                        childPrice={Number(values.childPrice) || 0}
                                        babyPrice={Number(values.babyPrice) || 0}
                                    />

                                    <div className="flex gap-3 pt-3 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold text-sm"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                editingSchedule ? 'Cập nhật' : 'Tạo mới'
                                            )}
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </Modal>

                {/* Modal thông báo */}
                {alertModal.isOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl w-full max-w-sm transform transition-all">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    {modalStyles.iconComponent}
                                    <div>
                                        <h3 className={`text-base font-semibold ${modalStyles.title}`}>
                                            {alertModal.title}
                                        </h3>
                                    </div>
                                </div>

                                {alertModal.type === "warning" && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-yellow-800">
                                            {alertModal.message}
                                        </p>
                                    </div>
                                )}

                                {alertModal.type === "success" && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-green-800">
                                            {alertModal.message}
                                        </p>
                                    </div>
                                )}

                                {alertModal.type === "error" && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-red-800">
                                            {alertModal.message}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    {alertModal.type === "warning" ? (
                                        <>
                                            <button
                                                onClick={closeAlert}
                                                disabled={deleteLoading}
                                                className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 text-sm"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (alertModal.onConfirm) {
                                                        alertModal.onConfirm();
                                                    }
                                                }}
                                                disabled={deleteLoading}
                                                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-1 text-sm"
                                            >
                                                {deleteLoading ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Đang xử lý...
                                                    </>
                                                ) : (
                                                    'Xác nhận hủy'
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={closeAlert}
                                            className={`px-3 py-1.5 ${modalStyles.button} text-white rounded-lg transition-all duration-200 flex items-center gap-1 text-sm`}
                                        >
                                            Đã hiểu
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        }/>
    );
};

export default AdminTourDetail;