export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/80 mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500">
                <p>© {currentYear} RateMyPic. All Rights Reserved.</p>
                <p className="mt-2 text-sm">
                    A project by Igbo Kenneth
                </p>
            </div>
        </footer>
    );
};