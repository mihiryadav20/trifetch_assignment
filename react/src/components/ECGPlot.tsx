import { useState, useMemo } from 'react'
import Plot from 'react-plotly.js'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Layout, Config } from 'plotly.js'

interface ECGData {
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

interface ECGPlotProps {
  data: ECGData
}

export default function ECGPlot({ data }: ECGPlotProps) {
  const [showEventWindow, setShowEventWindow] = useState(false)

  const eventTimeSeconds = data.start_sample_display * 0.02

  // Prepare the ECG traces
  const { lead1Data, lead2Data } = useMemo(() => {
    const lead1 = data.ecg.map(point => point[0])
    const lead2 = data.ecg.map(point => point[1])
    
    // Normalize and offset Lead II so it doesn't overlap with Lead I
    const lead1Mean = lead1.reduce((a, b) => a + b, 0) / lead1.length
    const lead2Mean = lead2.reduce((a, b) => a + b, 0) / lead2.length
    
    const lead1Normalized = lead1.map(v => v - lead1Mean)
    const lead2Normalized = lead2.map(v => v - lead2Mean - 2000) // Offset downward
    
    return {
      lead1Data: lead1Normalized,
      lead2Data: lead2Normalized
    }
  }, [data.ecg])

  // Create plot data
  const plotData: any[] = [
    // Lead I trace
    {
      x: data.time_seconds,
      y: lead1Data,
      type: 'scatter',
      mode: 'lines',
      name: 'Lead I',
      line: {
        color: '#10b981',
        width: 1.5,
      },
      hovertemplate: 'Lead I<br>Time: %{x:.2f}s<br>Amplitude: %{y:.0f}<extra></extra>',
    },
    // Lead II trace
    {
      x: data.time_seconds,
      y: lead2Data,
      type: 'scatter',
      mode: 'lines',
      name: 'Lead II',
      line: {
        color: '#10b981',
        width: 1.5,
      },
      hovertemplate: 'Lead II<br>Time: %{x:.2f}s<br>Amplitude: %{y:.0f}<extra></extra>',
    },
  ]

  // Add event window shading if hovering
  if (showEventWindow) {
    const windowStart = Math.max(0, eventTimeSeconds - 4)
    const windowEnd = Math.min(data.time_seconds[data.time_seconds.length - 1], eventTimeSeconds + 4)
    
    plotData.push({
      x: [windowStart, windowEnd, windowEnd, windowStart, windowStart],
      y: [5000, 5000, -5000, -5000, 5000],
      fill: 'toself',
      fillcolor: 'rgba(59, 130, 246, 0.15)',
      line: { width: 0 },
      showlegend: false,
      hoverinfo: 'skip',
      name: 'Event Window',
    })
  }

  // Add red vertical line at event start
  plotData.push({
    x: [eventTimeSeconds, eventTimeSeconds],
    y: [-5000, 5000],
    type: 'scatter',
    mode: 'lines',
    name: 'Event Start',
    line: {
      color: '#ef4444',
      width: 3,
      dash: 'solid',
    },
    hovertemplate: `Event Start<br>Time: ${eventTimeSeconds.toFixed(2)}s<extra></extra>`,
    hoverlabel: {
      bgcolor: '#ef4444',
      font: { color: 'white' },
    },
  })

  const layout: Partial<Layout> = {
    autosize: true,
    height: 600,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'system-ui, -apple-system, sans-serif',
      color: 'hsl(var(--foreground))',
    },
    xaxis: {
      title: {
        text: 'Time (seconds)',
        font: { size: 14, color: 'hsl(var(--foreground))' },
      },
      gridcolor: 'hsl(var(--border))',
      gridwidth: 1,
      showgrid: true,
      zeroline: false,
      color: 'hsl(var(--foreground))',
      range: [0, Math.max(...data.time_seconds)],
    },
    yaxis: {
      title: {
        text: 'Amplitude (μV)',
        font: { size: 14, color: 'hsl(var(--foreground))' },
      },
      gridcolor: 'hsl(var(--border))',
      gridwidth: 1,
      showgrid: true,
      zeroline: true,
      zerolinecolor: 'hsl(var(--border))',
      zerolinewidth: 1,
      color: 'hsl(var(--foreground))',
    },
    legend: {
      x: 0.01,
      y: 0.99,
      bgcolor: 'rgba(0,0,0,0.1)',
      bordercolor: 'hsl(var(--border))',
      borderwidth: 1,
      font: { color: 'hsl(var(--foreground))' },
    },
    hovermode: 'closest' as const,
    margin: { l: 60, r: 40, t: 40, b: 60 },
  }

  const config: Partial<Config> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'] as any,
    toImageButtonOptions: {
      format: 'png' as any,
      filename: `ecg_${data.event_id}`,
      height: 800,
      width: 1400,
    },
  }

  const confidenceColor = data.confidence >= 0.9 ? 'bg-green-500' : data.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-orange-500'
  const matchColor = data.ground_truth === data.predicted ? 'bg-green-500' : 'bg-red-500'

  return (
    <div className="w-full space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">ECG Event Analysis</CardTitle>
              <CardDescription className="mt-1">
                Event ID: <span className="font-mono font-semibold">{data.event_id}</span>
              </CardDescription>
              <CardDescription className="mt-1">
                Patient ID: <Link 
                  to={`/patient/${data.patient_id}`}
                  className="font-mono text-xs text-primary hover:underline cursor-pointer"
                >
                  {data.patient_id}
                </Link>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={data.is_rejected ? "destructive" : "default"} className="text-sm px-3 py-1">
                {data.is_rejected ? '❌ Rejected' : '✓ Approved'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ground Truth</p>
              <p className="text-2xl font-bold">{data.ground_truth}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Predicted</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{data.predicted}</p>
                <Badge className={matchColor}>
                  {data.ground_truth === data.predicted ? 'Match' : 'Mismatch'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{(data.confidence * 100).toFixed(1)}%</p>
                <Badge className={confidenceColor}>
                  {data.confidence >= 0.9 ? 'High' : data.confidence >= 0.7 ? 'Medium' : 'Low'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ECG Plot Card */}
      <Card>
        <CardHeader>
          <CardTitle>Electrocardiogram</CardTitle>
          <CardDescription>
            Two-lead ECG recording • Event starts at <span className="text-red-500 font-semibold">{eventTimeSeconds.toFixed(2)}s</span> (red line)
            <br />
            <span className="text-xs text-muted-foreground">Hover near the red line to highlight the event window (±4s)</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div 
            className="w-full bg-card rounded-lg border border-border overflow-hidden"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const plotWidth = rect.width
              const timeAtCursor = (x / plotWidth) * Math.max(...data.time_seconds)
              
              // Show window if cursor is within 6 seconds of event
              if (Math.abs(timeAtCursor - eventTimeSeconds) < 6) {
                setShowEventWindow(true)
              } else {
                setShowEventWindow(false)
              }
            }}
            onMouseLeave={() => setShowEventWindow(false)}
          >
            <Plot
              data={plotData}
              layout={layout}
              config={config}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Duration</p>
              <p className="font-semibold">{Math.max(...data.time_seconds).toFixed(1)}s</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sample Points</p>
              <p className="font-semibold">{data.ecg.length.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sampling Rate</p>
              <p className="font-semibold">50 Hz (downsampled)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Event Sample</p>
              <p className="font-semibold">{data.start_sample_display}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
