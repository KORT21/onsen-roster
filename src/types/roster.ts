export type RosterCell = string

export interface RosterRow {
  id: string
  label: string
  cells: RosterCell[]
}

export interface RosterDay {
  date: string
  shortLabel: string
}

export interface RosterWeek {
  id: string
  label: string
  start: string
  days: RosterDay[]
  rows: RosterRow[]
}

export interface RosterPayload {
  version: 1
  fetchedAt: string
  source: {
    name: string
    spreadsheetTitle?: string
  }
  weeks: RosterWeek[]
}

export interface PersonAssignment {
  name: string
  note: string
  training: boolean
}

export interface RoleMeta {
  family: string
  title: string
  time: string
  color: string
  half: 'am' | 'pm' | 'both'
}

