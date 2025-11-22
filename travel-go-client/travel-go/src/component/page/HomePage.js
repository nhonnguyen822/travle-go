import HeaderComponent from "../layout/HeaderComponent";
import BannerComponent from "../layout/BannerComponent";
import WhyTravelSectionComponent from "../layout/WhyTravelSectionComponent";
import PopularToursComponent from "../layout/PopularToursComponent";
import TourComponent from "../layout/TourComponent";
import FooterComponent from "../layout/FooterComponent";

const HomePage = () => {
    return (
        <>
            <HeaderComponent/>
            <BannerComponent/>
            <WhyTravelSectionComponent/>
            <PopularToursComponent/>
            <TourComponent/>
            <FooterComponent/>
        </>
    );
}
export default HomePage;