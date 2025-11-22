import {Link, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";
import {findListTourByRegionId} from "../../service/tour_service";

const TourListByRegionPage = () => {
    const {regionId} = useParams();
    const [allTours, setAllTours] = useState([]);
    const [visibleCount, setVisibleCount] = useState(6);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await findListTourByRegionId(regionId);

                // Đảm bảo res luôn là mảng
                if (Array.isArray(res)) {
                    setAllTours(res);
                } else {
                    console.error('API response is not an array:', res);
                    setAllTours([]);
                }
            } catch (err) {
                console.error('Error fetching tours:', err);
                setError('Failed to load tours');
                setAllTours([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [regionId]);

    const region = allTours.length > 0 ? allTours[0]?.regions : null;

    const handleToggle = () => {
        if (visibleCount >= allTours.length) {
            setVisibleCount(6);
        } else {
            setVisibleCount(prev => prev + 6);
        }
    };

    // Hiển thị trạng thái loading
    if (loading) {
        return (
            <>
                <HeaderComponent/>
                <div className="py-12 bg-gray-200 px-4 sm:px-6 lg:px-0">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
                            <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
                        </div>
                    </div>
                </div>
                <FooterComponent/>
            </>
        );
    }

    // Hiển thị lỗi
    if (error) {
        return (
            <>
                <HeaderComponent/>
                <div className="py-12 bg-gray-200 px-4 sm:px-6 lg:px-0">
                    <div className="max-w-6xl mx-auto text-center">
                        <p className="text-red-500 text-lg">{error}</p>
                    </div>
                </div>
                <FooterComponent/>
            </>
        );
    }

    return (
        <>
            <HeaderComponent/>
            <div className="py-12 bg-gray-200 px-4 sm:px-6 lg:px-0">
                <div className="text-center mb-10">
                    {region && (
                        <div className="max-w-6xl mx-auto text-center px-4">
                            <h1 className="text-5xl font-bold text-green-600 mb-4">{region.name}</h1>
                            <p className="text-gray-700 mb-2">{region.description}</p>
                            <p className="text-gray-800 font-semibold">{`Điểm nhấn: ${region.highlights}`}</p>
                        </div>
                    )}

                    {!region && allTours.length === 0 && (
                        <p className="mt-4 max-w-2xl mx-auto text-center">
                            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent text-lg font-semibold">
                                🌟 Không có tour nào cho khu vực này
                            </span>
                        </p>
                    )}

                    {!region && allTours.length > 0 && (
                        <p className="mt-4 max-w-2xl mx-auto text-center">
                            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent text-lg font-semibold">
                                🌟 Chọn tour yêu thích của bạn và bắt đầu hành trình khám phá
                            </span>
                        </p>
                    )}
                </div>

                {/* Đảm bảo allTours là mảng trước khi dùng map */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {Array.isArray(allTours) && allTours.slice(0, visibleCount).map(tour => (
                        <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden relative group">
                            <div
                                className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 text-sm font-semibold z-10 rounded">
                                From {tour.basePrice?.toLocaleString('vi-VN')} VND
                            </div>
                            <img src={tour.image} alt={tour.name} className="w-full h-60 object-cover"/>
                            <div
                                className="absolute bottom-0 left-0 w-full h-4/5 bg-black bg-opacity-60 text-white p-4 transition-transform duration-300 transform translate-y-1/2 group-hover:translate-y-0 flex flex-col justify-between">
                                <div>
                                    <span className="text-sm">
                                        Duration: {tour.duration > 1 ? `${tour.duration} ngày ${tour.duration - 1} đêm` : `${tour.duration} ngày`}
                                    </span>
                                    <h3 className="font-bold text-lg mt-1">{tour.title}</h3>
                                    <p className="text-gray-200 text-sm mt-1">Destinations: {tour.destination}</p>
                                </div>
                                <div className="mt-2">
                                    <Link to={`/tours/${tour.id}`}>
                                        <button
                                            className="bg-green-500 text-white px-3 py-1 rounded font-semibold">Customize
                                            Tour
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {Array.isArray(allTours) && allTours.length > 6 && (
                    <div className="text-center mt-8">
                        <button
                            onClick={handleToggle}
                            className="bg-yellow-500 text-black px-5 py-2 rounded font-semibold shadow-md hover:bg-yellow-600 transition"
                        >
                            {visibleCount >= allTours.length ? "Thu gọn" : "More"}
                        </button>
                    </div>
                )}
            </div>
            <FooterComponent/>
        </>
    );
};

export default TourListByRegionPage;