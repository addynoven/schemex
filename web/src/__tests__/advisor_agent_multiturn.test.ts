import { describe, it, expect } from 'vitest'
import { generateAssistantReply } from '../lib/chat-server'

describe('Mobile-Aligned Multilingual AI Advisor Agent Suite', () => {
  it('Turn 0: Casual Greetings - returns polite intro with zero scheme leakage', async () => {
    const res = await generateAssistantReply('namaste, who are you?')
    expect(res).toContain('Namaste!')
    expect(res).toContain('AI Citizen Welfare Advisor')
    expect(res).not.toContain('Gemini request failed')
  })

  it('Turn 1: Specific Sector & State Inquiry - retrieves farmer schemes for Madhya Pradesh', async () => {
    const res = await generateAssistantReply('What schemes are available for small farmers in Madhya Pradesh?')
    expect(res).toContain('PM-Kisan')
    expect(res).toContain('Agriculture')
    expect(res).toContain('/check')
  })

  it('Turn 2: Follow-up Document Checklist - returns verified document requirements in Hinglish', async () => {
    const res = await generateAssistantReply('Kisan Samman Nidhi ke liye document kya chahiye?')
    expect(res).toContain('Required Documents for PM-Kisan')
    expect(res).toContain('Aadhaar Card')
    expect(res).toContain('Land Record')
    expect(res).toContain('Bank Passbook')
    expect(res).toContain('/vault')
  })

  it('Turn 3: Application Procedure & Eligibility Guide - returns 3-step online application workflow', async () => {
    const res = await generateAssistantReply('How do I check my eligibility and apply online?')
    expect(res).toContain('How to Check Eligibility & Apply Online')
    expect(res).toContain('Step 1')
    expect(res).toContain('Step 2')
    expect(res).toContain('Step 3')
    expect(res).toContain('/check')
    expect(res).toContain('/vault')
    expect(res).toContain('/schemes')
  })
})
