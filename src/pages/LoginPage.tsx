import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (role: 'public' | 'admin') => {
    login(role)
    navigate(role === 'admin' ? '/admin' : '/')
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

          <div className="space-y-3">
            <Input placeholder="Email" type="email" className="h-10" />
            <Input placeholder="Password" type="password" className="h-10" />
            <Button className="w-full h-10 font-semibold" onClick={() => handleLogin('admin')}>
              Sign In
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-background px-3 text-muted-foreground">Quick Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-10 text-xs font-semibold" onClick={() => handleLogin('public')}>
              Enter as Public
            </Button>
            <Button className="h-10 text-xs font-semibold" onClick={() => handleLogin('admin')}>
              Enter as Admin
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">Secured by NazarIQ Intelligence Layer</p>
        </div>
      </div>
    </div>
  )
}
