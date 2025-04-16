export default function TestSimplePage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Simple Test Page</h1>
      <p>This is a very simple test page.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}
