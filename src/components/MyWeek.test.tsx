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

    const heart = screen.getByRole('button', { name: 'Send some love' })
    expect(heart).toBeInTheDocument()
    expect(heart).toHaveTextContent('💖')

    fireEvent.click(heart)

    expect(screen.getByTestId('profile-celebration')).toBeInTheDocument()

    rerender(<MyWeek {...sharedProps} selectedName="Alex" />)

    expect(screen.queryByRole('button', { name: 'Send some love' })).not.toBeInTheDocument()
  })
})
