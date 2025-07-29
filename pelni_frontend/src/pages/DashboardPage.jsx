// src/pages/DashboardPage.jsx

function DashboardPage() {
    return (
        <div className="h-full w-full flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-lg p-10 max-w-2xl w-full text-center">
                <h1 className="text-4xl font-extrabold text-gray-800">
                    Selamat Datang di <span className="text-blue-600">SimPLAN</span>
                </h1>
                <p className="mt-4 text-gray-600 text-lg">
                    Membuat plan dengan cara yang simpel, cepat, dan terstruktur.
                </p>
            </div>
        </div>
    );
}

export default DashboardPage;
