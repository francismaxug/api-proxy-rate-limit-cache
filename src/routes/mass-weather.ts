import express from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

interface Details {
  name: string
  email: string
}

const limiter = rateLimit({
  windowMs: 60 * 60 * 1, // 1 hour
  limit: 5, // Limit each IP to 5 requests per `window` (here, per 1 hour).
})

const speedLimiter = slowDown({
  windowMs: 30 * 60 * 1000, // 30 minutes
  delayAfter: 5, // Allow 5 requests per 30 minutes.
  delayMs: (hits) => hits * 200, // Add 200 ms of delay to every request after the 5th one.
})

const router = express.Router()

const BASE_URL = "https://api.nasa.gov/insight_weather/?"

let cachedData: Details
let cacheTime: number

const apiKeys = new Map()
apiKeys.set("12345", true)

router.get(
  "/",
  limiter,
  speedLimiter,
  //applying middleware before getting to actual request
  (req, res, next) => {
    const apiKey = req.get("X-API-KEY")
    if (apiKeys.has(apiKey)) {
      next()
    } else {
      const error = new Error("Invalid API KEY")
      next(error)
    }
  },
  async (req, res, next) => {
    // in memory cache
    if (cacheTime && cacheTime > Date.now() - 30 * 1000) {
      // BTW - set a cache header so browsers work WITH you.

      return res.json(cachedData)
    }
    try {
      const params = new URLSearchParams({
        api_key: process.env.NASA_API_KEY as string,
        feedtype: "json",
        ver: "1.0",
      })
      // 1. make a request to nasa api
      const { data } = await axios.get(`${BASE_URL}${params}`)
      // 2. respond to this request with data from nasa api
      cachedData = data
      cacheTime = Date.now()
      data.cacheTime = cacheTime
      return res.json(data)
    } catch (error) {
      console.log(error)
    }
  }
)

export default router
