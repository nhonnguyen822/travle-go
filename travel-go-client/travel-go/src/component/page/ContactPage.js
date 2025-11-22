import React from "react";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";

const ContactPage = () => {
    return (
        <>
            <HeaderComponent/>
            <div className="container mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold text-green-600 mb-8">Liên hệ với chúng tôi</h1>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Form liên hệ */}
                    <form className="bg-white shadow-md rounded-lg p-6 space-y-4">
                        <input type="text" placeholder="Họ và tên" className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"/>
                        <input type="email" placeholder="Email" className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"/>
                        <input type="text" placeholder="Số điện thoại" className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"/>
                        <textarea placeholder="Nội dung" className="w-full border border-gray-300 rounded px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-green-400"></textarea>
                        <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">Gửi</button>
                    </form>

                    {/* Thông tin liên hệ */}
                    <div className="bg-green-50 rounded-lg p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Thông tin liên hệ</h2>
                        <p>Email: support@travelgo.com</p>
                        <p>Hotline: 1900 1234</p>
                        <p>Địa chỉ: 123 Đường Du Lịch, Hà Nội</p>
                        <div className="w-full h-48 rounded overflow-hidden">
                            {/* Có thể nhúng Google Map iframe */}
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.395!2d105.841!3d21.028!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab1234567!2sHanoi!5e0!3m2!1sen!2s!4v123456789"
                                width="100%"
                                height="100%"
                                allowFullScreen=""
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <FooterComponent/>
        </>

    );
};

export default ContactPage;
