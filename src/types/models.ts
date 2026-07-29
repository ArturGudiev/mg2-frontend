export type CardItemType =
  | 'TEXT'
  | 'TEXT_WITH_HIGHLIGHTED_SYMBOL'
  | 'CODE'
  | 'FORMULA'
  | 'IMAGE'
  | 'WORD_WITH_STRESS'

export type UsageType = 'active' | 'passive' | 'transitional' | 'common'

export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface CardsPriority {
  name: string
  number: number
  cards: number[]
}

export interface CardsGroup {
  name: string
  cards: number[]
}

export interface MemoryNodePathItem {
  id: number
  name: string
}

export interface MemoryNode {
  id: number
  name: string
  children: number[]
  parents: number[]
  cards: number[]
  aliases: string[]
  priorities: CardsPriority[]
  groups: CardsGroup[]
  shared: boolean
  userId: number
}

export interface CardItem {
  id: number
  type: CardItemType
  text?: string | null
  index?: number | null
  code?: string | null
  extension?: string | null
  formula?: string | null
  imagePath?: string | null
  width?: string | null
  shared: boolean
  userId: number
}

export interface CardItemInput {
  type: CardItemType
  text?: string | null
  index?: number | null
  code?: string | null
  extension?: string | null
  formula?: string | null
  imagePath?: string | null
  width?: string | null
}

export interface Card {
  id: number
  question: CardItem[]
  answer: CardItem[]
  questionIds: number[]
  answerIds: number[]
  parentNodes: number[]
  used: number
  needed: number
  count: number
  reverseCount: number
  usageType: UsageType
  shared: boolean
  userId: number
}

export type QuizField = 'count'

export interface QuizSession {
  cards: Card[]
  fieldToUpdate: QuizField
  until: number
  lastNodeId: number | null
  query: string
}
