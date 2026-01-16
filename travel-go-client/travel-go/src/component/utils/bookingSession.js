// utils/bookingSession.js

const BOOKING_SESSION_KEY = 'travelgo_booking_session';

// Lưu session booking khi chuyển đến trang login
export const saveBookingSession = (tourId, scheduleId, bookingData = {}) => {
    const session = {
        tourId,
        scheduleId,
        bookingData,
        timestamp: new Date().toISOString(),
        returnUrl: window.location.pathname + window.location.search
    };

    localStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(session));
    console.log('💾 Đã lưu booking session:', session);
    return session;
};

// Lấy session booking
export const getBookingSession = () => {
    const sessionStr = localStorage.getItem(BOOKING_SESSION_KEY);
    if (!sessionStr) return null;

    try {
        const session = JSON.parse(sessionStr);

        // Kiểm tra session có hết hạn không (24 giờ)
        const sessionTime = new Date(session.timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursDiff = (currentTime - sessionTime) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            clearBookingSession();
            return null;
        }

        console.log('📄 Đọc booking session:', session);
        return session;
    } catch (error) {
        clearBookingSession();
        return null;
    }
};

// Xóa session
export const clearBookingSession = () => {
    localStorage.removeItem(BOOKING_SESSION_KEY);
    console.log('🗑️ Đã xóa booking session');
};

// Kiểm tra có session booking đang chờ không
export const hasPendingBooking = () => {
    return getBookingSession() !== null;
};

// Tạo URL để redirect về booking với state
export const getBookingRedirectUrl = () => {
    const session = getBookingSession();
    if (!session) return null;

    return {
        path: `/tour/${session.tourId}/booking/${session.scheduleId}`,
        state: {
            restoreBooking: true,
            bookingData: session.bookingData
        }
    };
};