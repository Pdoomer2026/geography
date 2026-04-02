/**
 * PreferencesPanel
 * spec: docs/spec/preferences-panel.spec.md
 *
 * 画面左上の ⚙ ボタンクリック / P キーで開閉するプリファレンスパネル。
 * タブ: Setup / Project / Plugins / Audio / MIDI / Output
 */

import { useState } from 'react'
import { engine } from '../../../core/engine'


// ----------------------------------------------------------------
// 型定義
// ----------------------------------------------------------------

type TabId = 'setup' | 'plugins' | 'audio' | 'midi' | 'output'

const TABS: { id: TabId; label: string }[] = [
  { id: 'setup',   label: 'Setup'   },
  { id: 'plugins', label: 'Plugins' },
  { id: 'audio',   label: 'Audio'   },
  { id: 'midi',    label: 'MIDI'    },
  { id: 'output',  label: 'Output'  },
]

// FX デフォルト設定（spec: preferences-panel.spec.md §4 / fx-stack.spec.md §5）
const FX_DEFAULTS: Record<string, boolean> = {
  'after-image':   true,
  'feedback':      false,
  'bloom':         true,
  'kaleidoscope':  false,
  'mirror':        false,
  'zoom-blur':     false,
  'rgb-shift':     true,
  'crt':           false,
  'glitch':        false,
  'color-grading': true,
}

// FX 表示名マップ
const FX_LABELS: Record<string, string> = {
  'after-image':   'AfterImage',
  'feedback':      'Feedback',
  'bloom':         'Bloom',
  'kaleidoscope':  'Kaleidoscope',
  'mirror':        'Mirror',
  'zoom-blur':     'Zoom Blur',
  'rgb-shift':     'RGB Shift',
  'crt':           'CRT',
  'glitch':        'Glitch',
  'color-grading': 'Color Grading',
}

// FX スタック順（spec: fx-stack.spec.md §3）
const FX_ORDER = [
  'after-image', 'feedback', 'bloom', 'kaleidoscope', 'mirror',
  'zoom-blur', 'rgb-shift', 'crt', 'glitch', 'color-grading',
]

// ----------------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------------

interface PreferencesPanelProps {
  open: boolean
  onClose: () => void
}

export function PreferencesPanel({ open, onClose }: PreferencesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('setup')

  if (!open) return null

  return (
    <div
      className="fixed z-[200] font-mono text-xs select-none"
      style={{ top: 48, left: 8, width: 480 }}
    >
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a4e]">
          <span className="text-[11px] text-[#7878aa] tracking-widest">⚙ PREFERENCES</span>
          <button
            onClick={onClose}
            className="text-[#4a4a6e] hover:text-[#aaaacc] transition-colors text-[14px] leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* タブバー */}
        <div className="flex border-b border-[#2a2a4e] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-[10px] tracking-wide transition-colors whitespace-nowrap"
              style={{
                color: activeTab === tab.id ? '#aaaaee' : '#4a4a6e',
                borderBottom: activeTab === tab.id ? '2px solid #5a5aaa' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="p-4" style={{ minHeight: 280 }}>
          {activeTab === 'setup'   && <SetupTab onApply={onClose} />}
          {(activeTab === 'plugins' || activeTab === 'audio' ||
            activeTab === 'midi'   || activeTab === 'output') && <ComingSoonTab />}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Setup タブ
// ----------------------------------------------------------------

function SetupTab({ onApply }: { onApply: () => void }) {
  const allGeometry = engine.getRegisteredPlugins()

  // デフォルトは最初の3つだけ選択（レイヤー数に合わせる）
  const [selectedGeometry, setSelectedGeometry] = useState<Set<string>>(
    () => {
      const currentLayers = engine.getSceneState().layers
      if (currentLayers.length > 0) {
        return new Set(currentLayers.map((l) => l.geometryId))
      }
      return new Set(allGeometry.slice(0, 3).map((p) => p.id))
    }
  )

  // engine の現在の FX 状態を初期値にする（開くたびにリセットしない）
  const [selectedFx, setSelectedFx] = useState<Record<string, boolean>>(() => {
    const currentFx = engine.getFxPlugins('layer-1')
    if (currentFx.length > 0) {
      return Object.fromEntries(currentFx.map((fx) => [fx.id, fx.enabled]))
    }
    return { ...FX_DEFAULTS }
  })

  function toggleGeometry(id: string) {
    setSelectedGeometry((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleFx(id: string) {
    setSelectedFx((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleApply() {
    // Geometry: チェックされた Plugin を順番通りに各レイヤーへ割り当て
    // allGeometry の登録順を維持して selectedGeometry でフィルタ
    const selectedGeometryIds = allGeometry
      .filter((p) => selectedGeometry.has(p.id))
      .map((p) => p.id)
    engine.applyGeometrySetup(selectedGeometryIds)

    // FX: チェックされた FX だけ create()、それ以外は destroy()
    const enabledFxIds = FX_ORDER.filter((fxId) => selectedFx[fxId] ?? false)
    engine.applyFxSetup(enabledFxIds)

    onApply()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Geometry セクション */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">GEOMETRY</div>
        <div className="grid grid-cols-2 gap-1.5">
          {allGeometry.map((p) => (
            <CheckItem
              key={p.id}
              id={p.id}
              label={p.name}
              checked={selectedGeometry.has(p.id)}
              onChange={() => toggleGeometry(p.id)}
            />
          ))}
          {allGeometry.length === 0 && (
            <span className="text-[#3a3a5e] col-span-2">No geometry plugins found</span>
          )}
        </div>
      </section>

      {/* FX セクション */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">FX</div>
        <div className="grid grid-cols-2 gap-1.5">
          {FX_ORDER.map((fxId) => (
            <CheckItem
              key={fxId}
              id={fxId}
              label={FX_LABELS[fxId] ?? fxId}
              checked={selectedFx[fxId] ?? false}
              onChange={() => toggleFx(fxId)}
            />
          ))}
        </div>
      </section>

      {/* APPLY ボタン */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleApply}
          className="px-5 py-1.5 text-[11px] rounded border transition-colors"
          style={{
            background: '#2a2a6e',
            borderColor: '#5a5aaa',
            color: '#aaaaee',
          }}
        >
          APPLY
        </button>
      </div>
    </div>
  )
}

interface CheckItemProps {
  id: string
  label: string
  checked: boolean
  onChange: () => void
}

function CheckItem({ id, label, checked, onChange }: CheckItemProps) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer"
      htmlFor={`pref-check-${id}`}
    >
      <input
        id={`pref-check-${id}`}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-[#5a5aff] cursor-pointer"
      />
      <span
        className="text-[11px] transition-colors"
        style={{ color: checked ? '#aaaacc' : '#4a4a6e' }}
      >
        {label}
      </span>
    </label>
  )
}

// ----------------------------------------------------------------
// Coming Soon タブ
// ----------------------------------------------------------------

function ComingSoonTab() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-[#3a3a5e] text-[12px] tracking-widest">COMING SOON</span>
    </div>
  )
}
