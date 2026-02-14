import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))

app.use(express.json({limit : "16kb"})) // Formatting JSON data
app.use(express.urlencoded({extended : true, limit : "16kb"})) //For formating URL in case of + , % , /20 etc

app.use(express.static("public"))

app.use(cookieparser())
export { app }