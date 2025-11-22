import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {ErrorMessage, Field, FieldArray, Form, Formik} from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import {CheckCircle, PlusCircle, Trash2, UploadCloud} from "lucide-react";
import "react-tooltip/dist/react-tooltip.css";
import AutoGenerateItineraryDays from "./AutoGenerateItineraryDays";
import {uploadImage} from "../../../service/upload_service";
import AdminLayout from "../layout/AdminLayout";
import {getAllRegions} from "../../../service/region_service";
import {findTourById, updateTour} from "../../../service/tour_service";

const AdminTourUpdate = () => {
    const navigate = useNavigate();
    const {id} = useParams();
    const [tourData, setTourData] = useState(null);
    const [regions, setRegions] = useState([]);
    const [preview, setPreview] = useState(null);
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchRegions = async () => {
            const res = await getAllRegions();
            setRegions(res);
        };
        fetchRegions();
    }, []);


    // Load tour + schedules
    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const tourData = await findTourById(id);
                console.log(tourData)
                setTourData(tourData || {});
            } catch (err) {
                console.error("❌ Lỗi khi tải tour:", err);
            }
        };
        fetchData();
    }, [id]);

    if (!tourData) return (
        <AdminLayout>
            <div className="flex justify-center items-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin tour...</p>
                </div>
            </div>
        </AdminLayout>
    );

    const initialValues = {
        title: tourData.name || "",
        destination: tourData.destination || "",
        duration: tourData.durationDays || 1,
        basePrice: tourData.basePrice || 0,
        description: tourData.description || "",
        highLight: tourData.highLight || "",
        status: tourData.status || "ACTIVE",
        regionId: tourData.regionId || "",

        // Ảnh đại diện (cover)
        image: undefined, // file mới
        imageUrl: tourData.image || "", // URL ảnh cũ

        // Bộ ảnh gallery
        images: tourData.images?.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
        })) || [],
        newImages: [], // file ảnh mới upload thêm

        // Lịch trình
        itineraryDays: tourData.itineraryDays?.map(day => ({
            id: day.id,
            dayIndex: day.dayIndex,
            title: day.title,
            description: day.description,
            activities: day.activities.map(act => ({
                id: act.id,
                time: act.time,
                title: act.title,
                details: act.details,
                imageFile: null,
                imageUrl: act.imageUrl || "",
                position: act.position,
            })),
        })) || [
            {
                dayIndex: 1,
                title: "",
                description: "",
                activities: [
                    { time: "", title: "", details: "", imageFile: null, imageUrl: "", position: 1 },
                ],
            },
        ],

        // Dịch vụ & chính sách
        services: tourData.services || [{ name: "", type: "INCLUDED" }],
    };


    const validationSchemas = [
        // Step 1
        Yup.object({
            title: Yup.string()
                .required("Tiêu đề tour không được để trống")
                .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
                .max(200, "Tiêu đề không được vượt quá 200 ký tự"),

            destination: Yup.string()
                .required("Điểm đến không được để trống")
                .min(3, "Điểm đến phải có ít nhất 3 ký tự")
                .max(50, "Điểm đến không được vượt quá 50 ký tự"),

            duration: Yup.number()
                .typeError("Thời lượng phải là số nguyên")
                .integer("Thời lượng phải là số nguyên")
                .min(1, "Thời lượng tối thiểu là 1 ngày")
                .max(60, "Thời lượng không được vượt quá 60 ngày")
                .required("Thời lượng không được để trống"),

            basePrice: Yup.number()
                .typeError("Giá phải là số")
                .required("Giá cơ bản không được để trống")
                .positive("Giá phải lớn hơn 0")
                .max(100000000, "Giá không được vượt quá 100 triệu"),

            regionId: Yup.string()
                .required("Vui lòng chọn khu vực"),
        }),
        // Step 2
        // Step 2: Description & Images
        Yup.object({
            description: Yup.string()
                .required("Mô tả không được để trống")
                .min(20, "Mô tả cần ít nhất 20 ký tự")
                .max(2000, "Mô tả không được vượt quá 2000 ký tự"),

            highLight: Yup.string()
                .required("Điểm nổi bật không được để trống")
                .min(10, "Điểm nổi bật cần ít nhất 10 ký tự")
                .max(1000, "Điểm nổi bật không được vượt quá 1000 ký tự"),

            // Ảnh cover
            image: Yup.mixed()
                .test(
                    "required-cover",
                    "Vui lòng chọn ảnh cover cho tour",
                    function (value) {
                        const { imageUrl } = this.parent; // ảnh cũ
                        return value || (imageUrl && imageUrl !== "");
                    }
                )
                .test(
                    "fileType",
                    "Chỉ chấp nhận định dạng ảnh (jpg, jpeg, png, webp)",
                    (value) => {
                        if (!value) return true; // bỏ qua nếu dùng ảnh cũ
                        return value instanceof File
                            ? ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(value.type)
                            : true;
                    }
                )
                .test(
                    "fileSize",
                    "Dung lượng ảnh không vượt quá 3MB",
                    (value) => {
                        if (!value) return true;
                        return value instanceof File ? value.size <= 3 * 1024 * 1024 : true;
                    }
                ),

            // Ảnh phụ (Gallery)
            newImages: Yup.array()
                .of(
                    Yup.mixed()
                        .test(
                            "fileType",
                            "Chỉ chấp nhận định dạng ảnh (jpg, jpeg, png, webp)",
                            (value) => !value || (value instanceof File && ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(value.type)) || !(value instanceof File)
                        )
                        .test(
                            "fileSize",
                            "Mỗi ảnh phụ không được vượt quá 3MB",
                            (value) => !value || (value instanceof File ? value.size <= 3 * 1024 * 1024 : true)
                        )
                )
                .test(
                    "min-images",
                    "Vui lòng chọn ít nhất 1 ảnh phụ",
                    function (value) {
                        const { images } = this.parent; // ảnh cũ từ DB
                        const total = (value?.length || 0) + (images?.length || 0);
                        return total > 0;
                    }
                )
                .max(5, "Tối đa 5 ảnh phụ"),
        }),

        // Step 3
        Yup.object({
            itineraryDays: Yup.array()
                .of(
                    Yup.object({
                        title: Yup.string()
                            .required("Tiêu đề ngày không được để trống")
                            .min(5, "Tiêu đề ngày phải có ít nhất 5 ký tự")
                            .max(300, "Tiêu đề ngày không được vượt quá 200 ký tự"),

                        description: Yup.string()
                            .required("Mô tả ngày không được để trống")
                            .min(15, "Mô tả ngày phải có ít nhất 15 ký tự")
                            .max(1000, "Mô tả ngày không được vượt quá 1000 ký tự"),

                        activities: Yup.array()
                            .of(
                                Yup.object({
                                    time: Yup.string()
                                        .required("Thời gian không được để trống")
                                        .matches(
                                            /^([01]\d|2[0-3]):([0-5]\d)$/,
                                            "Thời gian phải có định dạng HH:mm hợp lệ (ví dụ: 08:30)"
                                        ),
                                    title: Yup.string()
                                        .required("Tiêu đề hoạt động không được để trống")
                                        .min(5, "Tiêu đề hoạt động phải ít nhất 5 ký tự")
                                        .max(200, "Tiêu đề hoạt động không vượt quá 200 ký tự"),
                                    details: Yup.string()
                                        .required("Chi tiết không được để trống")
                                        .min(15, "Chi tiết hoạt động phải ít nhất 15 ký tự")
                                        .max(1000, "Chi tiết hoạt động không vượt quá 1000 ký tự"),
                                    imageFile: Yup.mixed()
                                        .nullable()
                                        .test(
                                            "fileSize",
                                            "Dung lượng ảnh không vượt quá 2MB",
                                            (file) => !file || file.size <= 2 * 1024 * 1024
                                        ),
                                })
                            )
                            .min(1, "Mỗi ngày phải có ít nhất 1 hoạt động")
                            .max(10, "Một ngày không nên có quá 10 hoạt động"),
                    })
                )
                .min(1, "Phải có ít nhất 1 ngày trong lịch trình")

                // ✅ Giới hạn số ngày theo duration ở Step 1
                .test(
                    "max-days",
                    "Số ngày trong lịch trình không được vượt quá thời lượng tour đã nhập",
                    function (value) {
                        const {parent, options} = this;
                        const duration = options?.context?.duration; // lấy duration từ Step 1
                        return !duration || !value || value.length <= duration;
                    }
                )

                .max(60, "Lịch trình không nên vượt quá 60 ngày"),
        }),

        // Step 4
        Yup.object({
            services: Yup.array()
                .of(
                    Yup.object({
                        name: Yup.string()
                            .required("Tên dịch vụ không được để trống")
                            .trim("Không được chỉ nhập khoảng trắng")
                            .min(3, "Tên dịch vụ phải có ít nhất 3 ký tự")
                            .max(100, "Tên dịch vụ không được vượt quá 100 ký tự")
                        ,
                        type: Yup.string()
                            .oneOf(["INCLUDED", "EXCLUDED"], "Loại dịch vụ không hợp lệ")
                            .required("Vui lòng chọn loại dịch vụ"),
                    })
                )
                .min(1, "Phải có ít nhất 1 dịch vụ")
                .max(20, "Không nên có quá 20 dịch vụ")
                .test("unique-service-name", "Tên dịch vụ không được trùng lặp", (services) => {
                    if (!services) return true;
                    const names = services.map((s) => s.name?.trim().toLowerCase());
                    return new Set(names).size === names.length;
                }),
        }),
    ];

    const handleSubmit = async (values, { setSubmitting }) => {
        setIsProcessing(true);
        const toastId = toast.loading("⏳ Đang cập nhật tour...");

        try {
            // --- 1️⃣ Ảnh đại diện (Cover) ---
            let coverUrl = values.imageUrl || null;
            if (values.image) {
                const isNewCover =
                    !values.imageUrl ||
                    values.image.name !== values.imageUrl.split("/").pop();
                if (isNewCover) {
                    coverUrl = await uploadImage(values.image);
                }
            }

            // --- 2️⃣ Ảnh gallery ---
            const gallery = [];

            // (a) Giữ lại ảnh cũ (có id)
            for (const img of values.images || []) {
                if (img.id && img.imageUrl) {
                    gallery.push({ id: img.id, imageUrl: img.imageUrl });
                }
            }

            // (b) Upload ảnh mới
            if (values.newImages?.length > 0) {
                for (const file of values.newImages) {
                    const url = await uploadImage(file);
                    gallery.push({ imageUrl: url });
                }
            }

            // --- 3️⃣ Lịch trình & hoạt động ---
            const itineraryDays = await Promise.all(
                values.itineraryDays.map(async (day, index) => {
                    const dayIndex = index + 1;

                    const activities = await Promise.all(
                        day.activities.map(async (act) => {
                            let imageUrl = act.imageUrl || null;

                            // Nếu người dùng upload ảnh mới cho Activity
                            if (act.imageFile) {
                                const isNewImage =
                                    !act.imageUrl ||
                                    act.imageFile.name !== act.imageUrl.split("/").pop();
                                if (isNewImage) {
                                    imageUrl = await uploadImage(act.imageFile);
                                }
                            }

                            // ✅ Bổ sung id của Activity vào đây
                            return {
                                id: act.id || null, // 👈 thêm dòng này
                                time: act.time,
                                title: act.title,
                                details: act.details,
                                position: act.position,
                                imageUrl,
                            };
                        })
                    );

                    return {
                        id: day.id || null,
                        dayIndex,
                        title: day.title,
                        description: day.description,
                        activities,
                    };
                })
            );

            // --- 4️⃣ Chuẩn bị dữ liệu gửi lên server ---
            const tourData = {
                title: values.title,
                destination: values.destination,
                duration: values.duration,
                basePrice: values.basePrice,
                description: values.description,
                highLight: values.highLight,
                regionId: values.regionId,
                status: values.status,
                image: coverUrl,
                images: gallery,
                itineraryDays,
                services: values.services,
            };

            // --- 5️⃣ Gửi request cập nhật tour ---
            await updateTour(id, tourData);

            toast.success("🎉 Tour đã được cập nhật thành công!", { id: toastId });
            navigate("/admin/tours");
        } catch (error) {
            console.error(error);
            toast.error("❌ Có lỗi xảy ra khi cập nhật tour!", { id: toastId });
        } finally {
            setIsProcessing(false);
            setSubmitting(false);
        }
    };


    const steps = [
        "Thông tin cơ bản",
        "Mô tả & Ảnh",
        "Lịch trình",
        "Dịch vụ & Chính sách",
    ];

    return (
        <AdminLayout
            children={
                <div className="bg-gray-50 min-h-screen p-8">
                    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-8">
                        <h2 className="text-3xl font-bold text-center text-green-700 mb-8">
                            ✨ Cập nhật Tour Du Lịch
                        </h2>

                        {/* Thanh tiến trình */}
                        <div className="flex justify-between mb-10">
                            {steps.map((label, index) => (
                                <div key={index} className="flex flex-col items-center w-full relative">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200 ${
                                            index + 1 <= step
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                    >
                                        {index + 1 < step ? <CheckCircle size={22}/> : index + 1}
                                    </div>
                                    <p
                                        className={`text-sm mt-2 ${
                                            index + 1 <= step ? "text-green-600 font-medium" : "text-gray-400"
                                        }`}
                                    >
                                        {label}
                                    </p>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`absolute top-5 left-[60%] w-full h-0.5 transition-all duration-200 ${
                                                index + 1 < step ? "bg-green-600" : "bg-gray-200"
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Form */}

                        {isProcessing ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500 mb-3 transition-all duration-200"></div>
                                <p>Hệ thống đang cập nhật tour, bạn có thể làm việc khác...</p>
                            </div>
                        ) : (<Formik
                            enableReinitialize
                            initialValues={initialValues}
                            validationSchema={validationSchemas[step - 1]}
                            onSubmit={(values, actions) => {
                                if (step < 5) {
                                    setStep(step + 1);
                                    actions.setTouched({});
                                    actions.setSubmitting(false);
                                } else {
                                    handleSubmit(values, actions);
                                }
                            }}
                        >
                            {({values, setFieldValue, isSubmitting}) => (
                                <Form className="space-y-6">
                                    <AutoGenerateItineraryDays/>
                                    <div className="bg-green-50 rounded-2xl p-6 border border-green-100 transition-all duration-200">
                                        {/* STEP 1: Thông tin cơ bản */}
                                        {step === 1 && (
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block mb-1 font-medium text-gray-700">Tiêu đề
                                                        tour</label>
                                                    <Field
                                                        type="text"
                                                        name="title"
                                                        className="w-full border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                    <ErrorMessage name="title" component="div"
                                                                  className="text-red-500 text-sm mt-1"/>
                                                </div>
                                                <div>
                                                    <label className="block mb-1 font-medium text-gray-700">Điểm
                                                        đến</label>
                                                    <Field
                                                        type="text"
                                                        name="destination"
                                                        className="w-full border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                    <ErrorMessage name="destination" component="div"
                                                                  className="text-red-500 text-sm mt-1"/>
                                                </div>
                                                <div>
                                                    <label className="block mb-1 font-medium text-gray-700">Thời lượng
                                                        (số ngày)</label>
                                                    <Field
                                                        type="number"
                                                        name="duration"
                                                        min="1"
                                                        placeholder="Nhập số ngày (VD: 3)"
                                                        className="w-full border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                    <ErrorMessage
                                                        name="duration"
                                                        component="div"
                                                        className="text-red-500 text-sm mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 font-medium text-gray-700">Giá cơ
                                                        bản</label>
                                                    <Field
                                                        type="text"
                                                        name="basePrice"
                                                        className="w-full border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                    <ErrorMessage name="basePrice" component="div"
                                                                  className="text-red-500 text-sm mt-1"/>
                                                </div>
                                                <div>
                                                    <label className="block mb-1 font-medium text-gray-700">Khu
                                                        vực</label>
                                                    <Field
                                                        as="select"
                                                        name="regionId"
                                                        className="w-full border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    >
                                                        <option value="">-- Chọn khu vực --</option>
                                                        {regions.map((r) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.name}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="regionId" component="div"
                                                                  className="text-red-500 text-sm mt-1"/>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2: Mô tả & Ảnh */}
                                        {step === 2 && (
                                            <div
                                                className="space-y-8 bg-green-50 p-6 rounded-2xl shadow-sm border border-green-100 transition-all duration-200">

                                                {/* Mô tả */}
                                                <div>
                                                    <label
                                                        className="block text-gray-800 font-semibold mb-2 flex items-center gap-2">
                                                        📝 <span>Mô tả</span>
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="description"
                                                        rows={4}
                                                        className="w-full rounded-2xl border-gray-300 focus:border-green-400 focus:ring focus:ring-green-100 text-gray-700 p-3 shadow-sm resize-none transition-all duration-200"
                                                        placeholder="Nhập mô tả tổng quan về tour..."
                                                    />
                                                    <ErrorMessage name="description" component="div"
                                                                  className="text-red-500 text-sm mt-1"/>
                                                </div>

                                                {/* Điểm nổi bật */}
                                                <div>
                                                    <label
                                                        className="block text-gray-800 font-semibold mb-2 flex items-center gap-2">
                                                        🌟 <span>Điểm nổi bật</span>
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="highLight"
                                                        rows={3}
                                                        className="w-full rounded-2xl border-gray-300 focus:border-green-400 focus:ring focus:ring-green-100 text-gray-700 p-3 shadow-sm resize-none transition-all duration-200"
                                                        placeholder="Những điểm hấp dẫn hoặc đặc biệt của tour..."
                                                    />
                                                    <ErrorMessage name="highLight" component="div"
                                                                  className="text-red-500 text-sm mt-1"/>
                                                </div>

                                                {/* Ảnh Cover */}
                                                <div>
                                                    <label
                                                        className="block text-gray-800 font-semibold mb-3 flex items-center gap-2">
                                                        📸 <span>Ảnh Cover</span>
                                                    </label>
                                                    <div className="w-full flex justify-center">
                                                        <label
                                                            className="relative flex flex-col items-center justify-center w-full max-w-lg h-56 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all duration-200">
                                                            {(preview || values.imageUrl) ? (
                                                                <>
                                                                    <img
                                                                        src={preview || values.imageUrl}
                                                                        alt="Cover Preview"
                                                                        className="w-full h-full object-cover rounded-2xl shadow-sm"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setPreview(null);
                                                                            setFieldValue("image", null);
                                                                            setFieldValue("imageUrl", null); // xóa ảnh cũ nếu muốn
                                                                        }}
                                                                        className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow transition-all duration-200"
                                                                        title="Xóa ảnh"
                                                                    >
                                                                        <Trash2 size={14}/>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div
                                                                    className="flex flex-col items-center justify-center text-gray-400">
                                                                    <UploadCloud size={32}/>
                                                                    <span
                                                                        className="text-sm mt-2">Chọn ảnh cover...</span>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setFieldValue("image", file);
                                                                        setPreview(URL.createObjectURL(file));
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                    <ErrorMessage name="image" component="div"
                                                                  className="text-red-500 text-sm mt-2 text-center"/>
                                                </div>

                                                {/* Ảnh phụ (Gallery) */}
                                                <div>
                                                    <label className="block text-gray-800 font-semibold mb-3 flex items-center gap-2">
                                                        🖼️ <span>Ảnh phụ (Tour Gallery)</span>
                                                    </label>

                                                    <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-white/40 transition-all duration-200">
                                                        <div className="flex flex-wrap gap-4">

                                                            {/* 1️⃣ Ảnh cũ từ DB */}
                                                            {values.images?.map((img, idx) => (
                                                                <div
                                                                    key={`old-${idx}`}
                                                                    className="relative w-32 h-24 border-2 border-gray-200 rounded-2xl overflow-hidden group shadow-sm hover:border-green-300 transition-all duration-200"
                                                                >
                                                                    <img
                                                                        src={img.imageUrl}
                                                                        alt={`gallery-old-${idx}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = values.images.filter((_, i) => i !== idx);
                                                                            setFieldValue("images", updated); // xóa ảnh cũ
                                                                        }}
                                                                        className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                                        title="Xóa ảnh"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* 2️⃣ Ảnh mới (File upload) */}
                                                            {values.newImages?.map((file, idx) => (
                                                                <div
                                                                    key={`new-${idx}`}
                                                                    className="relative w-32 h-24 border-2 border-gray-200 rounded-2xl overflow-hidden group shadow-sm hover:border-green-300 transition-all duration-200"
                                                                >
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt={`gallery-new-${idx}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = values.newImages.filter((_, i) => i !== idx);
                                                                            setFieldValue("newImages", updated); // xóa file mới
                                                                        }}
                                                                        className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                                        title="Xóa ảnh"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* 3️⃣ Nút thêm ảnh mới */}
                                                            <label
                                                                className="flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-400 hover:bg-green-50 text-gray-400 transition-all duration-200"
                                                            >
                                                                <UploadCloud size={22} />
                                                                <span className="text-xs mt-1">Thêm ảnh</span>
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    hidden
                                                                    onChange={(e) => {
                                                                        const files = Array.from(e.target.files);
                                                                        setFieldValue("newImages", [
                                                                            ...(values.newImages || []),
                                                                            ...files
                                                                        ]);
                                                                    }}
                                                                />
                                                            </label>

                                                        </div>
                                                    </div>
                                                    <ErrorMessage
                                                        name="images"
                                                        component="div"
                                                        className="text-red-500 text-sm mt-2"
                                                    />
                                                </div>
                                            </div>
                                        )}


                                        {/* STEP 3: Lịch trình */}
                                        {/* STEP 3: Lịch trình */}
                                        {step === 3 && (
                                            <FieldArray name="itineraryDays">
                                                {({ remove: removeDay, push: pushDay }) => (
                                                    <div className="space-y-6">
                                                        {values.itineraryDays.map((day, dayIndex) => (
                                                            <div key={dayIndex} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                                                                {/* Day Header */}
                                                                <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                                                {dayIndex + 1}
                                                                            </div>
                                                                            <h3 className="text-lg font-bold text-gray-800">Ngày {dayIndex + 1}</h3>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeDay(dayIndex)}
                                                                            className="w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-colors duration-200"
                                                                            title="Xóa ngày này"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Day Content */}
                                                                <div className="p-6 space-y-6">
                                                                    {/* Day Title & Description */}
                                                                    <div className="grid grid-cols-1 gap-4">
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                                Tiêu đề ngày *
                                                                            </label>
                                                                            <Field
                                                                                type="text"
                                                                                name={`itineraryDays[${dayIndex}].title`}
                                                                                placeholder="Ví dụ: Khám phá Hạ Long - Vịnh di sản thế giới"
                                                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                                            />
                                                                            <ErrorMessage
                                                                                name={`itineraryDays[${dayIndex}].title`}
                                                                                component="div"
                                                                                className="text-red-500 text-sm mt-1"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                                Mô tả tổng quan
                                                                            </label>
                                                                            <Field
                                                                                as="textarea"
                                                                                name={`itineraryDays[${dayIndex}].description`}
                                                                                rows="3"
                                                                                placeholder="Mô tả chi tiết về hành trình trong ngày..."
                                                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-vertical"
                                                                            />
                                                                            <ErrorMessage
                                                                                name={`itineraryDays[${dayIndex}].description`}
                                                                                component="div"
                                                                                className="text-red-500 text-sm mt-1"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Activities Section */}
                                                                    <div className="border-t pt-6">
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <h4 className="text-lg font-semibold text-gray-800">Các hoạt động trong ngày</h4>
                                                                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {day.activities.length} hoạt động
                                    </span>
                                                                        </div>

                                                                        <FieldArray name={`itineraryDays[${dayIndex}].activities`}>
                                                                            {({ remove: removeAct, push: pushAct }) => (
                                                                                <div className="space-y-4">
                                                                                    {day.activities.map((act, actIndex) => (
                                                                                        <div key={actIndex} className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                                                                                            {/* Activity Header */}
                                                                                            <div className="flex justify-between items-center mb-4">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                                                                        {actIndex + 1}
                                                                                                    </div>
                                                                                                    <span className="font-medium text-gray-700">Hoạt động {actIndex + 1}</span>
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => removeAct(actIndex)}
                                                                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                                                                                                >
                                                                                                    <Trash2 size={14} />
                                                                                                    Xóa
                                                                                                </button>
                                                                                            </div>

                                                                                            {/* Activity Form - Grid Layout */}
                                                                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                                                                {/* Time - Full width on mobile, 3 cols on desktop */}
                                                                                                <div className="md:col-span-3">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                                                        Thời gian *
                                                                                                    </label>
                                                                                                    <Field
                                                                                                        type="time"
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].time`}
                                                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                                                                    />
                                                                                                    <ErrorMessage
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].time`}
                                                                                                        component="div"
                                                                                                        className="text-red-500 text-sm mt-1"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Activity Title - Full width on mobile, 9 cols on desktop */}
                                                                                                <div className="md:col-span-9">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                                                        Tiêu đề hoạt động *
                                                                                                    </label>
                                                                                                    <Field
                                                                                                        type="text"
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].title`}
                                                                                                        placeholder="Ví dụ: Tham quan Vịnh Hạ Long"
                                                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                                                                    />
                                                                                                    <ErrorMessage
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].title`}
                                                                                                        component="div"
                                                                                                        className="text-red-500 text-sm mt-1"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Activity Details - Full width */}
                                                                                                <div className="md:col-span-12">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                                                        Chi tiết hoạt động
                                                                                                    </label>
                                                                                                    <Field
                                                                                                        as="textarea"
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].details`}
                                                                                                        rows="3"
                                                                                                        placeholder="Mô tả chi tiết về hoạt động..."
                                                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-vertical"
                                                                                                    />
                                                                                                    <ErrorMessage
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].details`}
                                                                                                        component="div"
                                                                                                        className="text-red-500 text-sm mt-1"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Activity Image - Full width */}
                                                                                                <div className="md:col-span-12">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                                                                                        Hình ảnh hoạt động
                                                                                                    </label>
                                                                                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                                                                        {/* Image Upload Area */}
                                                                                                        <div className="flex-shrink-0">
                                                                                                            <label className="block w-40 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all duration-200 overflow-hidden">
                                                                                                                {(act.imageFile || act.imageUrl) ? (
                                                                                                                    <div className="relative w-full h-full">
                                                                                                                        <img
                                                                                                                            src={act.imageFile ? URL.createObjectURL(act.imageFile) : act.imageUrl}
                                                                                                                            alt="activity"
                                                                                                                            className="w-full h-full object-cover"
                                                                                                                        />
                                                                                                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
                                                                                                                    </div>
                                                                                                                ) : (
                                                                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                                                                                        <UploadCloud size={24} className="mb-2" />
                                                                                                                        <span className="text-sm text-center px-2">Chọn ảnh</span>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    accept="image/*"
                                                                                                                    hidden
                                                                                                                    onChange={(e) => {
                                                                                                                        const file = e.target.files[0];
                                                                                                                        if (file) {
                                                                                                                            setFieldValue(
                                                                                                                                `itineraryDays[${dayIndex}].activities[${actIndex}].imageFile`,
                                                                                                                                file
                                                                                                                            );
                                                                                                                        }
                                                                                                                    }}
                                                                                                                />
                                                                                                            </label>
                                                                                                        </div>

                                                                                                        {/* Image Info & Actions */}
                                                                                                        <div className="flex-1">
                                                                                                            <p className="text-sm text-gray-600 mb-3">
                                                                                                                Tải lên hình ảnh minh họa cho hoạt động
                                                                                                            </p>
                                                                                                            {(act.imageFile || act.imageUrl) && (
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() => {
                                                                                                                        setFieldValue(
                                                                                                                            `itineraryDays[${dayIndex}].activities[${actIndex}].imageFile`,
                                                                                                                            null
                                                                                                                        );
                                                                                                                        setFieldValue(
                                                                                                                            `itineraryDays[${dayIndex}].activities[${actIndex}].imageUrl`,
                                                                                                                            null
                                                                                                                        );
                                                                                                                    }}
                                                                                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                                                                                                                >
                                                                                                                    <Trash2 size={14} />
                                                                                                                    Xóa ảnh
                                                                                                                </button>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <ErrorMessage
                                                                                                        name={`itineraryDays[${dayIndex}].activities[${actIndex}].imageFile`}
                                                                                                        component="div"
                                                                                                        className="text-red-500 text-sm mt-1"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}

                                                                                    {/* Add Activity Button */}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            pushAct({
                                                                                                time: "",
                                                                                                title: "",
                                                                                                details: "",
                                                                                                imageFile: null,
                                                                                                imageUrl: "",
                                                                                            })
                                                                                        }
                                                                                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                                                                                    >
                                                                                        <PlusCircle size={20} />
                                                                                        Thêm hoạt động mới
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </FieldArray>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Add New Day */}
                                                        <div className="text-center">
                                                            {values.itineraryDays.length < values.duration ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        pushDay({
                                                                            title: "",
                                                                            description: "",
                                                                            activities: [
                                                                                {
                                                                                    time: "",
                                                                                    title: "",
                                                                                    details: "",
                                                                                    imageFile: null,
                                                                                    imageUrl: ""
                                                                                },
                                                                            ],
                                                                        })
                                                                    }
                                                                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                >
                                                                    <PlusCircle size={18} />
                                                                    Thêm ngày mới ({values.itineraryDays.length}/{values.duration})
                                                                </button>
                                                            ) : (
                                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                                    <p className="text-yellow-700 text-sm font-medium">
                                                                        ⚠️ Đã đạt tối đa {values.duration} ngày theo thời lượng tour
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </FieldArray>
                                        )}

                                        {/* STEP 4: Dịch vụ */}
                                        {step === 4 && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                                                    🧾 <span>Dịch vụ Tour</span>
                                                </h3>

                                                <FieldArray name="services">
                                                    {({ remove, push }) => (
                                                        <div className="bg-green-50 p-5 rounded-2xl shadow-sm border border-green-100 transition-all duration-200">
                                                            <h4 className="font-semibold text-green-600 mb-3">Danh sách dịch vụ</h4>

                                                            {values.services.length > 0 ? (
                                                                values.services.map((s, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="flex items-center gap-3 mb-3 bg-white rounded-2xl p-3 border border-gray-200 transition-all duration-200"
                                                                    >
                                                                        <div className="flex-1">
                                                                            <Field
                                                                                name={`services[${i}].name`}
                                                                                className="border rounded-2xl px-3 py-2 w-full focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
                                                                                placeholder="Tên dịch vụ"
                                                                            />
                                                                            <ErrorMessage
                                                                                name={`services[${i}].name`}
                                                                                component="div"
                                                                                className="text-red-500 text-sm mt-1"
                                                                            />
                                                                        </div>

                                                                        <Field
                                                                            as="select"
                                                                            name={`services[${i}].type`}
                                                                            className="border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
                                                                        >
                                                                            <option value="INCLUDED">Bao gồm</option>
                                                                            <option value="EXCLUDED">Không bao gồm</option>
                                                                        </Field>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => remove(i)}
                                                                            className="text-red-500 hover:text-red-700 transition-all duration-200"
                                                                            title="Xóa dịch vụ"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-gray-500 italic">Chưa có dịch vụ nào được thêm</div>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() => push({ name: "", type: "INCLUDED" })}
                                                                className="text-green-600 flex items-center gap-2 mt-3 hover:text-green-800 transition-all duration-200"
                                                            >
                                                                <PlusCircle size={18} /> Thêm dịch vụ
                                                            </button>
                                                        </div>
                                                    )}
                                                </FieldArray>
                                            </div>
                                        )}

                                        {/* Nút điều hướng giữa các bước */}
                                        <div className="flex justify-between mt-6">
                                            {step > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(step - 1)}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-2xl hover:bg-gray-400 transition-all duration-200"
                                                >
                                                    Quay lại
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                                            >
                                                {step < 5 ? "Tiếp theo" : "Hoàn tất"}
                                            </button>
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </Formik>)}
                    </div>
                </div>
            }
        />
    );
};

export default AdminTourUpdate;