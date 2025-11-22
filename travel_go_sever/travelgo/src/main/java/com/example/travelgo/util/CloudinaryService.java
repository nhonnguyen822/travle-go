package com.example.travelgo.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {
    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud_name}") String cloudName,
            @Value("${cloudinary.api_key}") String apiKey,
            @Value("${cloudinary.api_secret}") String apiSecret
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    public String uploadImage(File imageFile) throws Exception {
        Map uploadResult = cloudinary.uploader().upload(imageFile, ObjectUtils.emptyMap());
        return uploadResult.get("secure_url").toString();
    }

    public String uploadImageFromUrl(String imageUrl) throws Exception {
        Map uploadResult = cloudinary.uploader().upload(imageUrl, ObjectUtils.emptyMap());
        return uploadResult.get("secure_url").toString();
    }

    public void deleteImageByUrl(String imageUrl) throws Exception {
        // Ví dụ link: https://res.cloudinary.com/demo/image/upload/v1692345678/my_folder/my_image.jpg
        String withoutBase = imageUrl.substring(imageUrl.indexOf("/upload/") + 8);
        // withoutBase = v1692345678/my_folder/my_image.jpg

        // Bỏ phần version (v...) và phần đuôi .jpg/.png...
        String publicId = withoutBase.replaceAll("^v[0-9]+/", "") // remove version
                .replaceAll("\\.[^.]+$", ""); // remove extension

        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }


    public String uploadMultipart(MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return uploadResult.get("secure_url").toString();
    }
}