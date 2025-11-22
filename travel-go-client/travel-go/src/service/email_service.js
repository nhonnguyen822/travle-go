import api from "../context/api";
import axios from "axios";

//
export const sendBookingEmail = async (formData) => {
    try {
        const response = await axios.post(
            "http://localhost:8080/api/mail/send-booking", // endpoint backend
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Lỗi gửi email:", error);
        throw error;
    }
};