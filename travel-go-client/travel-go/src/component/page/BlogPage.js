import React from "react";
import { Link } from "react-router-dom";
import HeaderComponent from "../layout/HeaderComponent";
import FooterComponent from "../layout/FooterComponent";

const BlogPage = () => {
    const posts = [
        { id: 1, title: "Khám phá Hội An", snippet: "Một ngày trải nghiệm phố cổ Hội An…", img: "https://images.unsplash.com/photo-1551334787-21e6bd3ab135?auto=format&fit=crop&w=800&q=80" },
        { id: 2, title: "Tour biển Nha Trang", snippet: "Chuyến đi biển tuyệt vời cho gia đình…", img: "https://images.unsplash.com/photo-1551334787-21e6bd3ab135?auto=format&fit=crop&w=800&q=80" },
        // thêm post khác
    ];

    return (
        <>
            <HeaderComponent/>
            <div className="container mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold text-green-600 mb-8">Blog Du Lịch</h1>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <Link key={post.id} to={`/blog/${post.id}`} className="group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="h-48 w-full overflow-hidden">
                                <img
                                    src={post.img}
                                    alt={post.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-4 bg-white">
                                <h2 className="text-xl font-semibold text-gray-800 group-hover:text-green-600 transition-colors">{post.title}</h2>
                                <p className="text-gray-600 mt-2">{post.snippet}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <FooterComponent/>
        </>

    );
};

export default BlogPage;
