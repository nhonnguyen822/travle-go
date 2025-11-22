package com.example.travelgo.util;

import java.net.URL;
import java.util.Base64;

public class ConvertImageUrl {

    public static String convertImageUrlToBase64(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return ""; // Trả về chuỗi rỗng nếu URL null hoặc empty
        }

        try {
            // Kiểm tra nếu là URL hợp lệ
            if (!imageUrl.startsWith("http")) {
                return ""; // Không phải URL hợp lệ
            }

            URL url = new URL(imageUrl);
            byte[] imageBytes = url.openStream().readAllBytes();
            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            return "data:image/jpeg;base64," + base64;

        } catch (Exception e) {
            System.err.println("Lỗi convert image URL: " + imageUrl + " - " + e.getMessage());
            return ""; // Trả về chuỗi rỗng nếu có lỗi
        }
    }

    // Phương thức an toàn hơn với timeout
    public static String convertImageUrlToBase64Safe(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return "";
        }

        try {
            // Kiểm tra URL hợp lệ
            if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
                return "";
            }

            // Thêm timeout để tránh blocking lâu
            URL url = new URL(imageUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000); // 5 seconds
            connection.setReadTimeout(5000); // 5 seconds

            try (java.io.InputStream inputStream = connection.getInputStream()) {
                byte[] imageBytes = inputStream.readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(imageBytes);
                return "data:image/jpeg;base64," + base64;
            }

        } catch (Exception e) {
            System.err.println("Lỗi convert image URL: " + imageUrl + " - " + e.getMessage());
            return "";
        }
    }
}