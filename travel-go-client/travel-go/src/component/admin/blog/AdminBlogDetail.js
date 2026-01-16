import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    User,
    Tag,
    MessageSquare,
    DollarSign,
} from "lucide-react";
import axios from "axios";

const AdminBlogDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlog();
    }, [id]);

    const fetchBlog = async () => {
        try {
            const response = await axios.get(`/api/admin/blogs/${id}`);
            setBlog(response.data);
        } catch (error) {
            console.error("Error fetching blog:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-3 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy bài viết</h3>
                    <p className="text-gray-600 mb-4">Bài viết bạn đang tìm kiếm không tồn tại</p>
                    <Link
                        to="/admin/blogs"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                    >
                        <ArrowLeft size={16} />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate("/admin/blogs")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    Quay lại danh sách
                </button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{blog.title}</h1>
                        <p className="text-gray-600 mt-1">{blog.subtitle}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User size={16} />
                                <span>{blog.author}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} />
                                <span>{new Date(blog.createdAt).toLocaleDateString("vi-VN", {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MessageSquare size={16} />
                                <span>{blog.comments?.length || 0} bình luận</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            to={`/admin/blogs/edit/${blog.id}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        >
                            Chỉnh sửa
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thumbnail */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <img
                            src={blog.thumbnail}
                            alt={blog.title}
                            className="w-full h-96 object-cover"
                        />
                    </div>

                    {/* Tags */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Tag size={18} />
                            Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(blog.tags || []).map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                                >
                  {tag}
                </span>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                        />
                    </div>

                    {/* Gallery */}
                    {blog.gallery && blog.gallery.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Thư viện ảnh</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {blog.gallery.map((url, index) => (
                                    <div key={index} className="aspect-square rounded-xl overflow-hidden">
                                        <img
                                            src={url}
                                            alt={`Gallery ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Related Tours */}
                    {blog.relatedTours && blog.relatedTours.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Tour liên quan</h3>
                            <div className="space-y-4">
                                {blog.relatedTours.map((tour, index) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                                        <img
                                            src={tour.img}
                                            alt={tour.name}
                                            className="w-full h-32 object-cover rounded-lg mb-3"
                                        />
                                        <h4 className="font-medium text-gray-900 mb-1">{tour.name}</h4>
                                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                                            <DollarSign size={16} />
                                            <span>{parseInt(tour.price).toLocaleString("vi-VN")} VND</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    {blog.comments && blog.comments.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare size={18} />
                                Bình luận ({blog.comments.length})
                            </h3>
                            <div className="space-y-4">
                                {blog.comments.map((comment, index) => (
                                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-gray-900">{comment.name}</span>
                                            <span className="text-sm text-gray-500">
                        {new Date(comment.date).toLocaleDateString("vi-VN")}
                      </span>
                                        </div>
                                        <p className="text-gray-600">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBlogDetail;