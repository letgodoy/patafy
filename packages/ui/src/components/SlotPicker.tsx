import React from 'react'
import { colors } from '../tokens.js'

export interface Slot {
  inicio: string
  fim: string
  banhistaId: string
  banhistaNome: string
}

type Props = {
  slots: Slot[]
  loading?: boolean
  selectedInicio?: string
  onSelect: (slot: Slot) => void
}

export function SlotPicker({ slots, loading, selectedInicio, onSelect }: Props) {
  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#666', fontSize: 14 }}>
        Carregando horários disponíveis...
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#999', fontSize: 14 }}>
        Nenhum horário disponível para este dia.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {slots.map((slot) => {
        const selected = slot.inicio === selectedInicio
        const hora = new Date(slot.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        return (
          <button
            key={`${slot.inicio}-${slot.banhistaId}`}
            onClick={() => onSelect(slot)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: `2px solid ${selected ? colors.primary : '#d1d5db'}`,
              background: selected ? colors.primary : '#fff',
              color: selected ? '#fff' : '#1f2937',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: selected ? 600 : 400,
              transition: 'all 0.15s',
              minWidth: 72,
              textAlign: 'center',
            }}
          >
            {hora}
          </button>
        )
      })}
    </div>
  )
}
