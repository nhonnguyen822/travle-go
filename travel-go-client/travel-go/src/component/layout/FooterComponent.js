import {FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn} from "react-icons/fa";
import {Link} from "react-router-dom";

const FooterComponent = () => {
    return (
        <footer className="bg-green-600 text-white py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
                {/* About */}
                <div>
                    <h3 className="text-xl font-bold mb-4">TravelGo</h3>
                    <p className="text-gray-200">
                        Chúng tôi cung cấp các tour du lịch chất lượng cao khắp Việt Nam. Hãy để chúng tôi biến chuyến
                        đi của bạn trở nên đáng nhớ.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="flex flex-col items-start">
                    <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><Link to="/" className="hover:text-yellow-400 transition-colors ml-2">Trang chủ</Link></li>
                        <li><Link to="/tours" className="hover:text-yellow-400 transition-colors ml-2">Tour</Link></li>
                        <li><Link to="/blog" className="hover:text-yellow-400 transition-colors ml-2">Blog</Link></li>
                        <li><Link to="/contact" className="hover:text-yellow-400 transition-colors ml-2">Liên hệ</Link>
                        </li>
                        <li><Link to="/map" className="hover:text-yellow-400 transition-colors ml-2">Bản đồ</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col items-start">
                    <h3 className="text-xl font-bold mb-4">Contact</h3>
                    <p className="text-gray-200">Email: info@travelgo.com</p>
                    <p className="text-gray-200">Phone: +84 123 456 789</p>
                    <p className="text-gray-200">Address: 123 Nguyen Hue, Ho Chi Minh City</p>
                </div>

                {/* Social Media */}
                <div>
                    <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-yellow-400 transition-colors"><FaFacebookF/></a>
                        <a href="#" className="hover:text-yellow-400 transition-colors"><FaTwitter/></a>
                        <a href="#" className="hover:text-yellow-400 transition-colors"><FaInstagram/></a>
                        <a href="#" className="hover:text-yellow-400 transition-colors"><FaLinkedinIn/></a>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-green-500 pt-4 text-center text-gray-200 text-sm">
                &copy; {new Date().getFullYear()} TravelGo. All rights reserved.
            </div>
        </footer>
    );
};

export default FooterComponent;
