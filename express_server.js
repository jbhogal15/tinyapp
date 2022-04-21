const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs")

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

emailUser = function(email, users) {
  for (const key in users) {
    if (users[key].email === email) {
      return true;
    }
  }
  return false;
};



app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

app.get("/urls", (req, res) => {
  const user_id =  req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user: user};
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: null};
  res.render("urls_register", templateVars);
})


app.get("/urls/new", (req, res) => {
  const user_id =  req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user: user};
  res.render("urls_new", templateVars);
})

app.get("/urls/:shortURL", (req, res) => {
  const user_id =  req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: user};
  res.render("urls_shows", templateVars);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/:shortURL");
})

//delete
app.post("/urls/:shortURL/delete", (req, res) => {
  let removeURL = req.params.shortURL;
  delete urlDatabase[removeURL];
  res.redirect("/urls");
})

//edit
app.post("/urls/:shortURL", (req, res) => {
  let newURL = req.body.newURL;
  console.log(newURL);
  urlDatabase[req.params.shortURL] = newURL;
  res.redirect("/urls");
})

app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  if (!email|| !password) {
    res.status(400).send("Please include a valid email address and password.");
  } else if (emailUser(email, users)) {
      res.status(400).send("This email already exists for an account.");
  } else {
    users[user_id] = {id: user_id, email: email, password: password};
    res.cookie("user_id", user_id);
    res.redirect("/urls");
  }
  console.log(users);
})

//Login
app.post("/login", (req, res) => {
  const user_id =  req.cookies["user_id"];
  // const user = users[user_id];
  res.cookie("user_id", user_id);
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("urls/");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// http%3A%2F%2Fgoogle.com  
