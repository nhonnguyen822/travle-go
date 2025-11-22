import api from "../context/api";

export const createBooking = async (bookingRequest) => {
    try {
        const response = await api.post("/bookings", bookingRequest);
        return response.data; // Booking object từ backend
    } catch (error) {
        throw error;
    }
};

export const getAllBooking = async (bookingRequest) => {
    try {
        const response = await api.get("/bookings");
        return response.data;
    } catch (error) {
        throw error;
    }
};


export const getBookingById = async (id) => {
    try {
        const response = await api.get(`/bookings/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};


export const updateBookingStatus = async (bookingId, status, reason = "") => {
    console.log(bookingId)
    console.log(status)
    console.log(reason)
    try {
        const response = await api.patch(`/bookings/${bookingId}/status`, { status, reason });
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.log(error)
        throw error;
    }
};

export const updateBookingPayment = async (bookingId, paymentData) => {
    console.log(bookingId);
    console.log(paymentData);
    try {
        const response = await api.patch(`/bookings/${bookingId}/payment`, paymentData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const createBookingByAdmin = async (bookingData) => {
    try {
        const response = await api.post("/bookings/admin", bookingData);
        console.log(response.data)
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const globalSearchBookings = async (searchTerm, filters = {}) => {
    try {
        const defaultParams = {
            page: 0,
            size: 10,
            sortBy: "bookingDate",
            sortDirection: "desc"
        };

        const params = {
            ...defaultParams,
            ...filters
        };

        if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
        }

        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.get("/bookings/search", {
            params,
            paramsSerializer: {
                indexes: null
            }
        });

        console.log("✅ Global Search Results:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error in global search:", error);
        throw error;
    }
};

export const updateBookingDetails = async (bookingId, updateData) => {
    try {
        console.log("📝 Updating booking details:", { bookingId, updateData });

        const response = await api.patch(`/bookings/${bookingId}/details`, updateData);

        console.log("✅ Booking details updated successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error updating booking details:", error);

        if (error.response) {
            const errorMessage = error.response.data?.message || error.response.data?.error || "Có lỗi xảy ra khi cập nhật thông tin booking";
            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
            throw new Error("Có lỗi xảy ra khi gửi yêu cầu cập nhật.");
        }
    }
};

export const searchBookings = async (filters = {}) => {
    try {
        // Default values
        const defaultParams = {
            page: 0,
            size: 10,
            sortBy: "bookingDate",
            sortDirection: "desc"
        };

        // Merge filters với defaults
        const params = {
            ...defaultParams,
            ...filters
        };

        // Remove null/undefined/empty string values
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.get("/bookings/filter", { params });
        return response.data;
    } catch (error) {
        console.error("Error searching bookings:", error);
        throw error;
    }
};

export const getBookingStatuses = async () => {
    try {
        const response = await api.get("/bookings/statuses");
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching booking statuses:", error);
        throw error;
    }
};


export const getCancelledBookings = async (filters = {}) => {
    try {
        const params = {
            page: filters.page || 0,
            size: filters.size || 10,
        };

        if (filters.userName && filters.userName.trim() !== '') {
            params.userName = filters.userName.trim();
        }
        if (filters.bookingCode && filters.bookingCode.trim() !== '') {
            params.bookingCode = filters.bookingCode.trim();
        }
        if (filters.tourTitle && filters.tourTitle.trim() !== '') {
            params.tourTitle = filters.tourTitle.trim();
        }

        const queryString = new URLSearchParams(params).toString();
        console.log(queryString)
        const url = `/bookings/cancelled${queryString ? `?${queryString}` : ''}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        if (error.response) {
            const errorMessage = error.response.data?.message || error.response.data?.error || "Không thể tải danh sách booking đã hủy";
            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
            throw new Error("Có lỗi xảy ra khi gửi yêu cầu lấy danh sách booking đã hủy.");
        }
    }
};

export const searchCancelledBookings = async (searchTerm, page = 0, size = 10) => {
    try {
        const params = {
            page: page,
            size: size
        };
        console.log(searchTerm)

        if (searchTerm && searchTerm.trim() !== '') {
            params.search = searchTerm.trim();
        }
        const queryString = new URLSearchParams(params).toString();
        const url = `/bookings/cancelled/search${queryString ? `?${queryString}` : ''}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        if (error.response) {
            const errorMessage = error.response.data?.message || error.response.data?.error || "Không thể tìm kiếm booking đã hủy";
            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
            throw new Error("Có lỗi xảy ra khi gửi yêu cầu tìm kiếm booking đã hủy.");
        }
    }
};