import { FaHeadset, FaHotel, FaGift, FaUserTie, FaAward } from "react-icons/fa";

const WhyTravelSectionComponent = () => {
    const items = [
        { icon: <FaAward size={28} className="text-green-500" />, title: "20 years of experience" },
        { icon: <FaHeadset size={28} className="text-green-500" />, title: "24/7 Support" },
        { icon: <FaHotel size={28} className="text-green-500" />, title: "Great selection of hotels and services" },
        { icon: <FaGift size={28} className="text-green-500" />, title: "Unique and original products" },
        { icon: <FaUserTie size={28} className="text-green-500" />, title: "Excellent tour guides" },
    ];

    return (
        <div className="bg-gray-200 py-16">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">WHY TRAVEL WITH TRAVELGO?</h2>
                <p className="text-gray-700 mb-12">
                    As a local agency with offices in Vietnam, Laos and Cambodia, we are proud to be your travel expert
                </p>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {items.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 flex flex-col items-center">
                            {item.icon}
                            <p className="mt-4 text-center font-medium">{item.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WhyTravelSectionComponent;
