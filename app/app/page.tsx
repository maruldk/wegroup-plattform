export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">WeGroup Platform</h1>
        </div>
        <p className="text-xl text-gray-600 mb-8">
          Modulare Plattform für Gruppen- und Projektmanagement
        </p>
        <a 
          href="/dashboard" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Zum Dashboard
        </a>
        <div className="mt-8 p-4 bg-white rounded-lg shadow max-w-md mx-auto">
          <h3 className="font-semibold mb-2">Demo-Benutzer (Test)</h3>
          <p className="text-sm text-gray-600">john@doe.com / johndoe123</p>
        </div>
      </div>
    </div>
  )
}