import { describe, expect, it } from 'vitest'
import { findSupervisorSplit, parseAssignment, peopleIn } from './roster'
import { demoPayload } from '../data/demo'

describe('roster helpers', () => {
  it('keeps a trailing initial as part of the employee identity', () => {
    expect(parseAssignment('Jasmine O  last day')?.name).toBe('Jasmine O')
    expect(parseAssignment('Maria S')?.name).toBe('Maria S')
  })

  it('detects training without changing the employee name', () => {
    expect(parseAssignment('Alex *')).toMatchObject({ name: 'Alex', training: true })
  })

  it('uses the second supervisor row as the afternoon boundary', () => {
    expect(findSupervisorSplit(demoPayload.weeks[0])).toBe(6)
  })

  it('derives a unique, sorted list of people', () => {
    expect(peopleIn(demoPayload)).toEqual(['Alex', 'Avery', 'Cameron', 'Casey', 'Drew', 'Hayden', 'Jamie', 'Jordan', 'Morgan', 'Quinn', 'Riley', 'Taylor'])
  })
})
