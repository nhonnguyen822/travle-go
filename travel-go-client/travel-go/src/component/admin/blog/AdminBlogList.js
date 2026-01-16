import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Calendar,
    User,
    Tag,
} from "lucide-react";
import axios from "axios";

const AdminBlogList = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ show: false, blogId: null });

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await axios.get("/api/admin/blogs");
            setBlogs(response.data);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/admin/blogs/${id}`);
            setBlogs(blogs.filter(blog => blog.id !== id));
            setDeleteModal({ show: false, blogId: null });
        } catch (error) {
            console.error("Error deleting blog:", error);
        }
    };

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blog.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blog.author?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTags = selectedTags.length === 0 ||
            (blog.tags && selectedTags.every(tag => blog.tags.includes(tag)));

        return matchesSearch && matchesTags;
    });

    const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags || [])));

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Blog</h1>
                    <p className="text-gray-600 mt-1">Quản lý bài viết và nội dung blog</p>
                </div>
                <Link
                    to="/admin/blogs/create"
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors"
                >
                    <Plus size={20} />
                    Thêm bài viết mới
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài viết..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <Tag size={16} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Lọc theo tag:</span>
                        </div>
                        {allTags.slice(0, 5).map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    if (selectedTags.includes(tag)) {
                                        setSelectedTags(selectedTags.filter(t => t !== tag));
                                    } else {
                                        setSelectedTags([...selectedTags, tag]);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    selectedTags.includes(tag)
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Blog List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có bài viết nào</h3>
                        <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo bài viết đầu tiên</p>
                        <Link
                            to="/admin/blogs/create"
                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                        >
                            <Plus size={16} />
                            Tạo bài viết mới
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-4 font-medium text-gray-700">Bài viết</th>
                                <th className="text-left p-4 font-medium text-gray-700">Tác giả</th>
                                <th className="text-left p-4 font-medium text-gray-700">Ngày đăng</th>
                                <th className="text-left p-4 font-medium text-gray-700">Tags</th>
                                <th className="text-left p-4 font-medium text-gray-700">Hành động</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filteredBlogs.map((blog) => (
                                <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={blog.thumbnail || "https://via.placeholder.com/60x40"}
                                                alt={blog.title}
                                                className="w-16 h-12 object-cover rounded-lg"
                                            />
                                            <div>
                                                <h4 className="font-medium text-gray-900 line-clamp-1">{blog.title}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-1">{blog.subtitle}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            <span>{blog.author || "Admin"}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span>{new Date(blog.createdAt).toLocaleDateString("vi-VN")}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(blog.tags || []).slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                                >
                            {tag}
                          </span>
                                            ))}
                                            {(blog.tags || []).length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{(blog.tags || []).length - 3}
                          </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/blogs/${blog.id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ show: true, blogId: blog.id })}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ show: false, blogId: null })}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteModal.blogId)}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlogList;