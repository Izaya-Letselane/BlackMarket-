import type { Request, NextFunction, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { getStreamChatServer, streamChatDisplayName, streamUserId } from "../lib/stream.js";
import { getEnv } from "../lib/env.js";
import { getLocalUser } from "../lib/users.js";


const env = getEnv()

export async function createStreamToken(req:Request, res:Response, next:NextFunction) {
    try {
        const {userId, isAuthenticated}= getAuth(req)
        if(!isAuthenticated || !userId){
            res.status(401).json({error: "Unauthorized"})
            return
        }
        const localUser = await getLocalUser(userId)
        if(!localUser){
            res.status(500).json({error: "Account not synced yet"})
        }
        const server = getStreamChatServer(env)
        const clerUser = await clerkClient.users.getUser(userId)

        const combined = [clerUser.firstName, clerUser.lastName].filter(Boolean).join(" ")|| null

        const name =streamChatDisplayName(localUser.role, localUser.displayName ?? combined?? clerUser.username, localUser.email)

        const image = clerUser.imageUrl || undefined;
        const sid = streamUserId(userId)

        await server.upsertUser({id:sid, name, image})
        const token = server.createToken(sid)

        res.json({token, apiKey:env.STREAM_API_KEY, userId: sid})

    } catch (error) {
        next(error)
    }
    
}