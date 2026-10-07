'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ShieldCheck, Leaf, Sparkles } from 'lucide-react'
import { LoginForm, SocialAuthButtons } from '../components'

export function LoginScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // 3D Card Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rx = (y / (rect.height / 2)) * -12
    const ry = (x / (rect.width / 2)) * 12
    cardRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`
  }

  // WebGL GLSL Shader Canvas Renderer (ANIMATION_36)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return

    let animationFrameId: number
    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2

    const handleWindowMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouseX = nx * canvas.width
        mouseY = ny * canvas.height
      }
    }

    window.addEventListener('mousemove', handleWindowMouseMove)

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 mouse = u_mouse / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = st;
        p.x *= aspect;

        float t = u_time * 0.35;

        float distToMouse = distance(st, mouse);
        vec2 mouseInfluence = (st - mouse) * exp(-distToMouse * 4.0) * 0.15;
        p += mouseInfluence;

        float q = snoise(p * 2.2 + vec2(t * 0.2, t * 0.15));
        float r = snoise(p * 3.5 + vec2(q, t * 0.25));
        float f = snoise(p * 1.8 + vec2(r * 1.2, -t * 0.3));

        vec3 cDeepForest = vec3(0.04, 0.18, 0.11);
        vec3 cEmerald    = vec3(0.055, 0.384, 0.271);
        vec3 cLeafLush   = vec3(0.09, 0.52, 0.34);
        vec3 cGoldenSun  = vec3(0.95, 0.79, 0.18);
        vec3 cMintShine  = vec3(0.42, 0.85, 0.65);

        vec3 col = mix(cDeepForest, cEmerald, smoothstep(-0.6, 0.6, f));
        col = mix(col, cLeafLush, smoothstep(-0.2, 0.8, r));

        float caustics = pow(max(0.0, snoise(p * 6.0 + vec2(-t * 0.5, t * 0.4))), 2.5);
        col += cMintShine * caustics * 0.35;

        float goldSpeck = pow(max(0.0, snoise(p * 4.0 + vec2(t*0.3, -t*0.2))), 3.5);
        col = mix(col, cGoldenSun, goldSpeck * 0.4);

        float vig = smoothstep(1.2, 0.2, length(st - 0.5));
        col *= vig * 0.85 + 0.15;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    function compileShader(type: number, source: string) {
      if (!gl) return null
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const positionLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    const resizeCanvas = () => {
      if (!canvas) return
      const width = canvas.clientWidth || 640
      const height = canvas.clientHeight || 720
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    resizeCanvas()

    const render = (time: number) => {
      resizeCanvas()
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (uTime) gl.uniform1f(uTime, time * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-slate-800 font-sans antialiased flex items-center justify-center p-3 sm:p-6 md:p-10 lg:p-12 relative overflow-hidden selection:bg-[#0e6245] selection:text-white">

      {/* Ambient Decorative Canvas: Morphing Saffron Blobs & Floating Confetti */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-Right Vibrant Saffron Blob */}
        <div className="absolute -top-24 -right-24 w-[380px] h-[380px] bg-[#ffea3b] rounded-[45%_55%_65%_35%/50%_45%_55%_50%] opacity-90 blur-xs animate-pulse" />
        {/* Bottom-Left Saffron Accent Blob */}
        <div className="absolute -bottom-28 -left-28 w-[440px] h-[440px] bg-[#ffd54f] rounded-[60%_40%_45%_55%/40%_60%_50%_50%] opacity-95 blur-xs" />

        {/* Floating Geometric Confetti */}
        <div className="absolute top-12 left-[32%] w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[20px] border-b-[#ff2d55] opacity-80 animate-bounce" />
        <div className="absolute bottom-16 left-[24%] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[15px] border-b-[#ff80ab] opacity-75" />
        <div className="absolute top-20 right-[30%] w-7 h-7 bg-[#ffd600] rounded-full opacity-85 shadow-xs" />
        <div className="absolute top-[52%] left-10 w-4 h-4 bg-slate-300 rotate-45 opacity-60" />
        <div className="absolute bottom-24 left-[46%] w-12 h-12 rounded-full border-4 border-slate-200/80 opacity-60" />
        <div className="absolute bottom-14 right-[28%] w-5 h-5 bg-[#ffca28] rotate-45 opacity-90 shadow-xs" />
      </div>

      {/* Main Split Elevation Container (Split 46% / 54%) */}
      <main className="relative z-10 w-full max-w-[1280px] bg-white rounded-3xl shadow-[0_30px_90px_-20px_rgba(15,40,30,0.22)] border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row min-h-[740px]">

        {/* LEFT COLUMN: Authentication Credentials Panel (46% Width) */}
        <section className="w-full lg:w-[46%] bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10">
          <div>
            {/* Top Brand Bar */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0e6245] flex items-center justify-center shadow-md text-white font-black text-xl tracking-tighter shrink-0">
                  <Leaf className="h-5 w-5 fill-white" />
                </div>
                <div className="leading-tight">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#0e6245]">Govt. of India • MeitY</span>
                  <span className="block text-lg font-black tracking-tight text-slate-900">Scheme AI</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-[11px] font-bold">
                <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Sovereign Auth</span>
              </div>
            </div>

            {/* Hero Headline */}
            <div className="mb-7">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 leading-snug">
                We are <span className="text-[#0e6245]">scheme.ai</span>
              </h1>
              <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
                Welcome back. Access 4,160+ central and state citizen entitlements directly through sovereign authentication.
              </p>
            </div>

            {/* Authentication Method Segmented Tabs */}
            <div className="mb-6 p-1 bg-slate-100 rounded-xl flex text-xs font-bold text-slate-600 gap-1 border border-slate-200/60" role="tablist">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-2.5 rounded-lg transition duration-200 font-bold cursor-pointer ${
                  activeTab === 'login' ? 'bg-white text-[#0e6245] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 px-2.5 rounded-lg transition duration-200 font-bold cursor-pointer ${
                  activeTab === 'signup' ? 'bg-white text-[#0e6245] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google One-Click SSO */}
            <SocialAuthButtons />

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute px-3 bg-white text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or continue with email
              </span>
            </div>

            {/* Credential Form */}
            <LoginForm activeTab={activeTab} />
          </div>

          {/* Footer Legal & Compliance */}
          <footer className="mt-8 pt-6 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed font-medium">
            <p>
              By signing in, you agree to Scheme AI's{' '}
              <Link href="/privacy" className="font-bold text-slate-700 hover:text-[#0e6245] underline decoration-slate-300">
                Terms and Conditions
              </Link>{' '}
              &{' '}
              <Link href="/privacy" className="font-bold text-slate-700 hover:text-[#0e6245] underline decoration-slate-300">
                Privacy Policy
              </Link>.
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate-400">
              <span>NIC / MeitY Sovereign Infrastructure</span>
              <span className="flex items-center gap-1 font-bold text-[#166534]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                256-Bit SSL Live
              </span>
            </div>
          </footer>
        </section>

        {/* Floating Circular Coral Button on the Seam Divider */}
        <div className="hidden lg:flex absolute left-[46%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-[#ff2d55] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer animate-pulse"
            title="Interactive Gateway Seam"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* RIGHT COLUMN: WebGL Botanical Canvas & 3D Glassmorphic Emblem (54% Width) */}
        <section className="w-full lg:w-[54%] relative overflow-hidden bg-[#0a2e1c] min-h-[500px] lg:min-h-full flex flex-col justify-between p-6 sm:p-8 md:p-10 select-none">

          {/* Live WebGL Foliage Shader Canvas */}
          <div className="absolute inset-0 z-0">
            <canvas
              ref={canvasRef}
              className="w-full h-full block object-cover"
            />
            {/* Dark vignette overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />
          </div>

          {/* Top Right Mini-Navigation Header */}
          <header className="relative z-20 flex items-center justify-end">
            <nav className="flex items-center gap-4 sm:gap-6 text-[11px] font-semibold uppercase tracking-wider text-white/80">
              <a className="hover:text-white transition duration-150" href="#about">About Us</a>
              <a className="text-white font-bold transition duration-150 border-b-2 border-[#ffd600] pb-0.5" href="#showcase">Showcase</a>
              <a className="hover:text-white transition duration-150" href="#contact">Contact</a>
            </nav>
          </header>

          {/* Center: Floating 3D Glassmorphic Emblem Card */}
          <div
            className="relative z-20 my-auto py-8 flex items-center justify-center"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              ref={cardRef}
              className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative group cursor-pointer transition-transform duration-150 ease-out"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Top Accent Dots */}
              <div className="flex items-center justify-between w-full">
                <div className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-xs" />
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                </div>
              </div>

              {/* Center Emblem & Leaf Icon */}
              <div className="my-auto flex flex-col items-center justify-center relative">
                <div className="absolute w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-1 -right-1 w-10 h-10 bg-[#ffd600] rounded-full blur-xs opacity-80" />
                    <Leaf className="w-12 h-12 text-white drop-shadow-md relative z-10 fill-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#ffd600] text-slate-900 font-black text-[9px] uppercase tracking-wider shadow-xs">
                    AI
                  </span>
                </div>

                <div className="text-center mt-1">
                  <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">Scheme AI</h2>
                  <p className="mt-1 text-xs font-bold text-emerald-100/90 tracking-wide">Sovereign Citizen Welfare Gateway</p>
                </div>
              </div>

              {/* Bottom Reference Micro Lines */}
              <div className="flex items-center justify-between w-full pt-1 opacity-70">
                <span className="text-[9px] uppercase tracking-widest text-white/80 font-bold">Govt. of India</span>
                <div className="flex flex-col gap-1 items-end">
                  <div className="w-5 h-0.5 bg-white/60 rounded-full" />
                  <div className="w-3 h-0.5 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Slider Footer Controls */}
          <footer className="relative z-20 flex items-center justify-between text-xs text-white pt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-[10px] font-bold tracking-widest text-white/70 ml-2">01 / 04 CITIZEN SERVICES</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/25 active:scale-95 transition cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                Previous
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/25 active:scale-95 transition cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                Next
              </button>
            </div>
          </footer>

        </section>

      </main>
    </div>
  )
}
