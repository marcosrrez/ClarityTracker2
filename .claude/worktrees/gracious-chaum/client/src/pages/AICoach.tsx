// This AI Coach page has been moved to the Insights & Resources section
// Users can access the AI Coach through the insights interface
export default function AICoach() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          AI Coach Moved
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The AI Coach is now available within the Insights & Resources section. 
          Click the AI Coach button next to "Add Notes" to start a conversation.
        </p>
        <a 
          href="/insights" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Insights & Resources
        </a>
      </div>
    </div>
  );
}