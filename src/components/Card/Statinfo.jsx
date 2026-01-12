
export default function Statinfo() {
    return (
                <div className="bg-linear-to-br from-purple-500 to-pink-500 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <div className="text-white">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl mb-4 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Soft & Friendly</h3>
                        <p className="text-white/90 mb-4">Using rounded-3xl for gentle curves</p>
                        <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl backdrop-blur-sm transition-colors">
                            Explore
                        </button>
                    </div>
                </div>
    );
}