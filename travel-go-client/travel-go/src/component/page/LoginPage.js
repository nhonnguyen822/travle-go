import React, {useEffect, useRef, useState} from "react";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {ArrowLeft, Eye, EyeOff, Lock, Mail} from "lucide-react";
import toast from "react-hot-toast";
import {ErrorMessage, Field, Form, Formik} from "formik";
import * as Yup from "yup";

import {useAuth} from "../../context/AuthContext";

import {login} from "../../service/authService";
import EnableAccountModal from "../modal/EnableAccountModal";
import HeaderComponent from "../layout/HeaderComponent";

// Validation schema
const loginSchema = Yup.object({
    email: Yup.string()
        .email("Email không hợp lệ")
        .required("Vui lòng nhập email"),
    password: Yup.string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .required("Vui lòng nhập mật khẩu"),
});

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { fetchUser, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const shownRef = useRef(false);
    const [showReminderModal, setShowReminderModal] = useState(false);

    const initialValues = {
        email: "",
        password: "",
        rememberMe: false,
    };

    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (!shownRef.current && errorParam === "ACCOUNT_DISABLED") {
            toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên");
        }
        shownRef.current = true;
        navigate("/login", { replace: true });
    }, [searchParams, navigate]);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const result = await login(values);
            if (result.success) {
                toast.dismiss();
                toast.success("Đăng nhập thành công!");
                const newUser = await fetchUser();
                if (newUser?.role === "ADMIN") {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
                // if (user?.role?.name === "ADMIN") {
                //     navigate("/admin");
                // } else {
                //     navigate("/");
                // }
            } else {
                if(result.code && result.code === "EMAIL_NOT_VERIFIED"){
                    setShowReminderModal(true)
                }
                toast.error(result.error || "Sai tài khoản hoặc mật khẩu");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setSubmitting(false);
            // setShowReminderModal(false)
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`;
    };

    return (
        <>
            <HeaderComponent/>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center
             justify-center py-12 px-4 sm:px-6 lg:px-8">

                {showReminderModal && <EnableAccountModal onClose={() => setShowReminderModal(false)} />}
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        {/*<Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">*/}
                        {/*    <ArrowLeft size={20} className="mr-2" /> Về trang chủ*/}
                        {/*</Link>*/}

                        <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-indigo-500 drop-shadow-lg tracking-wide">
                            TravelGo
                        </div>
                        {/*<div className="text-2xl font-bold text-green-500">TravelGo</div>*/}

                        <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2">
                            Chào mừng trở lại!
                        </h2>
                        <p className="text-gray-600 font-body">
                            Đăng nhập vào tài khoản của bạn để tiếp tục
                        </p>
                    </div>

                    {/* Login Form */}
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <Formik
                            initialValues={initialValues}
                            validationSchema={loginSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ isSubmitting, values, errors, touched }) => (
                                <Form className="space-y-6">
                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                            <Field
                                                id="email"
                                                name="email"
                                                type="email"
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email && touched.email ? "border-red-500" : "border-gray-300"}`}
                                                placeholder="Nhập email của bạn"
                                            />
                                        </div>
                                        <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                            <Field
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password && touched.password ? "border-red-500" : "border-gray-300"}`}
                                                placeholder="Nhập mật khẩu"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
                                    </div>

                                    {/* Remember Me & Forgot Password */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Field id="rememberMe" name="rememberMe" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">Ghi nhớ đăng nhập</label>
                                        </div>
                                        <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">Quên mật khẩu?</Link>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-green-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                                    </button>
                                </Form>
                            )}
                        </Formik>

                        {/* Divider */}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                                </div>
                            </div>

                            {/* Social Login */}
                            <div className="mt-6 grid grid-cols-1 gap-3">
                                <button
                                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    onClick={handleGoogleLogin}
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span className="ml-2">Google</span>
                                </button>
                            </div>
                        </div>

                        {/* Sign Up Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Chưa có tài khoản?{" "}
                                <Link to="/register" className="font-medium text-green-600 hover:text-green-700">Đăng ký ngay</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

export default LoginPage;
