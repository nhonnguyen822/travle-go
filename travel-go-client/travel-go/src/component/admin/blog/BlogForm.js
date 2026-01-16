import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Upload,
    Image as ImageIcon,
    X,
    Plus,
    DollarSign,
    Link as LinkIcon,
} from "lucide-react";
import axios from "axios";

const BlogForm = ({ isEdit = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        content: "",
        author: "",
        tags: [],
        thumbnailUrl: "",
        galleryUrls: [],
        relatedTours: [],
    });

    const [newTag, setNewTag] = useState("");
    const [newGalleryUrl, setNewGalleryUrl] = useState("");
    const [newRelatedTour, setNewRelatedTour] = useState({
        name: "",
        price: "",
        img: "",
    });

    useEffect(() => {
        if (isEdit && id) {
            fetchBlog();
        }
    }, [isEdit, id]);

    const fetchBlog = async () => {
        try {
            const response = await axios.get(`/api/admin/blogs/${id}`);
            const blog = response.data;
            setFormData({
                title: blog.title || "",
                subtitle: blog.subtitle || "",
                content: blog.content || "",
                author: blog.author || "",
                tags: blog.tags || [],
                thumbnailUrl: blog.thumbnail || "",
                galleryUrls: blog.gallery || [],
                relatedTours: blog.relatedTours || [],
            });
        } catch (error) {
            console.error("Error fetching blog:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await axios.put(`/api/admin/blogs/${id}`, formData);
            } else {
                await axios.post("/api/admin/blogs", formData);
            }
            navigate("/admin/blogs");
        } catch (error) {
            console.error("Error saving blog:", error);
            alert("Có lỗi xảy ra khi lưu bài viết");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim()) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()],
            });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove),
        });
    };

    const handleAddGalleryUrl = () => {
        if (newGalleryUrl.trim()) {
            setFormData({
                ...formData,
                galleryUrls: [...formData.galleryUrls, newGalleryUrl.trim()],
            });
            setNewGalleryUrl("");
        }
    };

    const handleRemoveGalleryUrl = (urlToRemove) => {
        setFormData({
            ...formData,
            galleryUrls: formData.galleryUrls.filter(url => url !== urlToRemove),
        });
    };

    const handleAddRelatedTour = () => {
        if (newRelatedTour.name.trim() && newRelatedTour.img.trim()) {
            setFormData({
                ...formData,
                relatedTours: [...formData.relatedTours, { ...newRelatedTour }],
            });
            setNewRelatedTour({ name: "", price: "", img: "" });
        }
    };

    const handleRemoveRelatedTour = (indexToRemove) => {
        setFormData({
            ...formData,
            relatedTours: formData.relatedTours.filter((_, index) => index !== indexToRemove),
        });
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isEdit ? "Cập nhật thông tin bài viết" : "Thêm bài viết mới vào hệ thống"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu đề bài viết *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Nhập tiêu đề bài viết"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tác giả *
                            </label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Nhập tên tác giả"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả ngắn *
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Nhập mô tả ngắn về bài viết"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm"
                                    >
                    {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="text-green-800 hover:text-green-900"
                                        >
                      <X size={14} />
                    </button>
                  </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Nhập tag và nhấn Enter"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Ảnh đại diện</h2>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3">
                            <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
                                {formData.thumbnailUrl ? (
                                    <img
                                        src={formData.thumbnailUrl}
                                        alt="Thumbnail preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon size={48} className="text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL ảnh đại diện *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={formData.thumbnailUrl}
                                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                    required
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                                <button
                                    type="button"
                                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    <Upload size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Hỗ trợ các định dạng: JPG, PNG, GIF. Kích thước đề xuất: 1200x800px
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gallery */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Thư viện ảnh</h2>

                    <div className="mb-4">
                        <div className="flex gap-2 mb-3">
                            <input
                                type="url"
                                value={newGalleryUrl}
                                onChange={(e) => setNewGalleryUrl(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Nhập URL ảnh"
                            />
                            <button
                                type="button"
                                onClick={handleAddGalleryUrl}
                                className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.galleryUrls.map((url, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                                    <img
                                        src={url}
                                        alt={`Gallery ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryUrl(url)}
                                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        {formData.galleryUrls.length === 0 && (
                            <div className="col-span-full text-center py-8">
                                <ImageIcon size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600">Chưa có ảnh nào trong thư viện</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Nội dung bài viết</h2>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung chi tiết *
                    </label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        placeholder="Nhập nội dung bài viết (hỗ trợ HTML)"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Hỗ trợ mã HTML cho định dạng phong phú
                    </p>
                </div>

                {/* Related Tours */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour liên quan</h2>

                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên tour
                                </label>
                                <input
                                    type="text"
                                    value={newRelatedTour.name}
                                    onChange={(e) => setNewRelatedTour({ ...newRelatedTour, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Nhập tên tour"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá (VND)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="number"
                                        value={newRelatedTour.price}
                                        onChange={(e) => setNewRelatedTour({ ...newRelatedTour, price: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Nhập giá tour"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL ảnh tour
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newRelatedTour.img}
                                        onChange={(e) => setNewRelatedTour({ ...newRelatedTour, img: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="URL ảnh tour"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddRelatedTour}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        >
                            Thêm tour liên quan
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.relatedTours.map((tour, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={tour.img}
                                        alt={tour.name}
                                        className="w-16 h-12 object-cover rounded-lg"
                                    />
                                    <div>
                                        <h4 className="font-medium text-gray-900">{tour.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {parseInt(tour.price).toLocaleString("vi-VN")} VND
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRelatedTour(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ))}

                        {formData.relatedTours.length === 0 && (
                            <div className="text-center py-6">
                                <LinkIcon size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600">Chưa có tour liên quan nào</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/blogs")}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Đang xử lý..." : isEdit ? "Cập nhật bài viết" : "Tạo bài viết"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BlogForm;