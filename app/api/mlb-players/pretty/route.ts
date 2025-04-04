import { NextResponse } from "next/server"

export async function GET() {
  // Fetch data from the main MLB players endpoint
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://v0-homerun-fantasy-app-meghward-gmailcoms-projects.vercel.app"
  const response = await fetch(`${baseUrl}/api/mlb-players`)
  const data = await response.json()

  // Return with formatting for better readability
  return new NextResponse(
    `
<!DOCTYPE html>
<html>
<head>
  <title>MLB Players Data</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    .info {
      background: #e9f5ff;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 30px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .player-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }
    .player-card {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background: #f9f9f9;
    }
    .player-name {
      font-weight: bold;
      font-size: 16px;
    }
    .player-details {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .hr-count {
      font-weight: bold;
      color: #d00;
    }
  </style>
</head>
<body>
  <h1>MLB Players Data</h1>
  
  <div class="info">
    <p><strong>Source:</strong> ${data.source || "Unknown"}</p>
    <p><strong>Last Updated:</strong> ${data.lastUpdated || "Unknown"}</p>
    <p><strong>Total Players:</strong> ${data.allPlayers?.length || 0}</p>
  </div>
  
  <div class="section">
    <h2>Tier 1 Players (${data.tier1Players?.length || 0})</h2>
    <div class="player-grid">
      ${
        data.tier1Players
          ?.map(
            (player) => `
        <div class="player-card">
          <div class="player-name">${player.name}</div>
          <div class="player-details">
            ${player.team} • ${player.position || "POS"} • <span class="hr-count">${player.hr2024} HR</span>
          </div>
        </div>
      `,
          )
          .join("") || "No players found"
      }
    </div>
  </div>
  
  <div class="section">
    <h2>Tier 2 Players (${data.tier2Players?.length || 0})</h2>
    <div class="player-grid">
      ${
        data.tier2Players
          ?.map(
            (player) => `
        <div class="player-card">
          <div class="player-name">${player.name}</div>
          <div class="player-details">
            ${player.team} • ${player.position || "POS"} • <span class="hr-count">${player.hr2024} HR</span>
          </div>
        </div>
      `,
          )
          .join("") || "No players found"
      }
    </div>
  </div>
  
  <div class="section">
    <h2>Tier 3 Players (${data.tier3Players?.length || 0})</h2>
    <div class="player-grid">
      ${
        data.tier3Players
          ?.map(
            (player) => `
        <div class="player-card">
          <div class="player-name">${player.name}</div>
          <div class="player-details">
            ${player.team} • ${player.position || "POS"} • <span class="hr-count">${player.hr2024} HR</span>
          </div>
        </div>
      `,
          )
          .join("") || "No players found"
      }
    </div>
  </div>
  
  <div class="section">
    <h2>Wildcard Players (${data.wildcardPlayers?.length || 0})</h2>
    <div class="player-grid">
      ${
        data.wildcardPlayers
          ?.map(
            (player) => `
        <div class="player-card">
          <div class="player-name">${player.name}</div>
          <div class="player-details">
            ${player.team} • ${player.position || "POS"} • <span class="hr-count">${player.hr2024} HR</span>
          </div>
        </div>
      `,
          )
          .join("") || "No players found"
      }
    </div>
  </div>
</body>
</html>
  `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  )
}

