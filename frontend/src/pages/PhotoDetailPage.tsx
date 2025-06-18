import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MessageCircle, Download } from 'lucide-react';
import apiService from '../api/apiService';
import type {Image} from '../types/image'; // We will use a more detailed image type here
import { FollowButton} from "../components/FollowButton.tsx";
// We will use a more detailed image type here

// Define a more detailed type for this page
interface ImageDetail extends Image {
    // You might add more detailed owner info or other fields later
    tags: { id: number; name: string }[];
}

export const PhotoDetailPage = () => {
    const { id } = useParams<{ id: string }>(); // Get the image ID from the URL
    const [image, setImage] = useState<ImageDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("No image ID provided.");
            setIsLoading(false);
            return;
        }

        const fetchImageDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiService.get<ImageDetail>(`/images/${id}`);
                setImage(response.data);
            } catch (err) {
                setError("Could not find the requested photo.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchImageDetail();
    }, [id]);

    if (isLoading) {
        // A more detailed skeleton for a single page view
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                <div className="lg:col-span-2 bg-gray-300 rounded-lg h-[70vh]"></div>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="w-1/2 h-6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-full h-20 bg-gray-300 rounded"></div>
                    <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    if (!image) {
        return <div className="text-center text-gray-500 py-10">Photo not found.</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column: The Image */}
            <div className="lg:col-span-2 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                <img src={image.image_url} alt={image.caption || ''} className="max-w-full max-h-[80vh] object-contain" />
            </div>

            {/* Right Column: Details and Actions */}
            <div className="flex flex-col space-y-6">
                {/* Author Info */}
                <div className="flex justify-between items-start">
                    <Link to={`/profile/${image.owner.username}`} className="flex items-center gap-3 group">
                        <img
                            src={image.owner.profile_picture_url || 'https://via.placeholder.com/48'}
                            alt={image.owner.username}
                            className="w-12 h-12 rounded-full object-cover group-hover:ring-2 ring-blue-500 transition"
                        />
                        <div>
                            <h2 className="font-bold text-lg text-gray-800">{image.owner.username}</h2>
                            <p className="text-sm text-gray-500">Posted on {new Date(image.created_at).toLocaleDateString()}</p>
                        </div>
                    </Link>
                    {/*<button className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700">*/}
                    {/*    Follow*/}
                    {/*</button>*/}
                    <FollowButton userIdToFollow={image.owner.id} initialIsFollowing={false}/>
                </div>

                <hr />

                {/* Caption and Tags */}
                <div>
                    <p className="text-gray-700">{image.caption}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {image.tags.map(tag => (
                            <span key={tag.id} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions: Like, Comment, Download */}
                <div className="flex items-center space-x-6 text-gray-600">
                    <button className="flex items-center gap-2 hover:text-red-500">
                        <Heart /> <span>{image.like_count} Likes</span>
                    </button>
                     <button className="flex items-center gap-2 hover:text-blue-500">
                        <MessageCircle /> <span>{image.comment_count} Comments</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-500">
                        <Download /> <span>Download</span>
                    </button>
                </div>

                <hr />

                {/* Comment Section Placeholder */}
                <div className="flex-grow">
                    <h3 className="font-bold text-lg mb-4">Comments</h3>
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                        <p className="text-gray-400 text-center">Live comment section coming soon...</p>
                        {/* The <CommentList /> and <CommentForm /> components will go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};