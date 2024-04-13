
import express from 'express'
import cors from 'cors';

// Allow requests from specific origins
const app = express()

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(5050, () => console.log("Server ready on port 5050 or http://localhost:5050."));

