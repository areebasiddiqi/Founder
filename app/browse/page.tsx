'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface PitchPage {
  id: string
  pitch_title: string
  elevator_pitch: string
  target_valuation: number | null
  minimum_investment: number | null
  investment_type: string
  equity_offered: string
  is_published: boolean
  created_at: string
  advance_assurance_applications: {
    company_name: string
    investment_summary: string
    status: string
  }
  profiles: {
    full_name: string
  }
}

export default function BrowsePage() {
  const [pitches, setPitches] = useState<PitchPage[]>([])
  const [filteredPitches, setFilteredPitches] = useState<PitchPage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')

  useEffect(() => {
    const loadPitches = async () => {
      try {
        const { data: pitchesData, error } = await supabase
          .from('pitch_pages')
          .select(`
            *,
            advance_assurance_applications (
              company_name,
              investment_summary,
              status
            ),
            profiles (
              full_name
            )
          `)
          .eq('is_published', true)
          .eq('advance_assurance_applications.status', 'approved')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPitches(pitchesData || [])
        setFilteredPitches(pitchesData || [])
      } catch (error) {
        console.error('Error loading pitches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPitches()
  }, [])

  useEffect(() => {
    let filtered = pitches

    if (searchTerm) {
      filtered = filtered.filter(pitch =>
        pitch.pitch_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.advance_assurance_applications?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.elevator_pitch?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPitches(filtered)
  }, [searchTerm, pitches])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading pitches...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Investment Opportunities</h1>
          <p className="text-gray-600 mt-2">
            Discover and invest in promising startups seeking funding
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search companies, industries, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline">
                <span className="mr-2">🔍</span>
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {filteredPitches.length} investment opportunit{filteredPitches.length !== 1 ? 'ies' : 'y'} available
          </p>
          <select className="border border-gray-300 rounded px-3 py-1 text-sm">
            <option>Sort by: Most Recent</option>
            <option>Sort by: Valuation (Low to High)</option>
            <option>Sort by: Valuation (High to Low)</option>
            <option>Sort by: Investment Amount</option>
          </select>
        </div>

        {filteredPitches.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🔍</span>
                <h2 className="text-xl font-bold mb-2">No Investment Opportunities Found</h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'No published pitch pages available at the moment'}
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPitches.map((pitch) => (
              <Card key={pitch.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🚀</span>
                    <span className="text-xs text-gray-500 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Live
                    </span>
                  </div>
                  <CardTitle className="text-lg">
                    {pitch.advance_assurance_applications?.company_name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    by {pitch.profiles?.full_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {pitch.elevator_pitch}
                  </p>

                  <div className="space-y-2 mb-4">
                    {pitch.target_valuation && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valuation:</span>
                        <span className="font-medium">£{pitch.target_valuation.toLocaleString()}</span>
                      </div>
                    )}
                    {pitch.minimum_investment && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min Investment:</span>
                        <span className="font-medium">£{pitch.minimum_investment.toLocaleString()}</span>
                      </div>
                    )}
                    {pitch.equity_offered && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Equity:</span>
                        <span className="font-medium">{pitch.equity_offered}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{pitch.investment_type}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/pitch/${pitch.id}`}>
                        <span className="mr-2">👁️</span>
                        View Details
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <span className="mr-2">⭐</span>
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
