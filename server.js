const express  = require('express');
const redis = require('redis');
const fetch = require("node-fetch");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.PORT || 6379;


const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response 
function setResponse(username, repos){
    return `<h2>${username} has ${repos} Git repos</h2>`
}

// Make request to GitHUb for data
async function getRepos(req, res, next) {
    try {
        console.log('Fetching data');
        const { username } = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();

        const repos = data.public_repos;

        // Set data to Redis
        client.setex(username, 3600, repos)


        res.json(setResponse(username, repos));

    } catch(e) {
        console.log(e);
        res.json('We have an issue');
    }
}

// Cache middleware
function cache(req, res, next) {
    const { username} = req.params;

    client.get(username, (err, data) => {
        if (err) throw err;

        if (data !== null) {
            res.json(setResponse(username, data));
        } else {
            next();
        }
    })
}


app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
})