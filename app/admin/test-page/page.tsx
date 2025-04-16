export default function AdminTestPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-4">Admin Test Page</h1>
      <p>If you can see this, the page is working correctly!</p>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Test MLB API Connection</h2>
        <p>To test the MLB API connection, click the button below:</p>

        <div className="mt-4">
          <a
            href="/api/test-mlb-connection"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test MLB API
          </a>
        </div>
      </div>
    </div>
  )
}
