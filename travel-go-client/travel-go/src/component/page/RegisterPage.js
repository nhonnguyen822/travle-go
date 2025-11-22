import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Eye, EyeOff, Mail, Lock, User} from "lucide-react";
import {Formik, Form, Field, ErrorMessage} from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import {register} from "../../service/authService";
import EnableAccountModal from "../modal/EnableAccountModal";
import HeaderComponent from "../layout/HeaderComponent";
import PasswordStrength from "../../auth/PasswordStrength";

const registerSchema = Yup.object({
    name: Yup.string()
        .min(2, "Tên phải có ít nhất 2 ký tự")
        .max(50, "Tên không được quá 50 ký tự")
        .required("Vui lòng nhập tên"),
    email: Yup.string()
        .email("Email không hợp lệ")
        .required("Vui lòng nhập email"),
    password: Yup.string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .max(100, "Mật khẩu không được quá 100 ký tự")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số"
        )
        .required("Vui lòng nhập mật khẩu"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Mật khẩu xác nhận không khớp")
        .required("Vui lòng xác nhận mật khẩu"),
    agreeToTerms: Yup.boolean()
        .oneOf([true], "Bạn phải đồng ý với điều khoản sử dụng")
        .required("Bạn phải đồng ý với điều khoản sử dụng"),
});

const RegisterPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const navigate = useNavigate();

    const initialValues = {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false,
    };

    const handleSubmit = async (values, {setSubmitting, setFieldError}) => {
        try {
            const userData = {
                name: values.name,
                email: values.email,
                password: values.password,
            };

            const result = await register(userData);
            if (result.success) {
                toast.dismiss();
                toast.success("Kiểm tra email của bạn để xác nhận đăng ký", {duration: 3000});
                setShowReminderModal(true);
            } else {
                if (result.error.includes("Email")) {
                    setFieldError("email", result.error);
                } else {
                    toast.error(result.error || "Đăng ký thất bại");
                }
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`;
    };

    return (
        <>
            <HeaderComponent/>
            <div
                className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                {showReminderModal && <EnableAccountModal onClose={() => setShowReminderModal(false)}/>}
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        {/*<Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">*/}
                        {/*    <ArrowLeft size={20} className="mr-2"/> Về trang chủ*/}
                        {/*</Link>*/}

                        <div
                            className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-indigo-500 drop-shadow-lg tracking-wide">
                            TravelGo
                        </div>

                        <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2">Tạo tài khoản mới</h2>
                        <p className="text-gray-600 font-body">Bắt đầu hành trình khám phá Travel Go</p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <Formik
                            initialValues={initialValues}
                            validationSchema={registerSchema}
                            onSubmit={handleSubmit}
                        >
                            {({isSubmitting, errors, touched, values}) => (
                                <Form className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Họ
                                            và
                                            tên</label>
                                        <div className="relative">
                                            <User
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                size={20}/>
                                            <Field
                                                id="name"
                                                name="name"
                                                type="text"
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name && touched.name ? "border-red-500" : "border-gray-300"}`}
                                                placeholder="Nhập tên của bạn"
                                            />
                                        </div>
                                        <ErrorMessage name="name" component="div"
                                                      className="mt-1 text-sm text-red-600"/>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email"
                                               className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                size={20}/>
                                            <Field
                                                id="email"
                                                name="email"
                                                type="email"
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email && touched.email ? "border-red-500" : "border-gray-300"}`}
                                                placeholder="Nhập email của bạn"
                                            />
                                        </div>
                                        <ErrorMessage name="email" component="div"
                                                      className="mt-1 text-sm text-red-600"/>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label htmlFor="password"
                                               className="block text-sm font-medium text-gray-700 mb-2">Mật
                                            khẩu</label>
                                        <div className="relative">
                                            <Lock
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                size={20}/>
                                            <Field
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password && touched.password ? "border-red-500" : "border-gray-300"}`}
                                                placeholder="Nhập mật khẩu"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                            </button>
                                        </div>
                                        <PasswordStrength password={values.password}
                                                          message={touched.password && errors.password ? errors.password : null}/>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label htmlFor="confirmPassword"
                                               className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật
                                            khẩu</label>
                                        <div className="relative">
                                            <Lock
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                size={20}/>
                                            <Field
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword && touched.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                                                placeholder="Nhập lại mật khẩu"
                                            />
                                            <button type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirmPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                            </button>
                                        </div>
                                        <ErrorMessage name="confirmPassword" component="div"
                                                      className="mt-1 text-sm text-red-600"/>
                                    </div>

                                    {/* Terms */}
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <Field
                                                id="agreeToTerms"
                                                name="agreeToTerms"
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                                                Tôi đồng ý với{" "}
                                                <Link to="/terms" className="text-blue-600 hover:text-blue-700">Điều
                                                    khoản
                                                    sử dụng</Link>{" "}
                                                và{" "}
                                                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Chính
                                                    sách
                                                    bảo mật</Link>
                                            </label>
                                        </div>
                                        <ErrorMessage name="agreeToTerms" component="div"
                                                      className="mt-1 text-sm text-red-600"/>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-green-500 to-indigo-500 text-white py-3 px-4
                                     rounded-lg font-semibold hover:from-green-700 hover:to-indigo-700 transition-all
                                     transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                                     disabled:transform-none"
                                    >
                                        {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                                    </button>

                                    {/* Or login link */}
                                    <p className="text-center text-sm text-gray-600 mt-4">
                                        Bạn đã có tài khoản?{" "}
                                        <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                                            Đăng nhập
                                        </Link>
                                    </p>

                                    {/*/!* Google login button *!/*/}
                                    {/*<div className="mt-6 flex justify-center">*/}
                                    {/*    <button*/}
                                    {/*        type="button"*/}
                                    {/*        onClick={handleGoogleLogin}*/}
                                    {/*        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-100 transition"*/}
                                    {/*    >*/}
                                    {/*        <img src="/images/google-logo.png" alt="Google" className="w-5 h-5"/>*/}
                                    {/*        <span className="text-gray-700 font-medium">Đăng ký bằng Google</span>*/}
                                    {/*    </button>*/}
                                    {/*</div>*/}
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>
        </>

    );
};

export default RegisterPage;

