import { render, screen } from '@testing-library/react'
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

    expect(screen.getByRole('img', { name: 'Love for Pip' })).toBeInTheDocument()

    rerender(<MyWeek {...sharedProps} selectedName="Alex" />)

    expect(screen.queryByRole('img', { name: 'Love for Pip' })).not.toBeInTheDocument()
  })
})
