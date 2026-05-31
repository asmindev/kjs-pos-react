export type ID = string

export type Maybe<T> = T | null | undefined

export type AsyncState<T> = {
  data: T | null
  isLoading: boolean
  error: string | null
}
