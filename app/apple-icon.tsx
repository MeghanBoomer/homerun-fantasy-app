import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

// Image generation
export default function Icon() {
  return new ImageResponse(
    // Beer mug icon with foam
    <div
      style={{
        fontSize: 144,
        background: "transparent",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f59e0b", // Amber color for beer
      }}
    >
      🍺
    </div>,
    {
      ...size,
    },
  )
}

