import bodyParser from "body-parser";
import express from "express";
var session = require("express-session");
var GIFEncoder = require("gifencoder");
var Canvas = require("canvas");
var passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;
var path = require("path");
import { formatStringToPixel, formatPixelToString } from "./common/Format";

const APP_SECRET = process.env.APP_SECRET;
const USER_NAME = process.env.USER_NAME;
const USER_PASSWORD = process.env.USER_PASSWORD;

var mysql = require("mysql");
var connection = mysql.createConnection(process.env.JAWSDB_URL);

const pixelData = {};
connection.connect();

connection.query("SELECT * FROM pixelbuilder", function(
  error,
  results,
  fields
) {
  if (error) throw error;
  results.forEach(row => {
    const pixelArr = row.pixeldata.split(";");
    pixelData[row.id] = { id: row.id, pixels: pixelArr };
  });
});

passport.serializeUser(function(user, done) {
  console.log("serializeUser", user);
  done(null, user.username + ";" + user.password);
});

passport.deserializeUser(function(id, done) {
  console.log("deserializeUser", id);
  const userArr = id.split(";");
  done(null, {
    username: userArr[0],
    password: userArr[1]
  });
});

passport.use(
  new LocalStrategy(function(username, password, done) {
    if (username != USER_NAME || password != USER_PASSWORD) {
      return done(null, false, { message: "Incorrect username." });
    }
    return done(null, { username: username, password: password });
  })
);

const NumPixels = 5;

const PixelsGifSize = 8;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: APP_SECRET,
    key: "user",
    cookie: { maxAge: 60000, secure: false }
  })
);
app.use(passport.initialize());
app.use(passport.session());

const router = express.Router();

//db.defaults({ pixelData: {} })
//    .write()

//const pixelData = db.get('pixelData').value() || {};
//pixelData["1234"] = { name: "Pix", pixels: ["0123456789"] }

router.get("/list", (req, res) => {
  res.json({ items: Object.keys(pixelData) });
});

router.post("/pixelData", (req, res) => {
  let id;

  let pixelArr = [];

  if (req.body.pixels && req.body.pixels.length > 0) {
    req.body.pixels.forEach(pixelData => {
      if (typeof pixelData === "string") {
        // && pixelData.length === (NumPixels * NumPixels)) {
        console.log("Insert String ", pixelData);
        pixelArr.push(pixelData);
      }
    });
  }

  if (pixelArr.length > 0) {
    if (req.body.id) {
      id = parseInt(req.body.id);
      console.log("update: " + id);
      connection.query(
        "UPDATE pixelbuilder SET pixeldata = ? WHERE id = ?",
        [pixelArr.join(";"), id],
        function(error, results, fields) {
          if (error) throw error;
        }
      );

      pixelData[id].pixels = pixelArr;
    } else {
      id = Math.floor(Math.random() * 9999);
      while (pixelData[id]) {
        id = Math.floor(Math.random() * 999999);
      }

      var post = { id: id, pixeldata: pixelArr.join(";") };
      var query = connection.query(
        "INSERT INTO pixelbuilder SET ?",
        post,
        function(error, results, fields) {
          if (error) throw error;
          console.log("Stored Id: ", id);
        }
      );

      pixelData[id] = { id: id, pixels: pixelArr };
    }
  }

  /*db.set('pixelData.' + id, { pixels: req.body.pixels, id: id })
        .write();*/

  res.json({ ...pixelData[id], id: id });
});
router.get("/pixelData/:id", (req, res) => {
  res.json(pixelData[req.params.id]);
});

router.get("/pixelframe", (req, res) => {
  var pixelList = [];
  var pixelArray = Object.keys(pixelData);
  for (var i = 0; i < (pixelArray.length < 10 ? pixelArray.length : 10); i++) {
    var index = Math.floor(Math.random() * pixelArray.length);
    var pixels = pixelData[pixelArray[index]];
    pixelList.push(pixels);
  }

  res.json({ pixels: pixelList });
});

router.get("/gif/:id", (req, res) => {
  var encoder = new GIFEncoder(
    NumPixels * PixelsGifSize,
    NumPixels * PixelsGifSize
  );
  encoder.start();
  encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
  encoder.setDelay(500); // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  // use node-canvas
  var canvas = new Canvas(NumPixels * PixelsGifSize, NumPixels * PixelsGifSize);
  var ctx = canvas.getContext("2d");
  let pixels;
  if (pixelData[req.params.id]) {
    pixels = pixelData[req.params.id].pixels;
  } else {
    pixels = ["GGGGGGG6GGG666GGG6GGGGGGG"]; // Default add icon
  }
  pixels.forEach(pixelColors => {
    const pixel = formatStringToPixel(pixelColors);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.keys(pixel).map(key => {
      const pixelData = pixel[key];
      const x = Math.floor(key % NumPixels);
      const y = Math.floor(key / NumPixels);
      ctx.fillStyle = pixelData;
      ctx.fillRect(
        x * PixelsGifSize,
        y * PixelsGifSize,
        PixelsGifSize,
        PixelsGifSize
      );
    });

    encoder.addFrame(ctx);
    //console.log(pixel);
  });

  var buf = encoder.out.getData();

  res.writeHead(200, { "Content-Type": "image/gif" });
  res.end(buf, "binary");
});

app.get("/", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "index.html"));
});
app.get("/pixel/*", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "index.html"));
});
app.get("/login", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "index.html"));
});
app.get("/impressum", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "index.html"));
});
app.get("/favicon.ico", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "favicon.ico"));
});
app.get("/manifest.json", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "manifest.json"));
});
app.get("/service-worker.js", function(request, response) {
  response.sendFile(path.resolve(__dirname, "public", "service-worker.js"));
});
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
app.post("/login", function(req, res, next) {
  console.log("blub login");
  passport.authenticate("local", function(err, user, info) {
    console.log("blaa", err, user, info);
    if (err || !user) {
      return res.json({ error: "Login failed" }); //redirect('/login'); }
    } else {
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }
        return res.json({ success: true });
      });
    }
  })(req, res, next);
});

app.get("/delete/:id", isLoggedIn, function(req, res) {
  console.log("Deleting" + req.params.id);

  var num = parseInt(req.params.id);
  if (req.params.id && pixelData[num]) {
    delete pixelData[num];
    connection.query('DELETE FROM pixelbuilder WHERE id = "?"', [num], function(
      error,
      results,
      fields
    ) {
      if (error) throw error;
      console.log("deleted " + results.affectedRows + " rows");
    });
  }

  res.json({ deleted: req.params.id });
});

function isLoggedIn(req, res, next) {
  console.log("isAuthenticated " + req.isAuthenticated());
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();

  // if they aren't redirect them to the home page
  res.redirect("/");
}

app.use(router);
app.use("/static/", express.static("public/static"));
app.set("port", process.env.PORT || 3001);
app.listen(app.get("port"), () => {
  console.log(`Listening on ${app.get("port")}`);
});
