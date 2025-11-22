import './App.css';
import {Route, Routes} from "react-router-dom";
import HomePage from "./component/page/HomePage";
import TourDetailPage from "./component/page/TourDetailPage";
import TourListByRegionPage from "./component/page/TourListByRegionPage";

import TourBookingPage from "./component/page/TourBookingPage";
import {Toaster} from "react-hot-toast";
import RegisterPage from "./component/page/RegisterPage";
import LoginPage from "./component/page/LoginPage";
import {AuthProvider, useAuth} from "./context/AuthContext";
import VerifyEmail from "./component/form/VerifyEmail";
import BlogPage from "./component/page/BlogPage";
import ContactPage from "./component/page/ContactPage";
import BlogDetailPage from "./component/page/BlogDetailPage";
import PaymentResult from "./component/page/PaymentResult";
import PaymentFailure from "./component/modal/PaymentFailure";
import PaymentSuccess from "./component/modal/PaymentSuccess";
import TourPage from "./component/page/TourPage";

import AdminBookingList from "./component/admin/booking/AdminBookingList";


import {AdminNotificationProvider} from "./context/AdminNotificationContext";
import OAuth2Success from "./auth/OAuth2Success";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminTourList from "./component/admin/tour/AdminTourList";
import AdminDashboardComponent from "./component/admin/dashboad/AdminDashboardComponent";
import AdminTourDetail from "./component/admin/tour/AdminTourDetail";
import AdminTourUpdate from "./component/admin/tour/AdminTourUpdate";
import AdminCreateBookingModal from "./component/admin/booking/AdminCreateBookingModal";
import DeletedBookingsComponent from "./component/admin/booking/DeletedBookingsComponent";
import AdminCustomerManagement from "./component/admin/customer/AdminCustomerManagement";
import AdminRevenueDashboard from "./component/admin/revenue/AdminRevenueDashboard";
import MonthlyRevenueChart from "./component/admin/revenue/MonthlyRevenueChart";
import AdminTourCreate from "./component/admin/tour/AdminTourCreate";
import {UserNotificationProvider} from "./component/admin/customer/UserNotificationContext";

// ✅ Component wrapper để chọn Notification Provider dựa trên role
const NotificationProviderWrapper = ({ children }) => {
    const { user } = useAuth();
    if (user?.role === 'ADMIN') {
        return (
            <AdminNotificationProvider>
                {children}
            </AdminNotificationProvider>
        );
    }

    // ✅ Mặc định dùng UserNotificationProvider cho tất cả user khác
    return (
        <UserNotificationProvider>
            {children}
        </UserNotificationProvider>
    );
};

// ✅ Main App Component
function App() {
    return (
        <div className="App">
            <AuthProvider>
                {/* ✅ Dùng wrapper để chọn đúng Notification Provider */}
                <NotificationProviderWrapper>
                    <Routes>
                        {/* Public Routes */}
                        <Route path={"/"} element={<HomePage/>}/>
                        <Route path={"/tours/:id"} element={<TourDetailPage/>}/>
                        <Route path="/booking/:tourId/:scheduleId" element={<TourBookingPage/>}/>
                        <Route path={"/tours"} element={<TourPage/>}/>
                        <Route path={"blog"} element={<BlogPage/>}/>
                        <Route path="/blog/:id" element={<BlogDetailPage/>}/>
                        <Route path={"contact"} element={<ContactPage/>}/>
                        <Route path="/tours/region/:regionId" element={<TourListByRegionPage/>}/>

                        {/* Auth Routes */}
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/register" element={<RegisterPage/>}/>
                        <Route path="/verification" element={<VerifyEmail/>}/>

                        {/* Payment Routes */}
                        <Route path="/payment-result" element={<PaymentResult/>}/>
                        <Route path="/payment-success" element={<PaymentSuccess/>}/>
                        <Route path="/payment-failure" element={<PaymentFailure/>}/>
                        <Route path="/oauth2/success" element={<OAuth2Success/>}/>

                        {/* ✅ Admin Routes - Sử dụng AdminNotificationProvider */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminDashboardComponent />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/tours"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminTourList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/tours/:id"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminTourDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/tours/edit/:id"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminTourUpdate />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/bookings"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminBookingList />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/bookings/create"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminCreateBookingModal />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/bookings/cancelled"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <DeletedBookingsComponent />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/customers"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminCustomerManagement />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/revenue"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminRevenueDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin/revenue/monthly"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <MonthlyRevenueChart />
                                </ProtectedRoute>
                            }
                        />

                        {/*<Route*/}
                        {/*    path="/admin/contacts"*/}
                        {/*    element={*/}
                        {/*        <ProtectedRoute role="ADMIN">*/}
                        {/*            <AdminContacts />*/}
                        {/*        </ProtectedRoute>*/}
                        {/*    }*/}
                        {/*/>*/}

                        {/*<Route*/}
                        {/*    path="/admin/email"*/}
                        {/*    element={*/}
                        {/*        <ProtectedRoute role="ADMIN">*/}
                        {/*            <AdminEmail />*/}
                        {/*        </ProtectedRoute>*/}
                        {/*    }*/}
                        {/*/>*/}

                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminCustomerManagement />
                                </ProtectedRoute>
                            }
                        />

                        {/*<Route*/}
                        {/*    path="/admin/reports"*/}
                        {/*    element={*/}
                        {/*        <ProtectedRoute role="ADMIN">*/}
                        {/*            <AdminReportsComponent />*/}
                        {/*        </ProtectedRoute>*/}
                        {/*    }*/}
                        {/*/>*/}

                        <Route
                            path="/admin/tours/create"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminTourCreate />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminDashboardComponent />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>

                    <Toaster
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        pauseOnHover
                        draggable
                        theme="colored"
                    />
                </NotificationProviderWrapper>
            </AuthProvider>
        </div>
    );
}

export default App;