import { useEffect, useState } from "react";
import TourListSectionComponent from "./TourListSectionComponent";
import { findListTourByRegionId } from "../../service/tour_service";
import { getAllRegions } from "../../service/region_service";

const TourComponent = () => {
    const [regions, setRegions] = useState([]);
    const [toursByRegion, setToursByRegion] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1️⃣ Lấy danh sách regions từ backend - đảm bảo luôn là mảng
                const regionsData = await getAllRegions();
                setRegions(Array.isArray(regionsData) ? regionsData : []);

                // 2️⃣ Lấy tour cho từng region
                const toursData = {};
                if (Array.isArray(regionsData) && regionsData.length > 0) {
                    for (let region of regionsData) {
                        try {
                            const tours = await findListTourByRegionId(region.id);
                            // Đảm bảo tours là mảng và lọc tour ACTIVE
                            const activeTours = Array.isArray(tours)
                                ? tours.filter(t => t?.status === "ACTIVE")
                                : [];
                            toursData[region.id] = activeTours;
                        } catch (regionError) {
                            console.error(`Error fetching tours for region ${region.id}:`, regionError);
                            toursData[region.id] = []; // Đảm bảo luôn là mảng ngay cả khi có lỗi
                        }
                    }
                }
                setToursByRegion(toursData);
            } catch (error) {
                console.error("Error fetching tours or regions:", error);
                setError("Failed to load data");
                setRegions([]); // Đảm bảo regions luôn là mảng
                setToursByRegion({});
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Hiển thị trạng thái loading
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-pulse text-center">
                    <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
                </div>
            </div>
        );
    }

    // Hiển thị lỗi
    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 text-lg">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Kiểm tra nếu không có regions nào
    if (!Array.isArray(regions) || regions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Không có khu vực nào để hiển thị</p>
            </div>
        );
    }

    return (
        <>
            {regions.map((region) => (
                <TourListSectionComponent
                    key={region.id}
                    title={`DISCOVER TOURS IN ${region.name?.toUpperCase() || 'UNKNOWN REGION'}`}
                    description={`Khám phá những hành trình tuyệt vời tại ${region.name || 'khu vực này'}`}
                    tours={Array.isArray(toursByRegion[region.id]) ? toursByRegion[region.id].slice(0, 3) : []}
                />
            ))}
        </>
    );
};

export default TourComponent;