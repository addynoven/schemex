'use client'

import React, { useEffect, useRef } from 'react'

export function CivicAuraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null

    if (!gl) return

    let animationFrameId: number | null = null
    let isVisible = true

    let targetMouseX = 0.5
    let targetMouseY = 0.5
    let currentMouseX = 0.5
    let currentMouseY = 0.5

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        targetMouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        targetMouseY = Math.max(0, Math.min(1, 1.0 - (e.clientY - rect.top) / rect.height))
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const vsSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `

    // High-craft Sovereign Security Guilloche Shader
    // Replaces blurry generic gradient blobs with banknote/sovereign security lathe curves
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform vec2 u_mouse;
      varying vec2 v_uv;

      void main() {
        vec2 st = gl_FragCoord.xy / u_res.xy;
        float aspect = u_res.x / u_res.y;
        vec2 p = (st - 0.5) * 2.0;
        p.x *= aspect;

        vec2 m = (u_mouse - 0.5) * 2.0;
        m.x *= aspect;

        float dist = length(p - m);
        float mouseImpulse = exp(-dist * 2.8) * 0.28;

        float t = u_time * 0.22;

        // Polar coordinates for guilloche rosette interference
        float r = length(p);
        float a = atan(p.y, p.x);

        // Security banknote lathe equation
        float g1 = sin(r * 18.0 - t * 1.5 + sin(a * 6.0 + t) * 2.2);
        float g2 = cos(r * 26.0 + t * 1.1 + cos(a * 8.0 - t * 0.8) * 2.6);
        float g3 = sin((p.x + p.y + mouseImpulse) * 14.0 - t * 0.9);

        float mesh = (g1 * 0.38 + g2 * 0.42 + g3 * 0.20);
        float lines = pow(abs(mesh), 6.0);

        // Micro-fine security filament grid
        float fineGrid = step(0.92, sin(p.x * 60.0 + sin(p.y * 30.0 + t) * 1.2));

        // Color Palette: Banknote Deep Forest, Sovereign Emerald, Mint Holographic Ink, Gold Filament
        vec3 cBaseDark   = vec3(0.012, 0.08, 0.045);  // #03140b
        vec3 cEmeraldMid = vec3(0.035, 0.22, 0.135);  // #093822
        vec3 cMintLine   = vec3(0.20, 0.86, 0.55);    // #33dc8c
        vec3 cGoldThread = vec3(0.92, 0.78, 0.32);    // #ebd452

        // Soft ambient field
        float ambientWave = sin(p.x * 2.0 + t) * cos(p.y * 2.0 - t * 0.7) * 0.5 + 0.5;
        vec3 col = mix(cBaseDark, cEmeraldMid, ambientWave * 0.65);

        // Guilloche security curve emission
        col += cMintLine * lines * 0.65;
        col += cGoldThread * fineGrid * 0.08;

        // Dynamic cursor interactive corona
        float cursorCorona = exp(-dist * 3.5) * 0.25;
        col += cGoldThread * cursorCorona;

        // Vignette
        float vig = smoothstep(1.8, 0.4, length(st - 0.5));
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    function createShader(type: number, source: string) {
      if (!gl) return null
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource)
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return
    }

    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const posLoc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uTimeLoc = gl.getUniformLocation(program, 'u_time')
    const uResLoc = gl.getUniformLocation(program, 'u_res')
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse')

    const resize = () => {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.floor(canvas.clientWidth * dpr) || 480
      const height = Math.floor(canvas.clientHeight * dpr) || 640

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    resize()

    const render = (time: number) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render)
        return
      }

      resize()
      gl.viewport(0, 0, canvas.width, canvas.height)

      currentMouseX += (targetMouseX - currentMouseX) * 0.08
      currentMouseY += (targetMouseY - currentMouseY) * 0.08

      if (uTimeLoc) gl.uniform1f(uTimeLoc, time * 0.001)
      if (uResLoc) gl.uniform2f(uResLoc, canvas.width, canvas.height)
      if (uMouseLoc) gl.uniform2f(uMouseLoc, currentMouseX, currentMouseY)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        isVisible = entry.isIntersecting && !document.hidden
      },
      { threshold: 0.1 },
    )
    observer.observe(canvas)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      observer.disconnect()
      if (animationFrameId) cancelAnimationFrame(animationFrameId)

      if (buffer) gl.deleteBuffer(buffer)
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      if (program) gl.deleteProgram(program)
    }
  }, [])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
        style={{ transform: 'translateZ(0)', willChange: 'contents' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
    </div>
  )
}
