import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { demoPayload } from '../data/demo'
import { MyWeek } from './MyWeek'

describe('MyWeek', () => {
  it('shows the heart only when Pip is selected', () => {
    const week = demoPayload.weeks[0]
    const sharedProps = {
      week,
      onChooseName: () => undefined,
      onOpenDay: () => undefined,
    }
    const { rerender } = render(<MyWeek {...sharedProps} selectedName="Pip" />)

    const heart = screen.getByRole('button', { name: 'Send Pip some love' })
    expect(heart).toBeInTheDocument()

    fireEvent.click(heart)

    expect(screen.getByTestId('pip-heart-burst')).toBeInTheDocument()

    rerender(<MyWeek {...sharedProps} selectedName="Alex" />)

    expect(screen.queryByRole('button', { name: 'Send Pip some love' })).not.toBeInTheDocument()
  })
})
