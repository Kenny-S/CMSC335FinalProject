const http = require("http");
let fs = require("fs");
process.stdin.setEncoding("utf8");
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config({
  path: path.resolve(__dirname, "credentialsDontPost/.env"),
});
const portNumber = 5000;



const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {
  db: process.env.MONGO_DB_NAME,
  collection: process.env.MONGO_COLLECTION,
};

const { MongoClient, ServerApiVersion } = require("mongodb");

app.set("views", path.resolve(__dirname, "templates"));

app.set("view engine", "ejs");

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/add", (request, response) => {
    response.render("add");
});


app.get("/addedPokemon", (request, response) => {
    add(request.query.pokemon, response);
});

async function add(name, response) {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.nnrsowj.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
    try {
      await client.connect();
      let data = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}/`);
      let json = await data.json();
      await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(json);
        response.render("added", {pokemon : name, image : json.sprites["front_default"]})
    } catch (e) {
      console.error(e);
    } finally {
      await client.close();
    }
}

async function listAll(response) {
  const uri = `mongodb+srv://${userName}:${password}@cluster0.nnrsowj.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  try {
    await client.connect();
    let filter = {};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
    const result = await cursor.toArray();
    let data = "";
    result.forEach(elem => {
      data += `<div> ${elem.name}, Type: ${elem.types[0].type.name} <img src = "${elem.sprites["front_default"]}"></div>`;
    })
    response.render("showTeam", {team : data});
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

app.get("/view", (request, response) => {
  listAll(response);
});

app.listen(portNumber);

console.log(`Web server started and running at http://localhost:${portNumber}`);

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0);
    } else {
      process.stdout.write("Invalid command: " + command + "\n");
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});
