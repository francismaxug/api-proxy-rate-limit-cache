import express from "express"
import helmet from "helmet"

import massWeaterRout from "./routes/mass-weather"
const app = express()

app.use(express.json())
app.use(helmet())

app.set("trust proxy", 1)

app.get("/", (req, res) => {
  res.send("Hello World")
})

app.use("/api/v1", massWeaterRout)

export default app
