import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";

const BlogDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState([]);

    useEffect(() => {
        // Mock dữ liệu bài viết
        const posts = [
            {
                id: "1",
                title: "Khám phá Hội An",
                subtitle: "Trải nghiệm phố cổ và ẩm thực địa phương",
                content: "Một ngày trải nghiệm phố cổ Hội An với những con phố cổ kính, đèn lồng rực rỡ, và món ăn đặc sản thơm ngon…\nTham quan các di tích lịch sử, trải nghiệm các hoạt động thủ công mỹ nghệ.\nTận hưởng không gian yên bình và cảnh sắc tuyệt đẹp về đêm.",
                img: "https://images.unsplash.com/photo-1551334787-21e6bd3ab135?auto=format&fit=crop&w=800&q=80",
                date: "10/10/2025",
                author: "Admin TravelGo",
                tags: ["Hội An", "Du lịch", "Văn hóa"],
                relatedTours: [
                    { id: "1", name: "Tour Hội An 1 ngày", price: "$50", img: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=400&q=80" },
                    { id: "2", name: "Tour Hội An 2 ngày", price: "$80", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80" }
                ],
                gallery: [
                    "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=400&q=80",
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
                    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=400&q=80"
                ],
                comments: [
                    { name: "Lan", content: "Bài viết rất hữu ích!", date: "11/10/2025" },
                    { name: "Nam", content: "Mình muốn thử tour này", date: "12/10/2025" }
                ]
            }
        ];

        const foundPost = posts.find(p => p.id === id);
        setPost(foundPost);
        if (foundPost) setComments(foundPost.comments);
    }, [id]);

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment = {
            name: "Bạn", // Hoặc lấy tên user đăng nhập
            content: newComment,
            date: new Date().toLocaleDateString()
        };
        setComments([comment, ...comments]);
        setNewComment("");
    };

    if (!post) {
        return (
            <>
                <HeaderComponent />
                <div className="container mx-auto px-6 py-10 text-center">
                    <p className="text-gray-500">Bài viết không tồn tại</p>
                    <button onClick={() => navigate("/blog")} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                        Quay lại Blog
                    </button>
                </div>
                <FooterComponent />
            </>
        );
    }

    return (
        <>
            <HeaderComponent />
            <div className="container mx-auto px-6 py-10 max-w-4xl space-y-8">

                {/* Tiêu đề và thông tin */}
                <div>
                    <h1 className="text-4xl font-bold text-green-600">{post.title}</h1>
                    {post.subtitle && <p className="text-gray-500 italic">{post.subtitle}</p>}
                    <p className="text-gray-400 text-sm mt-1">Đăng bởi {post.author} | {post.date}</p>
                    {post.tags && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ảnh chính */}
                <div className="rounded-lg overflow-hidden shadow-lg">
                    <img src={post.img} alt={post.title} className="w-full h-96 object-cover"/>
                </div>

                {/* Gallery ảnh */}
                {post.gallery && post.gallery.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {post.gallery.map((img, idx) => (
                            <img key={idx} src={img} alt={`Gallery ${idx}`} className="w-full h-40 object-cover rounded"/>
                        ))}
                    </div>
                )}

                {/* Nội dung chi tiết */}
                <div className="text-gray-700 space-y-4 text-lg leading-relaxed">
                    {post.content.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>

                {/* Các tour liên quan với background ảnh */}
                {post.relatedTours && post.relatedTours.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-green-600">Các tour liên quan</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {post.relatedTours.map(tour => (
                                <Link key={tour.id} to={`/tours/${tour.id}`} className="relative h-48 rounded-lg overflow-hidden shadow-lg group">
                                    <img src={tour.img} alt={tour.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform"/>
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4 text-white">
                                        <p className="font-semibold text-lg">{tour.name}</p>
                                        <p className="font-bold">{tour.price}</p>
                                        <span className="mt-2 inline-block px-3 py-1 bg-green-600 text-white rounded text-sm">Xem tour</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bình luận kiểu Facebook */}
                <div className="space-y-4 mt-8">
                    <h2 className="text-2xl font-bold text-gray-800">Bình luận</h2>

                    {/* Form nhập bình luận */}
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Viết bình luận..."
                            className="w-full border rounded px-3 py-2 resize-none focus:outline-none focus:ring focus:border-green-400"
                            rows={3}
                        />
                        <button
                            onClick={handleAddComment}
                            className="self-end px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            Gửi
                        </button>
                    </div>

                    {/* Danh sách bình luận */}
                    <div className="space-y-3 mt-4">
                        {comments.map((c, idx) => (
                            <div key={idx} className="flex flex-col border p-3 rounded shadow-sm bg-gray-50">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-semibold">{c.name}</p>
                                    <p className="text-gray-400 text-sm">{c.date}</p>
                                </div>
                                <p className="text-gray-700">{c.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            <FooterComponent />
        </>
    );
};

export default BlogDetailPage;
