'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface Application {
  id: string
  company_name: string
  status: string
  investment_summary: string
  use_of_funds: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  experience: string
  linkedin_url?: string
  bio?: string
  avatar_url?: string
}

interface PitchData {
  id?: string
  application_id: string
  pitch_title: string
  elevator_pitch: string
  problem_statement: string
  solution_description: string
  market_size: string
  business_model: string
  competitive_advantage: string
  financial_projections: string
  team_description: string
  funding_requirements: string
  use_of_funds_detailed: string
  milestones: string
  video_url: string | null
  demo_url: string | null
  target_valuation: number | null
  minimum_investment: number | null
  maximum_investment: number | null
  investment_type: string
  equity_offered: string
  investor_benefits: string
  exit_strategy: string
  risks_challenges: string
  social_media_links: string
  contact_preferences: string
  is_published: boolean
  // New fields
  current_traction?: string
  monthly_revenue?: number
  customer_count?: number
  growth_rate?: number
  burn_rate?: number
  product_description?: string
  technology_stack?: string
  intellectual_property?: string
  target_customers?: string
  marketing_strategy?: string
  customer_acquisition_cost?: number
  customer_lifetime_value?: number
  // Team members
  team_members?: TeamMember[]
}

export default function CreatePitchPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pitchData, setPitchData] = useState<PitchData>({
    application_id: '',
    pitch_title: '',
    elevator_pitch: '',
    problem_statement: '',
    solution_description: '',
    market_size: '',
    business_model: '',
    competitive_advantage: '',
    financial_projections: '',
    team_description: '',
    funding_requirements: '',
    use_of_funds_detailed: '',
    milestones: '',
    video_url: null,
    demo_url: null,
    target_valuation: null,
    minimum_investment: null,
    maximum_investment: null,
    investment_type: 'equity',
    equity_offered: '',
    investor_benefits: '',
    exit_strategy: '',
    risks_challenges: '',
    social_media_links: '',
    contact_preferences: '',
    is_published: false,
    team_members: []
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Load approved applications
          const { data: applicationsData } = await supabase
            .from('advance_assurance_applications')
            .select('*')
            .eq('founder_id', user.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })

          setApplications(applicationsData || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleInputChange = (field: keyof PitchData, value: string | number | boolean) => {
    setPitchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleApplicationSelect = (applicationId: string) => {
    setSelectedApplication(applicationId)
    const app = applications.find(a => a.id === applicationId)
    if (app) {
      setPitchData(prev => ({
        ...prev,
        application_id: applicationId,
        pitch_title: `${app.company_name} - Investment Opportunity`,
        funding_requirements: app.investment_summary,
        use_of_funds_detailed: app.use_of_funds
      }))
    }
  }

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '',
      role: '',
      experience: '',
      linkedin_url: '',
      bio: '',
      avatar_url: ''
    }
    setPitchData(prev => ({
      ...prev,
      team_members: [...(prev.team_members || []), newMember]
    }))
  }

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setPitchData(prev => ({
      ...prev,
      team_members: prev.team_members?.map(member =>
        member.id === id ? { ...member, [field]: value } : member
      ) || []
    }))
  }

  const removeTeamMember = (id: string) => {
    setPitchData(prev => ({
      ...prev,
      team_members: prev.team_members?.filter(member => member.id !== id) || []
    }))
  }

  const handleAvatarUpload = async (memberId: string, file: File) => {
    if (!user) return

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${memberId}_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update team member with avatar URL
      updateTeamMember(memberId, 'avatar_url', publicUrl)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar')
    }
  }

  const handleSaveDraft = async () => {
    if (!user || !selectedApplication) {
      alert('Please select an application first')
      return
    }

    setSaving(true)
    try {
      // Save pitch page (excluding team_members from the main data)
      const { team_members, ...pitchPageData } = pitchData
      const { data: savedPitch, error: pitchError } = await supabase
        .from('pitch_pages')
        .upsert({
          ...pitchPageData,
          founder_id: user.id,
          is_published: false
        })
        .select()
        .single()

      if (pitchError) throw pitchError

      // Save team members if any exist
      if (team_members && team_members.length > 0) {
        // First, delete existing team members for this pitch
        await supabase
          .from('team_members')
          .delete()
          .eq('pitch_page_id', savedPitch.id)

        // Then insert new team members
        const teamMembersToSave = team_members
          .filter(member => member.name.trim() && member.role.trim() && member.experience.trim())
          .map((member, index) => ({
            pitch_page_id: savedPitch.id,
            name: member.name,
            role: member.role,
            experience: member.experience,
            linkedin_url: member.linkedin_url || null,
            bio: member.bio || null,
            avatar_url: member.avatar_url || null,
            display_order: index
          }))

        if (teamMembersToSave.length > 0) {
          const { error: teamError } = await supabase
            .from('team_members')
            .insert(teamMembersToSave)

          if (teamError) throw teamError
        }
      }

      alert('Pitch draft saved successfully!')
    } catch (error) {
      console.error('Error saving pitch:', error)
      alert('Failed to save pitch draft')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!user || !selectedApplication) {
      alert('Please select an application first')
      return
    }

    // Validate required fields
    if (!pitchData.pitch_title || !pitchData.elevator_pitch || !pitchData.problem_statement || 
        !pitchData.solution_description || !pitchData.funding_requirements) {
      alert('Please fill in all required fields before publishing')
      return
    }

    setSaving(true)
    try {
      // Save pitch page (excluding team_members from the main data)
      const { team_members, ...pitchPageData } = pitchData
      const { data: savedPitch, error: pitchError } = await supabase
        .from('pitch_pages')
        .upsert({
          ...pitchPageData,
          founder_id: user.id,
          is_published: true
        })
        .select()
        .single()

      if (pitchError) throw pitchError

      // Save team members if any exist
      if (team_members && team_members.length > 0) {
        // First, delete existing team members for this pitch
        await supabase
          .from('team_members')
          .delete()
          .eq('pitch_page_id', savedPitch.id)

        // Then insert new team members
        const teamMembersToSave = team_members
          .filter(member => member.name.trim() && member.role.trim() && member.experience.trim())
          .map((member, index) => ({
            pitch_page_id: savedPitch.id,
            name: member.name,
            role: member.role,
            experience: member.experience,
            linkedin_url: member.linkedin_url || null,
            bio: member.bio || null,
            avatar_url: member.avatar_url || null,
            display_order: index
          }))

        if (teamMembersToSave.length > 0) {
          const { error: teamError } = await supabase
            .from('team_members')
            .insert(teamMembersToSave)

          if (teamError) throw teamError
        }
      }
      
      alert('Pitch published successfully!')
      router.push('/dashboard/pitch-pages')
    } catch (error) {
      console.error('Error publishing pitch:', error)
      alert('Failed to publish pitch')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📋</span>
                <h2 className="text-xl font-bold mb-2">No Approved Applications</h2>
                <p className="text-gray-600 mb-6">
                  You need an approved Advance Assurance application before creating a pitch page.
                </p>
                <Button onClick={() => router.push('/make-ready')}>
                  <span className="mr-2">📝</span>
                  Submit Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Investor Pitch Page</h1>
          <p className="text-gray-600">Build a compelling pitch page to attract investors</p>
        </div>

        {/* Application Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Application</CardTitle>
            <CardDescription>
              Choose which approved application to create a pitch page for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedApplication}
              onChange={(e) => handleApplicationSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select an application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company_name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedApplication && (
          <div className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pitch Title *
                  </label>
                  <Input
                    value={pitchData.pitch_title}
                    onChange={(e) => handleInputChange('pitch_title', e.target.value)}
                    placeholder="e.g., TechStart Ltd - Series A Investment Opportunity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elevator Pitch (30 seconds) *
                  </label>
                  <textarea
                    value={pitchData.elevator_pitch}
                    onChange={(e) => handleInputChange('elevator_pitch', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="A compelling 30-second summary of your business..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video URL (YouTube/Vimeo)
                    </label>
                    <Input
                      value={pitchData.video_url || ''}
                      onChange={(e) => handleInputChange('video_url', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Demo URL
                    </label>
                    <Input
                      value={pitchData.demo_url || ''}
                      onChange={(e) => handleInputChange('demo_url', e.target.value)}
                      placeholder="https://demo.yourcompany.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem & Solution */}
            <Card>
              <CardHeader>
                <CardTitle>Problem & Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Statement *
                  </label>
                  <textarea
                    value={pitchData.problem_statement}
                    onChange={(e) => handleInputChange('problem_statement', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="What problem are you solving? Why is it important?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Solution Description *
                  </label>
                  <textarea
                    value={pitchData.solution_description}
                    onChange={(e) => handleInputChange('solution_description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="How does your product/service solve this problem?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competitive Advantage
                  </label>
                  <textarea
                    value={pitchData.competitive_advantage}
                    onChange={(e) => handleInputChange('competitive_advantage', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="What makes you different from competitors?"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Market & Business Model */}
            <Card>
              <CardHeader>
                <CardTitle>Market & Business Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Size & Opportunity
                  </label>
                  <textarea
                    value={pitchData.market_size}
                    onChange={(e) => handleInputChange('market_size', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Total addressable market, target market size..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Model
                  </label>
                  <textarea
                    value={pitchData.business_model}
                    onChange={(e) => handleInputChange('business_model', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="How do you make money? Revenue streams, pricing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Financial Projections
                  </label>
                  <textarea
                    value={pitchData.financial_projections}
                    onChange={(e) => handleInputChange('financial_projections', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Revenue projections, key metrics, growth plans..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Funding Details */}
            <Card>
              <CardHeader>
                <CardTitle>Funding Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funding Requirements *
                  </label>
                  <textarea
                    value={pitchData.funding_requirements}
                    onChange={(e) => handleInputChange('funding_requirements', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="How much funding do you need and why?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Use of Funds
                  </label>
                  <textarea
                    value={pitchData.use_of_funds_detailed}
                    onChange={(e) => handleInputChange('use_of_funds_detailed', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Breakdown of how you'll use the investment..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Valuation (£)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.target_valuation || ''}
                      onChange={(e) => handleInputChange('target_valuation', parseInt(e.target.value))}
                      placeholder="2000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Investment (£)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.minimum_investment || ''}
                      onChange={(e) => handleInputChange('minimum_investment', parseInt(e.target.value))}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Investment (£)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.maximum_investment || ''}
                      onChange={(e) => handleInputChange('maximum_investment', parseInt(e.target.value))}
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Type
                    </label>
                    <select
                      value={pitchData.investment_type}
                      onChange={(e) => handleInputChange('investment_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="equity">Equity</option>
                      <option value="convertible">Convertible Note</option>
                      <option value="safe">SAFE</option>
                      <option value="debt">Debt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equity Offered
                    </label>
                    <Input
                      value={pitchData.equity_offered}
                      onChange={(e) => handleInputChange('equity_offered', e.target.value)}
                      placeholder="e.g., 10-15% for £250k"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>👥 Team</span>
                  <Button type="button" onClick={addTeamMember} size="sm">
                    ➕ Add Team Member
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add key team members to showcase your expertise and experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pitchData.team_members?.map((member, index) => (
                  <Card key={member.id} className="border-2 border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar Section */}
                          <div className="relative">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name || 'Team member'}
                                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-200">
                                <span className="text-purple-600 font-semibold text-lg">
                                  {member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '👤'}
                                </span>
                              </div>
                            )}
                            <label className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-1 cursor-pointer hover:bg-purple-700 transition-colors">
                              <span className="text-xs">📷</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleAvatarUpload(member.id, file)
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {member.name || `Team Member ${index + 1}`}
                            </h4>
                            <p className="text-sm text-purple-600 font-medium">
                              {member.role || 'Role not specified'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => removeTeamMember(member.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          🗑️ Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <Input
                            value={member.name}
                            onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                            placeholder="John Smith"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role/Title *
                          </label>
                          <Input
                            value={member.role}
                            onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                            placeholder="CEO & Co-Founder"
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience & Background *
                        </label>
                        <textarea
                          value={member.experience}
                          onChange={(e) => updateTeamMember(member.id, 'experience', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="10+ years in fintech, former VP at Goldman Sachs, MBA from Wharton..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LinkedIn Profile
                        </label>
                        <Input
                          value={member.linkedin_url || ''}
                          onChange={(e) => updateTeamMember(member.id, 'linkedin_url', e.target.value)}
                          placeholder="https://linkedin.com/in/johnsmith"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Bio
                        </label>
                        <textarea
                          value={member.bio || ''}
                          onChange={(e) => updateTeamMember(member.id, 'bio', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Additional information about achievements, awards, publications..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!pitchData.team_members || pitchData.team_members.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>👥 No team members added yet</p>
                    <p className="text-sm">Click "Add Team Member" to showcase your team</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Overview (Optional)
                  </label>
                  <textarea
                    value={pitchData.team_description}
                    onChange={(e) => handleInputChange('team_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Overall team strengths, culture, and why this team is uniquely positioned to succeed..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Milestones & Achievements</CardTitle>
                <CardDescription>
                  Highlight past achievements and future milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Milestones & Achievements
                  </label>
                  <textarea
                    value={pitchData.milestones}
                    onChange={(e) => handleInputChange('milestones', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Past achievements and future milestones..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Traction & Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Traction & Key Metrics</CardTitle>
                <CardDescription>
                  Show your progress and key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Traction
                  </label>
                  <textarea
                    value={pitchData.current_traction || ''}
                    onChange={(e) => handleInputChange('current_traction', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Customer numbers, revenue, partnerships, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Recurring Revenue (£)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.monthly_revenue || ''}
                      onChange={(e) => handleInputChange('monthly_revenue', parseInt(e.target.value) || 0)}
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Count
                    </label>
                    <Input
                      type="number"
                      value={pitchData.customer_count || ''}
                      onChange={(e) => handleInputChange('customer_count', parseInt(e.target.value) || 0)}
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Growth Rate (% monthly)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={pitchData.growth_rate || ''}
                      onChange={(e) => handleInputChange('growth_rate', parseFloat(e.target.value) || 0)}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Burn Rate (£/month)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.burn_rate || ''}
                      onChange={(e) => handleInputChange('burn_rate', parseInt(e.target.value) || 0)}
                      placeholder="8000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product & Technology */}
            <Card>
              <CardHeader>
                <CardTitle>Product & Technology</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    value={pitchData.product_description || ''}
                    onChange={(e) => handleInputChange('product_description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Detailed description of your product or service..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technology Stack
                  </label>
                  <textarea
                    value={pitchData.technology_stack || ''}
                    onChange={(e) => handleInputChange('technology_stack', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Technologies, platforms, and infrastructure used..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intellectual Property
                  </label>
                  <textarea
                    value={pitchData.intellectual_property || ''}
                    onChange={(e) => handleInputChange('intellectual_property', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Patents, trademarks, proprietary technology..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer & Marketing */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Marketing Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Customer Profile
                  </label>
                  <textarea
                    value={pitchData.target_customers || ''}
                    onChange={(e) => handleInputChange('target_customers', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Who are your ideal customers? Demographics, needs, pain points..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marketing Strategy
                  </label>
                  <textarea
                    value={pitchData.marketing_strategy || ''}
                    onChange={(e) => handleInputChange('marketing_strategy', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="How do you acquire customers? Marketing channels, partnerships..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Acquisition Cost (£)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.customer_acquisition_cost || ''}
                      onChange={(e) => handleInputChange('customer_acquisition_cost', parseInt(e.target.value) || 0)}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Lifetime Value (£)
                    </label>
                    <Input
                      type="number"
                      value={pitchData.customer_lifetime_value || ''}
                      onChange={(e) => handleInputChange('customer_lifetime_value', parseInt(e.target.value) || 0)}
                      placeholder="500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investor Benefits
                  </label>
                  <textarea
                    value={pitchData.investor_benefits}
                    onChange={(e) => handleInputChange('investor_benefits', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="What benefits do investors get beyond equity?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exit Strategy
                  </label>
                  <textarea
                    value={pitchData.exit_strategy}
                    onChange={(e) => handleInputChange('exit_strategy', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Potential exit opportunities (IPO, acquisition, etc.)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risks & Challenges
                  </label>
                  <textarea
                    value={pitchData.risks_challenges}
                    onChange={(e) => handleInputChange('risks_challenges', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Key risks and how you plan to mitigate them..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Social Media & Links
                  </label>
                  <textarea
                    value={pitchData.social_media_links}
                    onChange={(e) => handleInputChange('social_media_links', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="LinkedIn, Twitter, website, etc. (one per line)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Preferences
                  </label>
                  <textarea
                    value={pitchData.contact_preferences}
                    onChange={(e) => handleInputChange('contact_preferences', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="How should investors contact you? Preferred communication methods..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>* Required fields must be completed before publishing</p>
                    <p>Save as draft to continue editing later</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={saving}
                    >
                      <span className="mr-2">💾</span>
                      Save Draft
                    </Button>
                    <Button
                      onClick={handlePublish}
                      disabled={saving}
                    >
                      <span className="mr-2">🚀</span>
                      {saving ? 'Publishing...' : 'Publish Pitch'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
