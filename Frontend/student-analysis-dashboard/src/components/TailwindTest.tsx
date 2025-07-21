import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎉 Tailwind CSS Working!
        </h1>
        <p className="text-gray-600 mb-6">
          If you can see this styled card with gradients and shadows, then Tailwind CSS is working perfectly.
        </p>
        <div className="space-y-2">
          <div className="w-full h-4 bg-blue-200 rounded">
            <div className="h-4 bg-blue-500 rounded animate-pulse" style={{width: '75%'}}></div>
          </div>
          <div className="w-full h-4 bg-green-200 rounded">
            <div className="h-4 bg-green-500 rounded animate-pulse" style={{width: '90%'}}></div>
          </div>
          <div className="w-full h-4 bg-purple-200 rounded">
            <div className="h-4 bg-purple-500 rounded animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
        <button className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
          Tailwind is Ready! ✨
        </button>
      </div>
    </div>
  );
};

export default TailwindTest; 