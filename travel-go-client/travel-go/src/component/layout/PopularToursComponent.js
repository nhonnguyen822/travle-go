import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {getMostPopularTour} from "../../service/tour_service";

const PopularToursComponent = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getMostPopularTour();

                // Xử lý nhiều định dạng response khác nhau
                let toursData = [];

                if (Array.isArray(res)) {
                    toursData = res;
                } else if (res && Array.isArray(res.content)) {
                    // Nếu response có dạng {content: [...]}
                    toursData = res.content;
                } else if (res && Array.isArray(res.data)) {
                    // Nếu response có dạng {data: [...]}
                    toursData = res.data;
                } else if (res && typeof res === 'object') {
                    // Nếu response là single object, chuyển thành array
                    toursData = [res];
                }

                setTours(toursData || []);
            } catch (err) {
                console.error("❌ Lỗi khi tải tour phổ biến:", err);
                setError("Không thể tải dữ liệu tour");
                setTours([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="py-12 bg-white px-4 sm:px-6 lg:px-0">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold">OUR MOST POPULAR TOURS</h2>
                </div>
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 bg-white px-4 sm:px-6 lg:px-0">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold">OUR MOST POPULAR TOURS</h2>
                </div>
                <div className="text-center text-red-600 py-10">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 bg-white px-4 sm:px-6 lg:px-0">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold">OUR MOST POPULAR TOURS</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                    Đây là những hành trình được du khách của chúng tôi lựa chọn phổ biến nhất, nhưng hãy nhớ rằng bạn luôn có thể tự tạo chuyến đi theo ý mình chỉ bằng cách thông báo cho chúng tôi về yêu cầu của bạn.
                </p>
            </div>

            {tours.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    Không có tour phổ biến nào được tìm thấy.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {tours.map((tour) => (
                        <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden relative group">
                            <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 text-sm font-semibold z-10 rounded">
                                From {(tour.basePrice || tour.price || 0).toLocaleString('vi-VN')} VND
                            </div>
                            <img
                                src={tour.image || tour.imageUrl || '/default-tour.jpg'}
                                alt={tour.name || tour.title}
                                className="w-full h-60 object-cover"
                                onError={(e) => {
                                    e.target.src = '/default-tour.jpg';
                                }}
                            />
                            <div className="absolute bottom-0 left-0 w-full h-4/5 bg-black bg-opacity-60 text-white p-4 transition-transform duration-300 transform translate-y-1/2 group-hover:translate-y-0 flex flex-col justify-between">
                                <div>
                                    <span className="text-sm">
                                        Duration: {tour.duration > 1 ? `${tour.duration} ngày ${tour.duration - 1} đêm` : `${tour.duration} ngày`}
                                    </span>
                                    <h3 className="font-bold text-lg mt-1">{tour.title || tour.name}</h3>
                                    <p className="text-gray-200 text-sm mt-1">
                                        Destinations: {tour.destination}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <Link to={`/tours/${tour.id}`}>
                                        <button className="bg-green-500 text-white px-3 py-1 rounded font-semibold">
                                            Customize Tour
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PopularToursComponent;