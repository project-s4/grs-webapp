export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-8"></div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
              </div>
              
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                  <div className="ml-3 h-10 bg-gray-200 rounded w-36"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
