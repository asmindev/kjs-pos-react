type Handler<T> = (payload: T) => void

const listeners = new Map<string, Set<Handler<unknown>>>()

export const eventBus = {
  publish<T>(eventName: string, payload: T) {
    listeners.get(eventName)?.forEach((handler) => {
      ;(handler as Handler<T>)(payload)
    })
  },
  subscribe<T>(eventName: string, handler: Handler<T>) {
    const eventListeners =
      listeners.get(eventName) ?? new Set<Handler<unknown>>()
    eventListeners.add(handler as Handler<unknown>)
    listeners.set(eventName, eventListeners)

    return () => {
      eventListeners.delete(handler as Handler<unknown>)
    }
  },
}
