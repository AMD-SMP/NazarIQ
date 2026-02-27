import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['public', 'admin'], { required_error: 'Please pick an access role' }),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { loginWithCredentials } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const signupEmail = (location.state as { email?: string } | null)?.email ?? ''
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', role: 'public' },
  })

  useEffect(() => {
    if (signupEmail) {
      form.setValue('email', signupEmail)
      form.setFocus('password')
    }
  }, [signupEmail, form])

  const handleCredentialLogin = async (values: LoginValues) => {
    setFormError(null)
    try {
      const role = await loginWithCredentials(values)
      navigate(role === 'admin' ? '/admin' : '/')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
      setFormError(message)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - always dark */}
      <div className="hidden lg:flex w-[40%] flex-col justify-between p-10 relative overflow-hidden" style={{ background: '#111318' }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(43,127,255,0.15), transparent 60%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.1), transparent 50%), radial-gradient(circle at 60% 80%, rgba(6,182,212,0.08), transparent 40%)',
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-10 w-10 text-[#2B7FFF]" />
            <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="text-4xl font-extrabold text-white">
              Nazar<sup className="text-[#2B7FFF] text-lg">IQ</sup>
            </h1>
          </div>
          <p className="text-[#9BA3AF] text-lg">Watchful Intelligence for Every City</p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><p style={{ fontFamily: 'JetBrains Mono, monospace' }} className="text-3xl font-bold text-white">228</p><p className="text-[10px] uppercase tracking-widest text-[#5C6370]">Incidents Tracked</p></div>
            <div><p style={{ fontFamily: 'JetBrains Mono, monospace' }} className="text-3xl font-bold text-white">7</p><p className="text-[10px] uppercase tracking-widest text-[#5C6370]">Cities Monitored</p></div>
            <div><p style={{ fontFamily: 'JetBrains Mono, monospace' }} className="text-3xl font-bold text-white">96%</p><p className="text-[10px] uppercase tracking-widest text-[#5C6370]">AI Accuracy</p></div>
            <div><p style={{ fontFamily: 'JetBrains Mono, monospace' }} className="text-3xl font-bold text-white">18h</p><p className="text-[10px] uppercase tracking-widest text-[#5C6370]">Avg Resolution</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-blink" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }} className="text-xs text-[#22C55E]">LIVE — ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">Access the NazarIQ intelligence platform</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCredentialLogin)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@nazariq.gov.in" type="email" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Access Role</FormLabel>
                    <div className="flex gap-2">
                      {(['public', 'admin'] as const).map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.onChange(option)}
                          className={`flex-1 rounded border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                            field.value === option
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {option === 'public' ? 'Public' : 'Admin'}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}
              <Button className="w-full h-10 font-semibold" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Need an account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
              </p>
            </form>
          </Form>

          <p className="text-center text-[10px] text-muted-foreground">Secured by NazarIQ Intelligence Layer</p>
        </div>
      </div>
    </div>
  )
}
