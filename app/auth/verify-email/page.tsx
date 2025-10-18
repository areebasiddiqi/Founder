'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-12 w-12 text-purple-600 mb-4" />
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a verification link to complete your registration
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Please check your email and click the verification link to activate your account.
            You may need to check your spam folder.
          </p>
          
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
