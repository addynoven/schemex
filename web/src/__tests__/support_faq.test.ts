import { describe, it, expect } from 'vitest'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: 'schemes' | 'documents' | 'account'
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-eligibility',
    question: 'How do I check my eligibility for a welfare scheme?',
    answer: 'Go to the Eligibility Check tab and fill in your details.',
    category: 'schemes',
  },
  {
    id: 'faq-upload',
    question: 'How do I upload and manage documents in the Vault?',
    answer: 'Open Document Vault and upload a PDF or image file.',
    category: 'documents',
  },
  {
    id: 'faq-free',
    question: 'Is Scheme Navigator free for citizens?',
    answer: 'Yes, Scheme Navigator is 100% free for all Indian citizens.',
    category: 'account',
  },
]

describe('Help & Support FAQ Domain Tests', () => {
  it('loads FAQ items with valid categories', () => {
    expect(FAQ_DATA.length).toBe(3)
    const eligibilityFaq = FAQ_DATA.find((f) => f.id === 'faq-eligibility')
    expect(eligibilityFaq).toBeDefined()
    expect(eligibilityFaq?.category).toBe('schemes')
  })

  it('filters FAQs by search keyword query', () => {
    const query = 'vault'
    const matches = FAQ_DATA.filter(
      (f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)
    )

    expect(matches.length).toBe(1)
    expect(matches[0].id).toBe('faq-upload')
  })

  it('filters FAQs by category', () => {
    const accountFaqs = FAQ_DATA.filter((f) => f.category === 'account')
    expect(accountFaqs.length).toBe(1)
    expect(accountFaqs[0].category).toBe('account')
  })
})
