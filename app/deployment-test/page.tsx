export default function DeploymentTestPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-4">Deployment Test Page</h1>
      <p>If you can see this page, your deployment is working correctly!</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">API Test</h2>
        <p>Try accessing the API endpoint at:</p>
        <code className="block bg-gray-100 p-2 mt-2 rounded">/api/deployment-test</code>
      </div>
    </div>
  )
}

