const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const db = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "satendra",
    password: "password",
    database: "smartbrain"
  }
});

const saltRounds = 10;

const app = express();

app.use(bodyParser.json());
app.use(cors());

// app.post("/signin", (req, res) => {
//   db.select("email", "hash", "id")
//     .from("login")
//     .where("email", "=", req.body.email)
//     .then(data => {
//       const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
//       console.log(isValid);
//       if (isValid) {
//         db.select("*")
//           .from("users")
//           .where("email", "=", req.body.email)
//           .then(user => res.json(user[0]))
//           .catch(err => res.status(400).json("unable to get users"));
//       } else {
//         res.status(400).json("wrong info");
//       }
//     })
//     .catch(err => res.status(400).json("wrong credentials"));
// });

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        db.select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then(user => res.json(user[0]))
          .catch(err => res.status(400).json("unable to get users"));
      } else {
        res.status(400).json("wrong info");
      }
    })
    .catch(err => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
  const { name, password, email } = req.body;
  var hash = bcrypt.hashSync(password, saltRounds);

  db.transaction(trx => {
    trx("login")
      .insert({
        hash: hash,
        email: email
      })
      .returning("email")
      .then(loginEmail => {
        return trx("users")
          .returning("*")
          .insert({ email: loginEmail[0], name: name, joined: new Date() })
          .then(user => res.json(user[0]));
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch(err => res.status(400).json("unable to register"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select("*")
    .from("users")
    .where({ id: id })
    .then(user => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("not found");
      }
    })
    .catch(err => res.status(400).json("error getting user"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then(entry => {
      if (entry.length) {
        res.json(entry[0]);
      } else {
        res.status(400).json("no entries");
      }
    })
    .catch(err => res.json("cannot get entries"));
});

app.listen(3000, () => {
  console.log("app is running on port 3000");
});
