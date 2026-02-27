import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useToast } from '@/hooks/use-toast'

const CODE_LENGTH = 6
const RESEND_SECONDS = 30

const signupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { registerPublicUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [formError, setFormError] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<SignupValues | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))

  const beginVerification = (values: SignupValues) => {
    const code = generateCode()
    setPendingUser({ ...values })
    setVerificationCode(code)
    setOtpValue('')
    setVerificationError(null)
    setResendCooldown(RESEND_SECONDS)
    setStep('verify')
    toast({ title: 'Verification code sent', description: `Demo code: ${code}` })
  }

  const handleSignup = async (values: SignupValues) => {
    setFormError(null)
    setVerificationError(null)
    try {
      beginVerification(values)
    } catch (error) {
      console.error(error)
      setFormError(error instanceof Error ? error.message : 'Unable to start verification right now.')
    }
  }

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingUser) return

    if (otpValue.length < CODE_LENGTH) {
      setVerificationError('Enter the 6-digit code sent to your email')
      return
    }
    if (otpValue !== verificationCode) {
      setVerificationError('Incorrect verification code')
      return
    }

    setVerificationError(null)
    try {
      setIsVerifying(true)
      await registerPublicUser({ email: pendingUser.email, password: pendingUser.password })
      navigate('/login', { state: { email: pendingUser.email } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify signup right now.'
      setVerificationError(message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = () => {
    if (!pendingUser || resendCooldown > 0) return
    beginVerification(pendingUser)
  }

  const handleEditDetails = () => {
    if (pendingUser) {
      form.reset({ ...pendingUser })
    }
    setStep('form')
    setOtpValue('')
    setVerificationError(null)
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-[40%] flex-col justify-between p-10 relative overflow-hidden" style={{ background: '#111318' }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, rgba(43,127,255,0.15), transparent 60%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.1), transparent 50%), radial-gradient(circle at 60% 80%, rgba(6,182,212,0.08), transparent 40%)',
          }}
        />
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
          <h2 className="text-xl font-semibold text-white">Create a citizen insights account</h2>
          <p className="text-sm text-[#9BA3AF] leading-relaxed">
            Signing up grants you access to the public dashboard with live incidents, alerts, and safety insights for your city.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-blink" />
            <span className="font-mono text-xs text-[#22C55E]">Encrypted citizen access enabled</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Public Access</p>
            <h2 className="font-heading text-2xl font-bold text-foreground">{step === 'form' ? 'Create your NazarIQ ID' : 'Verify your email'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 'form'
                ? 'Public accounts only. Admin access remains invitation-based.'
                : 'Enter the one-time code we just sent to confirm your citizen account.'}
            </p>
          </div>

          {step === 'form' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@citizen.in" className="h-10" {...field} />
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
                        <Input type="password" placeholder="••••••••" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}
                <Button type="submit" className="w-full h-10 font-semibold" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Preparing verification…' : 'Send verification code'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </form>
            </Form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                <p>
                  We sent a 6-digit verification code to{' '}
                  <span className="font-semibold text-foreground">{pendingUser?.email}</span>. Enter it below to activate your citizen access.
                </p>
              </div>
              <InputOTP maxLength={CODE_LENGTH} value={otpValue} onChange={setOtpValue} containerClassName="justify-center">
                <InputOTPGroup>
                  {Array.from({ length: CODE_LENGTH }).map((_, idx) => (
                    <InputOTPSlot key={idx} index={idx} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {verificationError && <p className="text-xs font-medium text-destructive text-center">{verificationError}</p>}
              <Button type="submit" className="w-full h-10 font-semibold" disabled={isVerifying}>
                {isVerifying ? 'Verifying…' : 'Verify & Create account'}
              </Button>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="text-primary hover:underline disabled:opacity-50">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button type="button" onClick={handleEditDetails} className="hover:text-foreground">
                  Edit email
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[10px] text-muted-foreground">Citizen identities are stored locally for this demo experience.</p>
        </div>
      </div>
    </div>
  )
}
