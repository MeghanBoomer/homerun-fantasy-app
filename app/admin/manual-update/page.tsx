"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import Link from "next/link"

interface Team {
  id: string
  teamName: string
  players: {
    tier1Player: { name: string; id: string }
    tier2Player: { name: string; id: string }
    tier3Player: { name: string; id: string }
    wildcard1: { name: string; id: string }
    wildcard2: { name: string; id: string }
    wildcard3: { name: string; id: string }
  }
  playerHRs?: number[]
  actualHR?: number
}

export default function ManualUpdatePage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [playerHRs, setPlayerHRs] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamDetails(selectedTeamId)
    } else {
      setSelectedTeam(null)
      setPlayerHRs([0, 0, 0, 0, 0, 0])
    }
  }, [selectedTeamId])

  const fetchTeams = async () => {
    setIsLoading(true)
    try {
      const teamsQuery = collection(db, "teams")
      const querySnapshot = await getDocs(teamsQuery)

      const teamsData: Team[] = []
      querySnapshot.forEach((doc) => {
        teamsData.push({ id: doc.id, ...doc.data() } as Team)
      })

      // Sort by team name
      teamsData.sort((a, b) => a.teamName.localeCompare(b.teamName))

      setTeams(teamsData)
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: string) => {
    try {
      const teamDoc = await getDoc(doc(db, "teams", teamId))

      if (teamDoc.exists()) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team
        setSelectedTeam(teamData)

        // Set player HRs from team data or default to zeros
        setPlayerHRs(teamData.playerHRs || [0, 0, 0, 0, 0, 0])
      }
    } catch (error) {
      console.error("Error fetching team details:", error)
    }
  }

  const handleHRChange = (index: number, value: string) => {
    const newValue = Number.parseInt(value) || 0
    const newPlayerHRs = [...playerHRs]
    newPlayerHRs[index] = newValue
    setPlayerHRs(newPlayerHRs)
  }

  const calculateTotal = () => {
    return playerHRs.reduce((sum, hr) => sum + hr, 0)
  }

  const handleSave = async () => {
    if (!selectedTeam) return

    setIsSaving(true)
    setResult(null)

    try {
      const totalHR = calculateTotal()

      // Update the team document
      await updateDoc(doc(db, "teams", selectedTeam.id), {
        actualHR: totalHR,
        playerHRs: playerHRs,
        lastUpdated: new Date(),
      })

      setResult({
        success: true,
        message: `Successfully updated ${selectedTeam.teamName} with ${totalHR} total home runs`,
      })

      // Refresh team details
      fetchTeamDetails(selectedTeam.id)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to update team stats",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manual Stats Update</h1>
          <p className="text-muted-foreground">Manually update home run counts for individual teams</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Panel
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Team Home Run Counts</CardTitle>
          <CardDescription>Enter the actual 2025 home run counts for each player</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTeam && (
              <>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tier1-hr">{selectedTeam.players.tier1Player?.name} (Tier 1)</Label>
                      <Input
                        id="tier1-hr"
                        type="number"
                        min="0"
                        value={playerHRs[0]}
                        onChange={(e) => handleHRChange(0, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier2-hr">{selectedTeam.players.tier2Player?.name} (Tier 2)</Label>
                      <Input
                        id="tier2-hr"
                        type="number"
                        min="0"
                        value={playerHRs[1]}
                        onChange={(e) => handleHRChange(1, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier3-hr">{selectedTeam.players.tier3Player?.name} (Tier 3)</Label>
                      <Input
                        id="tier3-hr"
                        type="number"
                        min="0"
                        value={playerHRs[2]}
                        onChange={(e) => handleHRChange(2, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wc1-hr">{selectedTeam.players.wildcard1?.name} (WC1)</Label>
                      <Input
                        id="wc1-hr"
                        type="number"
                        min="0"
                        value={playerHRs[3]}
                        onChange={(e) => handleHRChange(3, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wc2-hr">{selectedTeam.players.wildcard2?.name} (WC2)</Label>
                      <Input
                        id="wc2-hr"
                        type="number"
                        min="0"
                        value={playerHRs[4]}
                        onChange={(e) => handleHRChange(4, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wc3-hr">{selectedTeam.players.wildcard3?.name} (WC3)</Label>
                      <Input
                        id="wc3-hr"
                        type="number"
                        min="0"
                        value={playerHRs[5]}
                        onChange={(e) => handleHRChange(5, e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Home Runs:</span>
                      <span className="text-xl font-bold">{calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                {result && (
                  <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                    <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
        {selectedTeam && (
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save HR Counts
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

