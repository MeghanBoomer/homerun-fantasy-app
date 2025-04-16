export default function TestDeploymentPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-4">Deployment Test Page</h1>
      <p>If you can see this page, your deployment is working correctly!</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
