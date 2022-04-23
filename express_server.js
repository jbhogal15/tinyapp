const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs")


//url Database
// const urlDatabase = {
//   "b2xVn2": {
//         longURL: "http://www.lighthouselabs.ca",
//         user_id: " "
//   },

//   "9sm5xK": {
//         longURL: "http://www.google.com",
//         user_id: " "
//   }
// };

//Users Database
// const users = { 
//   "userRandomID": {
//     id: "userRandomID", 
//     email: "user@example.com", 
//     password: "purple-monkey-dinosaur"
//   },
//  "user2RandomID": {
//     id: "user2RandomID", 
//     email: "user2@example.com", 
//     password: "dishwasher-funk"
//   }
// }

const urlDatabase = {};
const users = {};

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const e = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["Fear is a tool, when that light hits the sky, it's not just a call, it's a warning!"]
}))


//Check if email is part of the users databse when logging in or registering
const emailUser = function(email, users) {
  for (const key in users) {
    if (users[key].email === email) {
      return true;
    }
  }
  return false;
};

//FInd users password when provided with email address
const userPassword = function(email, users) {
  for (const key in users) {
    if (users[key].email === email) {
      return users[key].password;
    }
  }
  return undefined;
};

//Get user_id from email
const getUserId = function(email, users) {
  for (const key in users) {
    if (users[key].email === email) {
      return key;
    }
  }
};

//Returns URLs for user_id 
const urlsForUser = function(userId, database) {
  let userURLs = {}; 
  for (const shortURL in database) {
    if (urlDatabase[shortURL].user_id === userId) {
      userURLs[shortURL] = database[shortURL];
    }
  }
  return userURLs;
}


//GET REQUESTS
app.get("/", (req, res) => {
  res.send("Hello!");
});

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
app.get("/urls", (req, res) => {
  const user_id =  req.session.user_id;
  const user = users[user_id];
  const userURLs = urlsForUser(user_id, urlDatabase);
  const templateVars = { urls: userURLs, user: user};
  if(!user_id) {
    res.render("error_page", templateVars);
  } else {
  res.render("urls_index", templateVars);
   }
});

//
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: null};
  res.render("urls_register", templateVars);
});

//
app.get("/login", (req, res) => {
  const user_id =  req.session.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user: user};
  if(user_id) {
    res.redirect("/urls")
  } else {
  res.render("login_page", templateVars);
  }
});

//
app.get("/urls/new", (req, res) => {
  const user_id =  req.session.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user: user};
  if(user_id) {
   res.render("urls_new", templateVars);
  } else {
    res.render("login_page", templateVars);
  }
});

//
app.get("/urls/:shortURL", (req, res) => {
  const user_id =  req.session.user_id;
  const user = users[user_id];
  const userURLs = urlsForUser(user_id, urlDatabase)
  const shortURL = req.params.shortURL;
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: user
  }
  if (!user_id) {
    res.render("error_page", templateVars);
  } else if (!userURLs[shortURL]) {
  res.render("error_page2", templateVars);
  } else {
    res.render("urls_shows", templateVars);
  }
});

//
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><body></html>\n");
});

//
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});



//POSTS Requests

//Submiting a new longURL and converting it to shortURL
app.post("/urls", (req, res) => {
  let user_id = req.session.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    user_id: user_id
  }
  res.redirect(`/urls/${shortURL}`);
});

//delete
app.post("/urls/:shortURL/delete", (req, res) => {
  let user_id = req.session.user_id;
  const user = users[user_id];
  let removeURL = req.params.shortURL;
  const userURLs = urlsForUser(user_id, urlDatabase);
  const templateVars = { urls: userURLs, user: user };
  if (user_id && user_id === urlDatabase[removeURL].user_id) {
    delete urlDatabase[removeURL];
    res.redirect("/urls");
  } else {
    res.render("error_page3", templateVars);
  }
});

//edit
app.post("/urls/:shortURL", (req, res) => {
  let user_id = req.session.user_id;
  const user = users[user_id];
  let newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(user_id, urlDatabase);
  const templateVars = { urls: userURLs, user: user };
  if (user_id && user_id === urlDatabase[shortURL].user_id) {
  urlDatabase[shortURL] = {
    longURL: newURL,
    user_id: user_id
  }
  res.redirect("/urls");
} else {
  res.render("error_page3", templateVars);
}
});

//POST Register
app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  if (!email|| !password) {
    res.status(400).send("Please include a valid email address and password.");
  } else if (emailUser(email, users)) {
      res.status(400).send("This email is already associated with an account.");
  } else {

    users[user_id] = {
      id: user_id, 
      email: email, 
      password: bcrypt.hashSync(password, 10)
    };

    req.session.user_id = user_id;
    res.redirect("/urls");
    // console.log(users);
  }
});

//
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user_id = getUserId(email, users);
  let inputPassword = userPassword(email, users);
  if (user_id && bcrypt.compareSync(password, inputPassword)) {
    req.session.user_id = user_id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid username and/or password")
  }
})

//
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("urls/");
});

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

