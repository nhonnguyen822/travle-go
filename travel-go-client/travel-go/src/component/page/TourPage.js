import { Link } from "react-router-dom";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";
import { useEffect, useState } from "react";
import { getAllRegions } from "../../service/region_service";

const TourPage = () => {
    const [regions, setRegions] = useState([]);

    useEffect(() => {
        const fetchRegions = async () => {
            const res = await getAllRegions();
            setRegions(res);
        };
        fetchRegions();
    }, []);

    return (
        <>
            <HeaderComponent />

            <div className="max-w-6xl mx-auto py-10 px-4 text-center">
                <h1 className="text-2xl md:text-4xl font-bold mb-3">
                    Where Do You Want To Travel?
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Khám phá những hành trình tuyệt vời nhất Đông Dương – từ biển xanh cát trắng
                    đến di sản văn hoá, mọi trải nghiệm đang chờ bạn.
                </p>

                {/* Grid AdminToursComponent */}
                <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[300px]">
                    {regions.map((region, index) => (
                        <Link
                            key={region.id}
                            to={`/tours/region/${region.id}`}
                            className={`relative group overflow-hidden rounded-lg ${
                                index === 0 ? "row-span-2" : ""
                            }`}
                        >
                            <img
                                src={region.image}
                                alt={region.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
                            />

                            {/* Overlay */}
                            <div
                                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white px-2"
                            >
                                <h2
                                    className="text-lg md:text-xl font-bold transition-all duration-500
                   transform translate-y-0 group-hover:-translate-y-[70%]"
                                >
                                    {region.name}
                                </h2>
                                <p
                                    className="opacity-0 transition-all duration-500 transform translate-y-6
                   group-hover:opacity-100 group-hover:translate-y-0 text-sm"
                                >
                                    {region.highlights}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <FooterComponent />
        </>
    );
};

export default TourPage;
