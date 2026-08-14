import express from "express"
import cors from 'cors'
import {clerkMiddleware} from '@clerk/express'
import { clerkWebhookHandler } from "./webhooks/clerk.js"
import { getEnv } from './lib/env.js';
import "dotenv/config"


const env =getEnv()
const app = express()
const rawJson = express.raw({type:"application/json", limit:"1mb"})

//it is important that you don't parse the webhook event data. it should be in raw format
app.post("/webhooks/clerk", rawJson,(req,res)=>{//get rwa json
    void clerkWebhookHandler(req, res)
})

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())



app.listen(env.PORT, ()=>console.log("listening on port: ", env.PORT))