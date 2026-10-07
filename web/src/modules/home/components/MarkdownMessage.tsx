'use client'

import React from 'react'
import { Link } from '@/router'
import { ExternalLink, Sparkles, BookOpen, ChevronRight } from 'lucide-react'

interface MarkdownMessageProps {
  content: string
}

type ContentBlock =
  | { type: 'line'; text: string; idx: number }
  | { type: 'table'; headers: string[]; rows: string[][]; idx: number }

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  if (!content) return null

  const lines = content.split('\n')

  function renderInline(text: string): React.ReactNode[] {
    if (!text) return []
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Match Markdown Links: [label](url), Bold: **text**, Code: `text`, Italic: *text*
    const regex = /(\[((?:\[[^\]]*\]|[^\]])+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      const inlineKey = `inline-${match.index}-${lastIndex}`

      if (match[0].startsWith('[')) {
        const label = match[2]
        let url = match[3].trim()

        if (url.startsWith('knowledge/schemes/') && url.endsWith('.md')) {
          const slug = url.replace('knowledge/schemes/', '').replace('.md', '')
          url = `/schemes/${slug}`
        }

        const isInternal = url.startsWith('/') || url.startsWith('#') || url.includes('/schemes/')

        if (isInternal) {
          const cleanUrl = url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`
          parts.push(
            <Link
              key={inlineKey}
              to={cleanUrl as any}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#BBF7D0] text-[#166534] font-bold text-xs transition-all shadow-2xs group"
            >
              <BookOpen className="h-3 w-3 text-[#0E6245] shrink-0 group-hover:scale-110 transition-transform" />
              <span>{label}</span>
              <ChevronRight className="h-2.5 w-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )
        } else {
          parts.push(
            <a
              key={inlineKey}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0E6245] font-semibold text-xs transition-all shadow-2xs group"
            >
              <span>{label}</span>
              <ExternalLink className="h-2.5 w-2.5 text-[#0E6245] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )
        }
      } else if (match[0].startsWith('**')) {
        parts.push(
          <strong key={inlineKey} className="font-bold text-slate-900">
            {match[4]}
          </strong>
        )
      } else if (match[0].startsWith('`')) {
        parts.push(
          <code
            key={inlineKey}
            className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs"
          >
            {match[5]}
          </code>
        )
      } else if (match[0].startsWith('*')) {
        parts.push(
          <em key={inlineKey} className="italic text-slate-700">
            {match[6]}
          </em>
        )
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  function renderCellContent(text: string): React.ReactNode {
    if (!text) return null
    const subLines = text.split(/<br\s*\/?>/gi)
    if (subLines.length <= 1) return renderInline(text)
    return (
      <span className="inline-block space-y-1">
        {subLines.map((sub, sIdx) => {
          const trimmedSub = sub.trim()
          if (!trimmedSub) return null
          return (
            <span key={sIdx} className="block leading-relaxed">
              {renderInline(trimmedSub)}
            </span>
          )
        })}
      </span>
    )
  }

  // Parse lines into structured Blocks (Lines vs Tables)
  const blocks: ContentBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check if line starts a markdown table (| ... |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim().startsWith('|') &&
        lines[i].trim().endsWith('|')
      ) {
        tableLines.push(lines[i].trim())
        i++
      }

      // Parse table headers & data rows
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim())

        const headers = parseRow(tableLines[0])
        const isDelimiter = (r: string) => /^[\s|-]+$/.test(r)

        // Filter out delimiter row (|---|---|)
        const dataRows = tableLines
          .slice(1)
          .filter((r) => !isDelimiter(r))
          .map(parseRow)

        blocks.push({
          type: 'table',
          headers,
          rows: dataRows,
          idx: i,
        })
        continue
      }
    }

    blocks.push({ type: 'line', text: line, idx: i })
    i++
  }

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-800 font-normal">
      {blocks.map((block, blockIndex) => {
        const blockKey = `blk-${blockIndex}-${block.idx}`

        if (block.type === 'table') {
          return (
            <div
              key={blockKey}
              className="overflow-x-auto my-3 rounded-2xl border border-slate-200 bg-white shadow-2xs"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100/90 text-slate-900 border-b border-slate-200 font-bold">
                  <tr>
                    {block.headers.map((cell, cIdx) => (
                      <th
                        key={`th-${cIdx}`}
                        className="px-3.5 py-2.5 border-r border-slate-200/80 last:border-r-0 uppercase tracking-wider text-[11px] text-slate-700"
                      >
                        {renderCellContent(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {block.rows.map((rowCells, rIdx) => (
                    <tr
                      key={`tr-${rIdx}`}
                      className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/40"
                    >
                      {rowCells.map((cell, cIdx) => (
                        <td
                          key={`td-${rIdx}-${cIdx}`}
                          className="px-3.5 py-2.5 border-r border-slate-100 last:border-r-0 text-slate-800 leading-relaxed align-top"
                        >
                          {renderCellContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        const trimmed = block.text.trim()

        if (!trimmed) {
          return <div key={blockKey} className="h-1.5" />
        }

        // Horizontal Divider
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return <hr key={blockKey} className="border-slate-200 my-3" />
        }

        // Headings: H1, H2, H3, H4
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={blockKey} className="text-base sm:text-lg font-black text-slate-900 mt-4 mb-2 flex items-center gap-2 tracking-tight">
              <Sparkles className="h-4 w-4 text-[#0E6245] shrink-0" />
              <span>{renderCellContent(trimmed.replace('# ', ''))}</span>
            </h2>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={blockKey} className="text-sm sm:text-base font-extrabold text-slate-900 mt-3.5 mb-1.5 flex items-center gap-2 tracking-tight">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{renderCellContent(trimmed.replace('## ', ''))}</span>
            </h3>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={blockKey}
              className="text-xs sm:text-sm font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-2 pb-1 border-b border-slate-100"
            >
              <span>{renderCellContent(trimmed.replace('### ', ''))}</span>
            </h4>
          )
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={blockKey}
              className="border-l-3 border-[#0E6245] bg-emerald-50/60 pl-3 py-2 my-2 rounded-r-xl text-xs sm:text-sm text-slate-800 italic"
            >
              {renderCellContent(trimmed.replace('> ', ''))}
            </blockquote>
          )
        }

        // Numbered Lists: 1. , 2. , 3.
        const numMatch = block.text.match(/^(\s*)(\d+)\.\s+(.*)$/)
        if (numMatch) {
          const indent = numMatch[1].length
          const num = numMatch[2]
          const rest = numMatch[3]
          return (
            <div
              key={blockKey}
              className="flex items-start gap-2.5 my-1"
              style={{ marginLeft: `${Math.max(0, indent * 12)}px` }}
            >
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-[11px] font-black shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 leading-relaxed text-slate-800">{renderCellContent(rest)}</div>
            </div>
          )
        }

        // Bullet Lists: * or -
        const bulletMatch = block.text.match(/^(\s*)([-*•])\s+(.*)$/)
        if (bulletMatch) {
          const indent = bulletMatch[1].length
          const rest = bulletMatch[3]
          return (
            <div
              key={blockKey}
              className="flex items-start gap-2.5 my-1"
              style={{ marginLeft: `${Math.max(4, indent * 12)}px` }}
            >
              <span className="text-[#0E6245] font-black shrink-0 text-base leading-none mt-0.5">•</span>
              <div className="flex-1 leading-relaxed text-slate-800">{renderCellContent(rest)}</div>
            </div>
          )
        }

        // Regular Paragraph
        return (
          <div key={blockKey} className="leading-relaxed text-slate-800">
            {renderCellContent(trimmed)}
          </div>
        )
      })}
    </div>
  )
}
