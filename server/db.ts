import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cashendar'

const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES || '5', 10)
const RETRY_DELAY_MS = parseInt(process.env.DB_RETRY_DELAY_MS || '5000', 10)

export async function connectDB(): Promise<void> {
  // Mongoose connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB')
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected from MongoDB')
  })
  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err)
  })

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
      })
      // Mask credentials in log output
      const safeUri = MONGODB_URI.replace(/:\/\/[^@]+@/, '://*****@')
      console.log(`Connected to MongoDB: ${safeUri}`)
      return
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error)
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }

  console.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts. Exiting.`)
  process.exit(1)
}

export { mongoose }
