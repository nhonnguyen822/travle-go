import {Link} from "react-router-dom";

const TourListSectionComponent = ({title, description, tours}) => {
    return (
        <div className="py-12 bg-gray-200 px-4 sm:px-6 lg:px-0">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold">{title}</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {tours.map((tour) => (
                    <div
                        key={tour.id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden relative group"
                    >
                        <div
                            className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 text-sm font-semibold z-10 rounded">
                            From {tour.basePrice.toLocaleString('vi-VN')} VND
                        </div>
                        <img
                            src={tour.image}
                            alt={tour.title}
                            className="w-full h-60 object-cover"
                        />
                        <div
                            className="absolute bottom-0 left-0 w-full h-4/5 bg-black bg-opacity-60 text-white p-4 transition-transform duration-300 transform translate-y-1/2 group-hover:translate-y-0 flex flex-col justify-between">
                            <div>
                                <span className="text-sm">
    Duration: {tour.duration > 1 ? `${tour.duration} ngày ${tour.duration - 1} đêm` : `${tour.duration} ngày`}
</span>
                                <h3 className="font-bold text-lg mt-1">{tour.title}</h3>
                                <p className="text-gray-200 text-sm mt-1">
                                    Destination {tour.destination}
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

            <div className="max-w-6xl mx-auto mt-10 text-center">
                {tours.length > 0 && tours[0].region && (
                    <Link to={`/tours/region/${tours[0].region.id}`}>
                        <button
                            className="bg-green-500 text-white px-5 py-2 rounded font-semibold shadow-md hover:bg-green-600 transition">
                            See more trips
                        </button>
                    </Link>
                )}

                {/* Gạch ngang */}
                <hr className="border-t-2 border-green-500 w-90 mx-auto mt-6"/>
            </div>
        </div>
    );
};

export default TourListSectionComponent;
