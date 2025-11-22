import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const TourImagesSlider = ({ images }) => {
    const imageArray = Array.isArray(images) ? images : [images];

    return (
        <div className="w-full md:w-4/5">
            <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={10}
                slidesPerView={1}
                pagination={{ clickable: true }}
                navigation
                loop={true}
                className="w-full h-48 rounded-lg"
            >
                {imageArray.map((img, index) => (
                    <SwiperSlide key={index}>
                        <img
                            src={img || "https://via.placeholder.com/400x300"}
                            alt={`Slide ${index}`}
                            className="w-full h-48 object-cover rounded-lg"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default TourImagesSlider;
