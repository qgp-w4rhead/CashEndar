import { getDB, COUNTER_STORE } from './db'

export async function getNextPaymentId(): Promise<number> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COUNTER_STORE], 'readwrite')
    const store = transaction.objectStore(COUNTER_STORE)

    const getRequest = store.get('paymentCounter')

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const counter = getRequest.result

      if (counter) {
        const nextId = counter.value + 1
        counter.value = nextId

        const updateRequest = store.put(counter)
        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => resolve(nextId)
      } else {
        const newCounter = { name: 'paymentCounter', value: 1 }
        const addRequest = store.add(newCounter)
        addRequest.onerror = () => reject(addRequest.error)
        addRequest.onsuccess = () => resolve(1)
      }
    }
  })
}
