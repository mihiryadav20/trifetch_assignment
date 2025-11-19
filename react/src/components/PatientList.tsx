import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Patient {
  patient_id: string;
  episode_count: number;
  first_event_id?: string;
}

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/patients');
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }
        const data = await response.json();
        
        // Fetch first episode for each patient
        const patientsWithEvents = await Promise.all(
          data.map(async (patient: Patient) => {
            try {
              const episodesResponse = await fetch(
                `http://127.0.0.1:8000/patient/${patient.patient_id}/episodes`
              );
              if (episodesResponse.ok) {
                const episodes = await episodesResponse.json();
                return {
                  ...patient,
                  first_event_id: episodes.length > 0 ? episodes[0].event_id : undefined
                };
              }
            } catch {
              // If fetching episodes fails, just return patient without event_id
            }
            return patient;
          })
        );
        
        setPatients(patientsWithEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">TriFetch - Patient Dashboard</h1>
        <p className="text-muted-foreground">
          View cardiac event data for all patients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Link 
            key={patient.patient_id}
            to={patient.first_event_id ? `/event/${patient.first_event_id}` : `/patient/${patient.patient_id}`}
            className="block"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{patient.patient_id}</CardTitle>
                <CardDescription>
                  {patient.episode_count} {patient.episode_count === 1 ? 'episode' : 'episodes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {patient.first_event_id ? 'Click to view ECG chart' : 'Click to view episodes'}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          No patients found
        </div>
      )}
    </div>
  );
}
