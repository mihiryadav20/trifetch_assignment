import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ECGPlot from "@/components/ECGPlot"

interface EventData {
  event_id: string
  patient_id: string
  ground_truth: string
  is_rejected: boolean
  predicted: string
  confidence: number
  ecg: number[][]
  time_seconds: number[]
  start_sample_display: number
}

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const [eventData, setEventData] = React.useState<EventData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/event/${eventId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch event details')
        }
        const data = await response.json()
        setEventData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventDetails()
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading event details...</div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="container mx-auto p-6 mt-12">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="text-lg text-red-500">Error: {error || 'Event not found'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-12">
      <Link to="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <ECGPlot data={eventData} />
    </div>
  )
}
