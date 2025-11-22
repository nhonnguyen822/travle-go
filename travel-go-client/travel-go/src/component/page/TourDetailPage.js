import {useNavigate, useParams} from "react-router-dom";
import HeaderComponent from "../layout/HeaderComponent";
import {FaCheckCircle, FaChild, FaClock, FaExclamationTriangle, FaTimesCircle} from "react-icons/fa";
import FooterComponent from "../layout/FooterComponent";
import {Swiper, SwiperSlide} from "swiper/react";
import {Autoplay, Pagination} from "swiper/modules";
import {useEffect, useMemo, useState} from "react";
import {findTourById} from "../../service/tour_service";
import TourMapSection from "../layout/TourMapSection";

const TourDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const data = await findTourById(id);
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

    if (loading) return <p className="text-center py-20">⏳ Đang tải dữ liệu...</p>;
    if (!tour) return <p className="text-center py-20">❌ Không tìm thấy tour</p>;

    return (
        <div className="w-full">
            <HeaderComponent/>
            {/* Content Section */}
            <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 ">
                {/* Điểm nhấn hành trình */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Cột ảnh */}
                    <div className="w-full h-[350px] md:h-[300px]">
                        <Swiper
                            modules={[Pagination, Autoplay]}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                            loop={true}
                            className="w-full h-full rounded-lg shadow overflow-hidden"
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

                    {/* Cột Điểm nhấn */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-green-600 flex items-center mb-4">
                            <span className="mr-2">📌</span> Điểm nhấn hành trình
                        </h2>

                        <div className="space-y-3 text-gray-700 text-left">
                            <p>
                                <strong>Hành trình:</strong> {tour.name}
                            </p>
                            <p>
                                <strong>Thời lượng:</strong> {tour.durationDays} ngày
                            </p>
                            <p className="text-sm leading-relaxed text-gray-600 italic">
                                {tour.highLight}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Itinerary */}

                <section className="mt-10 max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
                        📌 Lịch trình chi tiết
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tour.itineraryDays.map((day) => (
                            <div
                                key={day.dayIndex}
                                className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-left"
                            >
                                {/* Tiêu đề ngày */}
                                <h3 className="text-lg sm:text-xl font-semibold text-green-600 mb-4">
                                    Ngày {day.dayIndex}: {day.title}
                                </h3>

                                {/* Activities */}
                                <div className="space-y-4">
                                    {day.activities?.map((act, j) => (
                                        <div
                                            key={j}
                                            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-100 pb-4 last:border-none"
                                        >
                                            {/* Thời gian */}
                                            <div className="flex items-center gap-2 text-green-600 font-semibold min-w-[70px]">
                                                <FaClock className="flex-shrink-0" />
                                                <span className="text-sm sm:text-base">{act.time?.slice(0, 5)}</span>
                                            </div>

                                            {/* Nội dung */}
                                            <div className={`text-left ${act.imageUrl ? "flex-1" : "w-full"}`}>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">{act.title}</p>
                                                {act.details && (
                                                    <p className="text-gray-600 text-xs sm:text-sm mt-1">{act.details}</p>
                                                )}
                                            </div>

                                            {/* Hình ảnh chỉ hiện khi có */}
                                            {act.imageUrl && (
                                                <div className="w-full sm:w-[35%] flex-shrink-0">
                                                    <img
                                                        src={act.imageUrl}
                                                        alt={act.title}
                                                        className="w-full aspect-[4/3] object-cover rounded-lg shadow-sm"
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
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold mb-4 text-green-600">✅ Dịch vụ bao gồm</h2>
                        <div className="space-y-3">
                            {includedServices.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <FaCheckCircle className="text-green-500 mt-1"/>
                                    <p className="text-gray-700">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold mb-4 text-red-500">❌ Không bao gồm</h2>
                        <div className="space-y-3">
                            {excludedServices.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <FaTimesCircle className="text-red-500 mt-1"/>
                                    <p className="text-gray-700">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Policies */}
                <section className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                        📜 Chính sách & Quy định
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-xl text-blue-500 mb-4 flex items-center justify-center gap-2">
                                <FaChild className="text-blue-500"/> Quy định trẻ em
                            </h3>
                            <div className="space-y-3">
                                {childrenPolicies.map((p, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <FaChild className="text-blue-400 mt-1"/>
                                        <p className="text-gray-700">{p.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-xl text-red-500 mb-4 flex items-center justify-center gap-2">
                                <FaExclamationTriangle className="text-red-500"/> Điều kiện hoãn / hủy
                            </h3>
                            <div className="space-y-3">
                                {cancellationPolicies.map((p, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <FaExclamationTriangle className="text-red-400 mt-1"/>
                                        <p className="text-gray-700">{p.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Other Departures */}
                <section className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        📅 Lịch khởi hành
                    </h2>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full table-auto border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-green-100">
                            <tr>
                                <th className="px-5 py-3 text-center font-semibold text-gray-700">STT</th>
                                <th className="px-5 py-3 text-center font-semibold text-gray-700">Ngày khởi hành</th>
                                <th className="px-5 py-3 text-center font-semibold text-gray-700">Giá</th>
                                <th className="px-5 py-3 text-center font-semibold text-gray-700">Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tour.schedules?.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-gray-200 hover:bg-green-50 transition-colors"
                                >
                                    <td className="px-5 py-4 text-center">{idx + 1}</td>
                                    <td className="px-5 py-4 text-center">{item.startDate}</td>
                                    <td className="px-5 py-4 font-bold text-green-600 text-right">{Number(item.price).toLocaleString("vi-VN")} VNĐ</td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => navigate(`/booking/${tour.id}/${item.id}`)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all"
                                        >
                                            Đặt ngay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!tour.schedules || tour.schedules.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">
                                        Chưa có lịch khởi hành cho tour này.
                                    </td>
                                </tr>
                            ) : null}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card */}
                    <div className="md:hidden space-y-4">
                        {tour.schedules?.map((item) => (
                            <div key={item.id} className="bg-green-50 p-4 rounded-lg shadow-md">
                                <div className="space-y-2 text-sm sm:text-base">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Ngày khởi hành:</span>
                                        <span className="text-gray-800">{item.startDate}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Giá:</span>
                                        <span className="text-green-600 font-bold">{Number(item.price).toLocaleString("vi-VN")} VNĐ</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Số chỗ còn:</span>
                                        <span className="text-gray-800">{item.availableSlots}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/booking/${tour.id}/${item.id}`)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md w-full mt-4"
                                >
                                    Đặt ngay
                                </button>
                            </div>
                        ))}
                        {!tour.schedules || tour.schedules.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                                Chưa có lịch khởi hành cho tour này.
                            </div>
                        )}
                    </div>
                </section>

                <TourMapSection
                    destination={tour.destination}
                    latitude={tour.latitude}
                    longitude={tour.longitude}
                />
            </div>
            <FooterComponent/>
        </div>
    );
};

export default TourDetailPage;
