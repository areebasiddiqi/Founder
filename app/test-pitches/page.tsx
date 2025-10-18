'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function TestPitchesPage() {
  const [pitches, setPitches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPitches = async () => {
      try {
        console.log('Loading all pitch pages for testing...')
        
        // Try to load all pitch pages without filters
        const { data: allPitches, error: allError } = await supabase
          .from('pitch_pages')
          .select('*')
          .limit(10)
        
        console.log('All pitches result:', { allPitches, allError })
        
        // Try to load only published pitches
        const { data: publishedPitches, error: pubError } = await supabase
          .from('pitch_pages')
          .select('*')
          .eq('is_published', true)
          .limit(10)
        
        console.log('Published pitches result:', { publishedPitches, pubError })
        
        if (publishedPitches) {
          setPitches(publishedPitches)
        } else if (allPitches) {
          setPitches(allPitches)
          setError('Could only load all pitches, not just published ones')
        } else {
          setError(`Failed to load pitches: ${pubError?.message || allError?.message}`)
        }
      } catch (err) {
        console.error('Error loading pitches:', err)
        setError('Unexpected error loading pitches')
      } finally {
        setLoading(false)
      }
    }

    loadPitches()
  }, [])

  if (loading) {
    return <div className="p-8">Loading test pitches...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Test Pitches Page</h1>
        <p className="text-gray-600 mb-8">
          This page helps debug pitch page access issues. Check the browser console for detailed logs.
        </p>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {pitches.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">
                  No pitch pages found. This could indicate an RLS policy issue.
                </p>
              </CardContent>
            </Card>
          ) : (
            pitches.map((pitch) => (
              <Card key={pitch.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pitch.pitch_title || 'Untitled Pitch'}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      pitch.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pitch.is_published ? 'Published' : 'Draft'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>ID:</strong> {pitch.id}
                    </div>
                    <div>
                      <strong>Founder ID:</strong> {pitch.founder_id}
                    </div>
                    <div>
                      <strong>Application ID:</strong> {pitch.application_id}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(pitch.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {pitch.elevator_pitch && (
                    <div className="mt-4">
                      <strong>Elevator Pitch:</strong>
                      <p className="text-gray-700 mt-1">{pitch.elevator_pitch}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex space-x-2">
                    <a 
                      href={`/pitch/${pitch.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Test Access
                    </a>
                    {pitch.application_id && (
                      <a 
                        href={`/pitch/${pitch.application_id}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Test App ID Access
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
