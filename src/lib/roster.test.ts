import { describe, expect, it } from 'vitest'
import { findSupervisorSplit, formatDayNotes, hasRosteredPerson, isoWeekNumber, namesInCell, parseAssignment, peopleIn } from './roster'
import { demoPayload } from '../data/demo'

describe('roster helpers', () => {
  it('uses ISO calendar week numbers instead of spreadsheet tab labels', () => {
    expect(isoWeekNumber('2026-11-02')).toBe(45)
    expect(isoWeekNumber('2027-01-01')).toBe(53)
    expect(isoWeekNumber('2027-01-04')).toBe(1)
  })

  it('keeps a trailing initial as part of the employee identity', () => {
    expect(parseAssignment('Jasmine O  last day')?.name).toBe('Jasmine O')
    expect(parseAssignment('Maria S')?.name).toBe('Maria S')
  })

  it('detects training without changing the employee name', () => {
    expect(parseAssignment('Alex *')).toMatchObject({ name: 'Alex', training: true })
  })

  it('only treats roles with an assigned person as rostered', () => {
    expect(hasRosteredPerson('Pip')).toBe(true)
    expect(hasRosteredPerson('Jasmine *')).toBe(true)
    expect(hasRosteredPerson('')).toBe(false)
    expect(hasRosteredPerson('—')).toBe(false)
    expect(hasRosteredPerson('TBC')).toBe(false)
    expect(hasRosteredPerson('to fill')).toBe(false)
  })

  it('finds every staff member in compound training cells', () => {
    expect(namesInCell('Yanina* Krysten & Maryke')).toEqual(['Yanina', 'Krysten', 'Maryke'])
    expect(namesInCell('Jas RC Train Kadek')).toEqual(['Jas', 'Kadek'])
    expect(namesInCell('no driver needed')).toEqual([])
  })

  it('uses the second supervisor row as the afternoon boundary', () => {
    expect(findSupervisorSplit(demoPayload.weeks[0])).toBe(6)
  })

  it('keeps note descriptions and their times together on one line', () => {
    expect(formatDayNotes(['Mia RC Train Stella', '2–3.30pm-'])).toEqual([
      'Mia RC Train Stella 🕒 2–3.30pm',
    ])
    expect(formatDayNotes(['Res Meeting', '2.30–3.30pm', 'Amy* 2.30pm start'])).toEqual([
      'Res Meeting 🕒 2.30–3.30pm',
      'Amy* 🕒 2.30pm start',
    ])
  })

  it('derives a unique, sorted list of people', () => {
    expect(peopleIn(demoPayload)).toEqual(['Alex', 'Avery', 'Cameron', 'Casey', 'Drew', 'Hayden', 'Jamie', 'Jordan', 'Morgan', 'Quinn', 'Riley', 'Taylor'])
  })
})
