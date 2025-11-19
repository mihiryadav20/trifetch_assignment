import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Episode {
  event_id: string
  event_name: string
  is_rejected: number
  start_sample: number
}

export function PatientDetails() {
  const { patientId } = useParams<{ patientId: string }>()
  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchPatientEpisodes = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/patient/${patientId}/episodes`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch patient episodes')
        }
        const data = await response.json()
        setEpisodes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      fetchPatientEpisodes()
    }
  }, [patientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading patient details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 mt-12">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-12">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Patient: {patientId}</h1>
        <p className="text-muted-foreground">
          {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'} recorded
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {episodes.map((episode, index) => (
          <Card key={episode.event_id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Episode #{index + 1}</span>
                <span className={episode.is_rejected ? "text-red-500 text-sm" : "text-green-500 text-sm"}>
                  {episode.is_rejected ? "Rejected" : "Valid"}
                </span>
              </CardTitle>
              <CardDescription>Event ID: {episode.event_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Event Type:</span>
                  <span className="font-semibold text-lg">{episode.event_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Start Sample:</span>
                  <span className="font-mono text-sm">{episode.start_sample}</span>
                </div>
                <Link to={`/event/${episode.event_id}`} className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    View ECG Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {episodes.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          No episodes found for this patient
        </div>
      )}
    </div>
  )
}
