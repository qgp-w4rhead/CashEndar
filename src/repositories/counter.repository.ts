// MongoDB generates _id via ObjectId — this function returns a temporary client-side ID.
// The server will replace it with the real MongoDB _id on creation.
export async function getNextPaymentId(): Promise<string> {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
