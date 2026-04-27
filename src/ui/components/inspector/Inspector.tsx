/**
 * Inspector
 * GeoGraphy の右固定パネル。Mixer タブ / Layer タブを統合する。
 *
 * Phase 18: シェル実装（タブ切り替え・開閉のみ）
 * spec: docs/spec/layer-window.spec.md
 */

import { useState } from 'react'
import { MixerTab } from './tabs/MixerTab'
import { LayerTab }  from './tabs/LayerTab'

type InspectorTab = 'mixer' | 'layer'

interface InspectorProps {
  open: boolean
  onToggle: () => void
}

export function Inspector({ open, onToggle }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('mixer')

  return (
    <>
      {/* 開いた状態：右固定パネル */}
      {open && (
        <div
          className="fixed top-0 right-0 h-screen z-[500] flex flex-col
                     bg-[#0a0a14] border-l border-[#2a2a4e]
                     font-mono text-xs text-white select-none"
          style={{ width: 280 }}
        >
          {/* ヘッダー：タブ + 閉じるボタン */}
          <div
            className="flex items-center border-b border-[#2a2a4e]"
            style={{ height: 36, padding: '0 8px', flexShrink: 0 }}
          >
            {/* タブ */}
            <div className="flex gap-1 flex-1">
              {(['mixer', 'layer'] as InspectorTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-3 py-1 rounded text-[10px] tracking-widest transition-colors"
                  style={{
                    background: activeTab === tab ? '#1a1a3e' : 'transparent',
                    color: activeTab === tab ? '#aaaaff' : '#4a4a6e',
                    border: activeTab === tab ? '1px solid #3a3a6e' : '1px solid transparent',
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* 閉じるボタン */}
            <button
              onClick={onToggle}
              className="text-[#3a3a6e] hover:text-[#aaaacc] transition-colors ml-2"
              style={{ fontSize: 14, lineHeight: 1 }}
              title="Inspector を閉じる (I)"
            >
              ▶
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '12px 10px' }}>
            {activeTab === 'mixer' && <MixerTab />}
            {activeTab === 'layer' && <LayerTab />}
          </div>

          {/* フッター */}
          <div
            className="border-t border-[#1a1a2e] text-[8px] text-[#2a2a4e]
                       tracking-wider text-center"
            style={{ padding: '6px 0', flexShrink: 0 }}
          >
            GEOGRAPHY INSPECTOR · Phase 18
          </div>
        </div>
      )}

      {/* 閉じた状態：右端のトグルボタン */}
      {!open && (
        <button
          onClick={onToggle}
          className="fixed top-1/2 right-0 z-[500] flex items-center justify-center
                     bg-[#0a0a14] border border-[#2a2a4e] rounded-l
                     text-[#4a4a6e] hover:text-[#aaaacc] hover:border-[#4a4a6e]
                     transition-colors"
          style={{ width: 20, height: 64, transform: 'translateY(-50%)' }}
          title="Inspector を開く (I)"
        >
          ◀
        </button>
      )}
    </>
  )
}
