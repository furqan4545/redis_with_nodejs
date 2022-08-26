const express = require("express")
const axios = require("axios")
const cors = require("cors")
const Redis = require("redis")
const redisClient = Redis.createClient()

// const client = Redis.createClient({url: }) url of production server. 
// bew services stop redis
// bew services start redis 
// bew services restart redis

const DEFAULT_EXPIRATION = 3600

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId

    redisClient.get("photos", async (error, photos) => {
        if (error) console.log(error)
        if (photos != null) {
            console.log("cache hit")
            return res.json(JSON.parse(photos))
        } else {
            console.log("cache miss")
            const { data } = await axios.get(
                "https://jsonplaceholder.typecode.com/photos",
                { params : {albumId} }
            )
            redisClient.setEx("photos", DEFAULT_EXPIRATION, JSON.stringify(data)) // photos is the key, data is the value. 
        }
        res.json(data);
    })
})

// In the above code we are using the redis client to set the key and value. We are checking if the key exists in the cache. 
// If it does, we are returning the value. If it does not, we are making a request to the server and setting the key
// and value in the cache.


app.get("/photos2", async (req, res) => {
    const albumId = req.query.albumId

    redisClient.get(`photos?albumId=${albumId}`, async (error, photos) => {
        if (error) console.log(error)
        if (photos != null) {
            console.log("cache hit")
            return res.json(JSON.parse(photos))
        } else {
            console.log("cache miss")
            const { data } = await axios.get(
                "https://jsonplaceholder.typecode.com/photos",
                { params : {albumId} }
            )
            redisClient.setEx(`photos?albumId=${albumID}`, DEFAULT_EXPIRATION, JSON.stringify(data)) // photos is the key, data is the value. 
        }
        res.json(data);
    })
})



app.get("/photos/:id", async (req, res) => {
    const { id } = req.params
    const photo = await getOrSetCache(`photos:${id}`, async () => {
        const { data } = await axios.get(
            `https://jsonplaceholder.typecode.com/photos/${id}`
        )
        return data
    })
    
    res.json(photo)
})

function getOrSetCache(key, cb) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, async (error, data) => {
            if (error) return reject(error)
            if (data != null) return resolve(JSON.parse(data))
            const freshData = await cb()
            redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
            resolve(freshData)
        })
    })
} 


app.listen(3000)