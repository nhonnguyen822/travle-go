import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import img1 from "../../assets/khubaotondongthapmuoi.jpg";
import img2 from "../../assets/banner_vinh_ha_long.jpg";
import img3 from "../../assets/hinh-anh-hoi-an-dep-nhat.jpg";

import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import {useRef} from "react";

const BannerComponent = () => {
    const slides = [
        {
            image: img1,
            title: "MIỀN TÂY SÔNG NƯỚC",
            description: "Khám phá vùng đồng bằng sông Cửu Long với chợ nổi Cái Răng, rừng tràm Trà Sư, vườn trái cây trĩu quả và đắm mình trong văn hóa sông nước miền Tây Nam Bộ đặc sắc.",
            region: "Miền Nam"
        },
        {
            image: img2,
            title: "VỊNH HẠ LONG - DI SẢN THẾ GIỚI",
            description: "Trải nghiệm kỳ quan thiên nhiên với hàng nghìn đảo đá vôi hùng vĩ. Du thuyền trên vịnh, khám phá hang động và tận hưởng ẩm thực hải sản tươi ngon.",
            region: "Miền Bắc"
        },
        {
            image: img3,
            title: "PHỐ CỔ HỘI AN - HUẾ",
            description: "Hành trình về miền di sản: Khám phá kinh thành Huế cổ kính và phố cổ Hội An rực rỡ đèn lồng. Trải nghiệm ẩm thực cung đình và văn hóa truyền thống Việt.",
            region: "Miền Trung"
        }
    ];

    const prevRef = useRef(null);
    const nextRef = useRef(null);

    return (
        <div className="relative w-full h-[500px]">
            <div
                ref={prevRef}
                className="absolute top-1/2 left-4 z-30 -translate-y-1/2 cursor-pointer bg-black/40 p-3 rounded-full hover:bg-black/70 text-white transition-all duration-300"
            >
                <FaChevronLeft />
            </div>
            <div
                ref={nextRef}
                className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer bg-black/40 p-3 rounded-full hover:bg-black/70 text-white transition-all duration-300"
            >
                <FaChevronRight />
            </div>

            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation={{
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                }}
                onBeforeInit={(swiper) => {
                    swiper.params.navigation.prevEl = prevRef.current;
                    swiper.params.navigation.nextEl = nextRef.current;
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true
                }}
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false
                }}
                loop={true}
                className="w-full h-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative w-full h-full">
                            <img
                                src={slide.image}
                                alt={`Slide ${index}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay gradient for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-center items-start text-white px-10 md:px-20 max-w-2xl">
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                                    {slide.region}
                                </span>
                                <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg leading-tight">
                                    {slide.title}
                                </h1>
                                <p className="text-lg md:text-xl drop-shadow-md leading-relaxed mb-6">
                                    {slide.description}
                                </p>
                                <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                                    Khám Phá Ngay
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default BannerComponent;