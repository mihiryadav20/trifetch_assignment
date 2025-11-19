import { EpisodesDataTable } from "@/components/EpisodesDataTable"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">TriFetch - Cardiac Events Dashboard</h1>
          <p className="text-muted-foreground">
            View and manage all cardiac events across patients
          </p>
        </div>
        <EpisodesDataTable />
      </div>
    </div>
  )
}

export default App