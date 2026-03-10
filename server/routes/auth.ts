import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken } from '../middleware/auth'
import { UserModel } from '../models/user.model'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }

    const existing = await UserModel.findOne({ username })
    if (existing) {
      res.status(409).json({ error: 'Username already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = new UserModel({ username, password: hashedPassword })
    await user.save()

    const token = generateToken(user._id.toString())
    res.status(201).json({ token, userId: user._id })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }

    const user = await UserModel.findOne({ username })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user._id.toString())
    res.json({ token, userId: user._id })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

export default router
