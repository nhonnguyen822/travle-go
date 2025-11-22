import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const bookingId = searchParams.get("bookingId");
    const success = searchParams.get("success") === "true";

    useEffect(() => {
        if (!bookingId || bookingId.trim() === "") {
            navigate(`/payment-failure?errorCode=INVALID_BOOKING_ID`);
            return;
        }

        const timer = setTimeout(() => {
            if (success) {
                navigate(`/payment-success?bookingId=${bookingId}`);
            } else {
                navigate(`/payment-failure?bookingId=${bookingId}&errorCode=FAILED`);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [bookingId, success, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
            <div className="text-center space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                <p>Đang xử lý thanh toán...</p>
            </div>
        </div>
    );
};

export default PaymentResult;
