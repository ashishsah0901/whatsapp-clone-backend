import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import cors from "cors";
import Messages from "./modals/dbMessages.js";

/* 
    appp config
*/
const app = express();
const port = process.env.PORT || 8000;
const pusher = new Pusher({
    pusher: "details",
});

/* 
    middlewares
*/
app.use(express.json());
app.use(cors());

/* 
    db config
*/
const connection_url = "mongo db url";
mongoose.connect(connection_url);
mongoose.connection.once("open", () => {
    console.log("Connected to db");
    const changeStream = mongoose.connection
        .collection("messagecontents")
        .watch();
    changeStream.on("change", (change) => {
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                _id: messageDetails._id,
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
            });
        } else {
            console.log("Soemthing else");
        }
    });
});

/* 
    end points
*/
app.get("/", (req, res) => res.status(200).send("Hello world"));

app.get("/api/v1/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(data);
    });
});

app.post("/api/v1/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) return res.status(500).send(err);
        res.status(201).send(data);
    });
});

/*
    listener
*/
app.listen(port, () => console.log(`Listening on localhost:${port}`));
