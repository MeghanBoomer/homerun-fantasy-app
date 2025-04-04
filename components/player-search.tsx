"use client"

import { useState, useEffect } from "react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Search, X } from "lucide-react"

interface Player {
  id: string
  name: string
  team: string
  hr2024: number
  position?: string
}

interface PlayerSearchProps {
  players: Player[]
  onSelect: (player: Player | null) => void
  placeholder?: string
  selectedPlayer?: Player | null
}

export function PlayerSearch({
  players,
  onSelect,
  placeholder = "Search for a player...",
  selectedPlayer,
}: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = players
        .filter(
          (player) =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 20) // Show more results for MLB API data
      setFilteredPlayers(filtered)
      setIsOpen(true)
    } else {
      setFilteredPlayers([])
      setIsOpen(false)
    }
  }, [searchTerm, players])

  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length <= 1) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return text.replace(regex, "<mark>$1</mark>")
  }

  const handleSelect = (player: Player) => {
    // Ensure hr2024 is a valid number
    const validatedPlayer = {
      ...player,
      hr2024: typeof player.hr2024 === "number" && !isNaN(player.hr2024) ? player.hr2024 : 0,
    }

    onSelect(validatedPlayer)
    setSearchTerm("")
    setIsOpen(false)
  }

  const clearSelection = () => {
    onSelect(null) // Pass null instead of empty object
    setSearchTerm("")
  }

  // Helper function to safely display HR values
  const displayHR = (value: number | undefined): string => {
    return typeof value === "number" && !isNaN(value) ? value.toString() : "0"
  }

  return (
    <div className="relative">
      {selectedPlayer && selectedPlayer.id ? (
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div>
            <p className="font-medium">{selectedPlayer.name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedPlayer.team} • {displayHR(selectedPlayer.hr2024)} HR in 2024
              {selectedPlayer.position && ` • ${selectedPlayer.position}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isOpen && filteredPlayers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredPlayers.map((player) => (
                <div key={player.id} className="p-2 hover:bg-muted cursor-pointer" onClick={() => handleSelect(player)}>
                  <div
                    className="font-medium"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(player.name, searchTerm),
                    }}
                  />
                  <div className="text-sm text-muted-foreground">
                    {player.team} • {displayHR(player.hr2024)} HR in 2024
                    {player.position && ` • ${player.position}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOpen && searchTerm.length > 1 && filteredPlayers.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-2">
              <p className="text-sm text-muted-foreground">No players found</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

