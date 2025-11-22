import React, { useEffect, useState } from "react";
import {ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import toast from "react-hot-toast";
import {verifyEmail} from "../../service/authService";
import verifyToken from "../../service/tokenService";

const VerifyEmail = () => {
    const [isVerify, setIsVerify] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpiry, setIsExpiry] = useState(false);
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // Kiểm tra token có hợp lệ hay hết hạn
    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setIsExpiry(true);
                return;
            }
            const valid = await verifyToken(token);
            setIsExpiry(!valid);
        };

        checkToken();
    }, [token]);

    // Khi customer click nút kích hoạt
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const result = await verifyEmail(token);
            if (result.success) {
                toast.success("Xác thực tài khoản thành công");
                setIsVerify(true);
            } else {
                toast.error(result.error || "Xác thực thất bại");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Token hết hạn
    if (isExpiry) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">
                            <ArrowLeft size={20} className="mr-2" />
                            Về trang chủ
                        </Link>

                        <div className="flex justify-center mb-6">
                            <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-indigo-500 drop-shadow-lg tracking-wide">
                                TravelGo
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Liên kết không hợp lệ
                        </h2>
                        <p className="text-gray-600">
                            Đường dẫn của bạn đã hết hạn hoặc không hợp lệ.
                            <br /> Vui lòng yêu cầu mới bằng cách đăng nhập tài khoản.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Đã xác thực thành công
    if (isVerify) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Tài khoản đã được kích hoạt!
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Bạn đã xác nhận kích hoạt tài khoản thành công. Chúc bạn có một
                            trải nghiệm tốt tại TravelGo.
                        </p>
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => navigate("/login")}
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Trang chờ kích hoạt (token hợp lệ)
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Link to="/login" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">
                        <ArrowLeft size={20} className="mr-2" />
                        Quay lại đăng nhập
                    </Link>

                    <div className="flex justify-center mb-6">
                        <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-indigo-500 drop-shadow-lg tracking-wide">
                            TravelGo
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Xác nhận đăng ký
                    </h2>
                    <p className="text-gray-600">
                        Nhấn vào nút bên dưới để xác nhận kích hoạt tài khoản
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-green-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-indigo-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isSubmitting ? "Đang gửi xác nhận..." : "Kích hoạt tài khoản"}
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Cần hỗ trợ?{" "}
                        <a href="mailto:support@travlergo.vn" className="text-green-600 hover:text-green-700">
                            Liên hệ với chúng tôi
                        </a>
                    </p>
                </div>
            </div>ư
        </div>
    );
};

export default VerifyEmail;
