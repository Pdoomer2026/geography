/**
 * MidiMonitorWindow
 * spec: docs/spec/midi-monitor.spec.md
 *
 * 生の MIDI 入力をリアルタイムで可視化するデバッグ用 Window。
 * - 接続中デバイス一覧
 * - CC / Note-On / Note-Off のリアルタイムログ（最大50件）
 * - engine フローとは独立（TransportEvent に影響しない）
 */

import { useEffect, useRef, useState } from 'react'
import { useDraggable } from '../../../useDraggable'
import type { MidiMonitorEvent } from '../../../../application/schema'

const MAX_LOG = 50

interface DeviceInfo {
  id: string
  name: string
  connected: boolean
}

interface MidiMonitorWindowProps {
  onMount: (cb: (event: MidiMonitorEvent) => void) => void
}

// ============================================================
// MidiMonitorWindow
// ============================================================

export function MidiMonitorWindow({ onMount }: MidiMonitorWindowProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [logs, setLogs] = useState<MidiMonitorEvent[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: 16, y: 300 })
  const mountedRef = useRef(false)

  // デバイス一覧を取得・監視
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return

    let access: MIDIAccess | null = null

    const updateDevices = (a: MIDIAccess) => {
      const list: DeviceInfo[] = []
      a.inputs.forEach((input) => {
        list.push({ id: input.id, name: input.name ?? 'Unknown', connected: input.state === 'connected' })
      })
      setDevices(list)
    }

    navigator.requestMIDIAccess({ sysex: false }).then((a) => {
      access = a
      updateDevices(a)
      a.onstatechange = () => updateDevices(a)
    }).catch(() => {})

    return () => {
      if (access) access.onstatechange = null
    }
  }, [])

  // MonitorEvent コールバックを登録
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    onMount((event: MidiMonitorEvent) => {
      setLogs((prev) => {
        const next = [event, ...prev]
        return next.length > MAX_LOG ? next.slice(0, MAX_LOG) : next
      })
    })
  }, [onMount])

  const typeLabel = (type: MidiMonitorEvent['type']) => {
    if (type === 'cc') return 'CC '
    if (type === 'note-on') return 'NT+'
    return 'NT-'
  }

  const typeColor = (type: MidiMonitorEvent['type']) => {
    if (type === 'cc') return '#4a9eff'
    if (type === 'note-on') return '#55ff99'
    return '#ff6655'
  }

  return (
    <div
      className="fixed z-[91] font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 380 }}
    >
      <div
        className="bg-[#080810] border border-[#2a2a5e] rounded-lg overflow-hidden"
        style={{ padding: '10px 14px' }}
      >
        {/* ヘッダー */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between mb-2"
          style={{ cursor: 'grab' }}
        >
          <span className="text-[10px] tracking-widest" style={{ color: '#4a9eff' }}>
            MIDI MONITOR
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogs([])}
              className="text-[9px] px-2 py-0.5 rounded border transition-colors"
              style={{ borderColor: '#2a2a5e', color: '#4a5a7e', background: '#0a0a18' }}
            >
              CLEAR
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="transition-colors text-[11px] leading-none"
              style={{ color: '#3a4a6e' }}
            >
              {collapsed ? '＋' : '－'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* デバイス一覧 */}
            <div
              className="mb-2 pb-2 border-b"
              style={{ borderColor: '#1a1a3e' }}
            >
              <div className="text-[9px] mb-1" style={{ color: '#2a4a6e' }}>DEVICES</div>
              {devices.length === 0 && (
                <div className="text-[9px]" style={{ color: '#2a2a4e' }}>
                  No MIDI devices connected
                </div>
              )}
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-1.5 text-[9px]">
                  <span style={{ color: d.connected ? '#55ff99' : '#3a3a5e' }}>
                    {d.connected ? '●' : '○'}
                  </span>
                  <span style={{ color: d.connected ? '#6a9aaf' : '#3a3a5e' }}>
                    {d.name}
                  </span>
                </div>
              ))}
            </div>

            {/* ログ */}
            <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
              {logs.length === 0 && (
                <div className="text-[9px] py-3 text-center" style={{ color: '#2a2a4e' }}>
                  — waiting for MIDI input —
                </div>
              )}
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-[1px]"
                  style={{ opacity: i === 0 ? 1 : Math.max(0.3, 1 - i * 0.015) }}
                >
                  {/* タイプ */}
                  <span
                    className="text-[9px] tabular-nums shrink-0"
                    style={{ color: typeColor(log.type), width: 24 }}
                  >
                    {typeLabel(log.type)}
                  </span>
                  {/* 番号 */}
                  <span
                    className="text-[9px] tabular-nums shrink-0"
                    style={{ color: '#3a6a9e', width: 28 }}
                  >
                    {String(log.number).padStart(3, ' ')}
                  </span>
                  {/* 値バー */}
                  <div
                    className="rounded-full overflow-hidden shrink-0"
                    style={{ width: 60, height: 3, background: '#0a0a20' }}
                  >
                    <div
                      style={{
                        width: `${log.value * 100}%`,
                        height: '100%',
                        background: typeColor(log.type),
                      }}
                    />
                  </div>
                  {/* 値 */}
                  <span
                    className="text-[9px] tabular-nums shrink-0"
                    style={{ color: '#4a7aae', width: 36 }}
                  >
                    {log.value.toFixed(2)}
                  </span>
                  {/* ch */}
                  <span
                    className="text-[8px] tabular-nums shrink-0"
                    style={{ color: '#2a3a5e', width: 28 }}
                  >
                    ch:{log.channel}
                  </span>
                  {/* デバイス名 */}
                  <span
                    className="text-[8px] truncate"
                    style={{ color: '#2a4a5e' }}
                  >
                    {log.deviceName}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
