/**
 * LayerAccordion — アコーディオン 1 セクション
 * ヘッダークリックで開閉する。
 */

interface LayerAccordionProps {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function LayerAccordion({ title, open, onToggle, children }: LayerAccordionProps) {
  return (
    <div style={{ borderBottom: '1px solid #1a1a2e' }}>
      {/* ヘッダー */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 font-mono tracking-widest
                   hover:bg-[#0f0f1e] transition-colors"
        style={{ padding: '8px 4px', cursor: 'pointer', background: 'transparent' }}
      >
        <span style={{ fontSize: 9, color: '#4a4a6e', width: 10 }}>
          {open ? '▼' : '▶'}
        </span>
        <span style={{ fontSize: 10, color: open ? '#8888bb' : '#4a4a6e' }}>
          {title}
        </span>
      </button>

      {/* コンテンツ：display で非表示（アンマウントしない） */}
      <div style={{ display: open ? 'block' : 'none', padding: '4px 4px 12px 14px' }}>
        {children}
      </div>
    </div>
  )
}
