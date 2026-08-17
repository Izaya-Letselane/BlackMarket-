import express from "express"
import cors from 'cors'
import {clerkMiddleware} from '@clerk/express'
import { clerkWebhookHandler } from "./webhooks/clerk.js"
import { getEnv } from './lib/env.js';
import "dotenv/config"
import fs from "node:fs"
import path from "node:path";
import keepAliveCron from './lib/cron.js'
import meRouter from './routes/meRouter.js'
import productRouter from './routes/productRouter.js'
import streamRouter from './routes/streamRouter.js'
import checkoutRouter from './routes/checkoutRouter.js'
import adminRouter from './routes/adminRouter.js'
import orderRouter from './routes/orderRouter.js'
import { polarWebhookHandler } from "./webhooks/polar.js";
import * as Sentry from '@sentry/node';
import { sentryClerkUserMiddleware } from "./middleware/sentryClerkUser.js";




const env =getEnv()
const app = express()
const rawJson = express.raw({type:"application/json", limit:"1mb"})

//it is important that you don't parse the webhook event data. it should be in raw format
app.post("/webhooks/clerk", rawJson,(req,res)=>{//get rwa json
    void clerkWebhookHandler(req, res)
})

app.post("/webhooks/polar", rawJson,(req,res)=>{
    void polarWebhookHandler(req, res)
})

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())
app.use(sentryClerkUserMiddleware)

app.get("/health",(_req,res)=>{
    res.json({ok:true})
})

app.use("/api/me", meRouter)
app.use("/api/products", productRouter)
app.use("/api/stream", streamRouter)
app.use("/api/checkout", checkoutRouter)
app.use("/api/admin", adminRouter)
app.use("/api/orders", orderRouter)

//sentry will be attached to the response object
Sentry.setupExpressErrorHandler(app);


//error handler middleware
app.use((_error:unknown, _req: express.Request,res: express.Response,_next: express.NextFunction)=>{
  const sentryId = (res as express.Response & {sentry?:string}).sentry
  res.status(500).json({error: "Internal server error",...(sentryId !==undefined && {sentryId})})
})
const publicDir = path.join(process.cwd(),"public")
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
      next();
      return;
    }

    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  });
}



app.listen(env.PORT, ()=>{
    console.log("listening on port: ", env.PORT)

   if(env.NODE_ENV ==="production"){
    keepAliveCron.start()
   }
})