'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { FileUpload } from '@/components/file-upload'
import { supabase } from '@/lib/supabase'

export default function MakeReadyPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    incorporationDate: '',
    utrNumber: '',
    registeredAddress: '',
    investmentSummary: '',
    useOfFunds: '',
  })

  const [directors, setDirectors] = useState([
    { name: '', position: '', shareholding: '' }
  ])

  const [shareholders, setShareholders] = useState([
    { name: '', shares: '', percentage: '' }
  ])

  const [files, setFiles] = useState({
    businessPlan: null as string | null,
    pitchDeck: null as string | null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Get current user and load existing draft
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load existing draft if it exists
        const { data: application } = await supabase
          .from('advance_assurance_applications')
          .select('*')
          .eq('founder_id', user.id)
          .eq('status', 'draft')
          .single()
        
        if (application) {
          // Populate form with existing data
          setFormData({
            companyName: application.company_name || '',
            incorporationDate: application.incorporation_date || '',
            utrNumber: application.utr_number || '',
            registeredAddress: application.registered_address || '',
            investmentSummary: application.investment_summary || '',
            useOfFunds: application.use_of_funds || '',
          })
          
          if (application.directors) {
            setDirectors(JSON.parse(application.directors))
          }
          
          if (application.shareholders) {
            setShareholders(JSON.parse(application.shareholders))
          }
          
          setFiles({
            businessPlan: application.business_plan_url,
            pitchDeck: application.pitch_deck_url
          })
        }
      }
    }
    getUser()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addDirector = () => {
    setDirectors([...directors, { name: '', position: '', shareholding: '' }])
  }

  const addShareholder = () => {
    setShareholders([...shareholders, { name: '', shares: '', percentage: '' }])
  }

  const handleSaveDraft = async () => {
    if (!user) {
      alert('Please log in to save your application')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Prepare application data
      const applicationData = {
        founder_id: user.id,
        company_name: formData.companyName,
        incorporation_date: formData.incorporationDate,
        utr_number: formData.utrNumber || null,
        registered_address: formData.registeredAddress,
        directors: JSON.stringify(directors),
        shareholders: JSON.stringify(shareholders),
        investment_summary: formData.investmentSummary,
        use_of_funds: formData.useOfFunds,
        business_plan_url: files.businessPlan || null,
        pitch_deck_url: files.pitchDeck || null,
        status: 'draft'
      }
      
      // Check if application already exists
      const { data: existing } = await supabase
        .from('advance_assurance_applications')
        .select('id')
        .eq('founder_id', user.id)
        .eq('status', 'draft')
        .single()
      
      if (existing) {
        // Update existing draft
        const { error } = await supabase
          .from('advance_assurance_applications')
          .update(applicationData)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Create new draft
        const { error } = await supabase
          .from('advance_assurance_applications')
          .insert(applicationData)
        
        if (error) throw error
      }
      
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please log in to submit your application')
      return
    }
    
    if (!files.businessPlan) {
      alert('Please upload your business plan')
      return
    }
    
    // Validate required fields
    if (!formData.companyName || !formData.incorporationDate || !formData.registeredAddress || 
        !formData.investmentSummary || !formData.useOfFunds) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Prepare application data
      const applicationData = {
        founder_id: user.id,
        company_name: formData.companyName,
        incorporation_date: formData.incorporationDate,
        utr_number: formData.utrNumber || null,
        registered_address: formData.registeredAddress,
        directors: JSON.stringify(directors),
        shareholders: JSON.stringify(shareholders),
        investment_summary: formData.investmentSummary,
        use_of_funds: formData.useOfFunds,
        business_plan_url: files.businessPlan || null,
        pitch_deck_url: files.pitchDeck || null,
        status: 'submitted'
      }
      
      // Check if draft exists to update, otherwise create new
      const { data: existing } = await supabase
        .from('advance_assurance_applications')
        .select('id')
        .eq('founder_id', user.id)
        .in('status', ['draft', 'submitted'])
        .single()
      
      if (existing) {
        // Update existing application
        const { error } = await supabase
          .from('advance_assurance_applications')
          .update(applicationData)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Create new application
        const { error } = await supabase
          .from('advance_assurance_applications')
          .insert(applicationData)
        
        if (error) throw error
      }
      
      alert('Application submitted successfully! You will receive an email confirmation shortly.')
      
      // Optionally redirect to dashboard
      // window.location.href = '/dashboard'
      
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Make Ready</h1>
          <p className="mt-2 text-gray-600">
            Complete your SEIS/EIS Advance Assurance application to become investor-ready
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">🏢</span>
                Company Details
              </CardTitle>
              <CardDescription>
                Basic information about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="incorporationDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Incorporation Date *
                  </label>
                  <Input
                    id="incorporationDate"
                    name="incorporationDate"
                    type="date"
                    value={formData.incorporationDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="utrNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    UTR Number
                  </label>
                  <Input
                    id="utrNumber"
                    name="utrNumber"
                    value={formData.utrNumber}
                    onChange={handleInputChange}
                    placeholder="Enter UTR number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="registeredAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Registered Address *
                </label>
                <textarea
                  id="registeredAddress"
                  name="registeredAddress"
                  value={formData.registeredAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter full registered address"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Directors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">👥</span>
                Directors
              </CardTitle>
              <CardDescription>
                Information about company directors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {directors.map((director, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Director Name *
                    </label>
                    <Input
                      value={director.name}
                      onChange={(e) => {
                        const newDirectors = [...directors]
                        newDirectors[index].name = e.target.value
                        setDirectors(newDirectors)
                      }}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position *
                    </label>
                    <Input
                      value={director.position}
                      onChange={(e) => {
                        const newDirectors = [...directors]
                        newDirectors[index].position = e.target.value
                        setDirectors(newDirectors)
                      }}
                      placeholder="e.g., CEO, CTO"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shareholding %
                    </label>
                    <Input
                      value={director.shareholding}
                      onChange={(e) => {
                        const newDirectors = [...directors]
                        newDirectors[index].shareholding = e.target.value
                        setDirectors(newDirectors)
                      }}
                      placeholder="e.g., 25%"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addDirector}>
                Add Another Director
              </Button>
            </CardContent>
          </Card>

          {/* Investment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 w-5 h-5" />
                Investment Details
              </CardTitle>
              <CardDescription>
                Details about your fundraising plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="investmentSummary" className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Summary *
                </label>
                <textarea
                  id="investmentSummary"
                  name="investmentSummary"
                  value={formData.investmentSummary}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe your business, market opportunity, and investment proposition"
                  required
                />
              </div>

              <div>
                <label htmlFor="useOfFunds" className="block text-sm font-medium text-gray-700 mb-1">
                  Use of Funds *
                </label>
                <textarea
                  id="useOfFunds"
                  name="useOfFunds"
                  value={formData.useOfFunds}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Explain how you will use the investment funds"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">📤</span>
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload required documents for your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FileUpload
                  onUploadComplete={(fileUrl) => {
                    // The FileUpload component returns a URL string, not a File object
                    console.log('Business plan uploaded:', fileUrl)
                    // Store the file info for form submission
                    setFiles(prev => ({ ...prev, businessPlan: fileUrl as any }))
                  }}
                  onUploadError={(error) => {
                    console.error('Business plan upload error:', error)
                    alert(`Failed to upload business plan: ${error}`)
                  }}
                  bucket="documents"
                  folder="business-plans"
                  userId={user?.id || ''}
                  acceptedTypes={['.pdf']}
                  maxSize={10}
                  label="Business Plan *"
                  description="Upload your business plan (PDF, max 10MB)"
                  required={true}
                />
              </div>

              <div>
                <FileUpload
                  onUploadComplete={(fileUrl) => {
                    // The FileUpload component returns a URL string, not a File object
                    console.log('Pitch deck uploaded:', fileUrl)
                    // Store the file info for form submission
                    setFiles(prev => ({ ...prev, pitchDeck: fileUrl as any }))
                  }}
                  onUploadError={(error) => {
                    console.error('Pitch deck upload error:', error)
                    alert(`Failed to upload pitch deck: ${error}`)
                  }}
                  bucket="documents"
                  folder="pitch-decks"
                  userId={user?.id || ''}
                  acceptedTypes={['.pdf']}
                  maxSize={10}
                  label="Pitch Deck (Optional)"
                  description="Upload your pitch deck (PDF, max 10MB)"
                  required={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
