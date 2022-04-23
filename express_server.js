//app configurations
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const e = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["Fear is a tool, when that light hits the sky, it's not just a call, it's a warning!"]
}));
const urlDatabase = {};
const users = {};

//Helper Functions
const { generateRandomString, emailUser, userPassword, getUserByEmail, urlsForUser } = require('./helpers');



//----------------------------------GET REQUESTS---------------------------------------

//GET request to the root page
//If user is logged in it will redirect to /urls main index page, otherwise it will redirect to login page
app.get("/", (req, res) => {
  const user_Id = req.session.user_Id;
  if (user_Id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


//GET request to the main /urls index page
//If logged in, it will show the URLs beloning to the user -- otherwise an error response will render
app.get("/urls", (req, res) => {
  const user_Id =  req.session.user_Id;
  const user = users[user_Id];
  const userURLs = urlsForUser(user_Id, urlDatabase);
  const templateVars = { urls: userURLs, user: user};
  if (!user_Id) {
    res.render("error_page", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }
});


//GET request to the register page
//Render the registration/Create an Account page
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: null};
  res.render("urls_register", templateVars);
});


//GET Request to login page
//If logged in, it will redirect to the /urls main index page --- otherwise it will render the login page
app.get("/login", (req, res) => {
  const user_Id =  req.session.user_Id;
  const user = users[user_Id];
  const templateVars = { urls: urlDatabase, user: user};
  if (user_Id) {
    res.redirect("/urls");
  } else {
    res.render("login_page", templateVars);
  }
});


//GET request to create a new shortURL
//Will only display the page if a user is logged in --- otherwise it will redirect to login page
app.get("/urls/new", (req, res) => {
  const user_Id =  req.session.user_Id;
  const user = users[user_Id];
  const templateVars = { urls: urlDatabase, user: user};
  if (user_Id) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login_page", templateVars);
  }
});


//GET request to edit longURL
//If logged in, users can update thier longURLs only if it belongs to them --- otherwise an error page will render
app.get("/urls/:shortURL", (req, res) => {
  const user_Id =  req.session.user_Id;
  const user = users[user_Id];
  const userURLs = urlsForUser(user_Id, urlDatabase);
  const shortURL = req.params.shortURL;
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: user
  };
  if (!user_Id) {
    res.render("error_page", templateVars);
  } else if (!userURLs[shortURL]) {
    res.render("error_page2", templateVars);
  } else {
    res.render("urls_shows", templateVars);
  }
});


//GET request to the shortURL
//If shortURL exists in the database it will redirect to the longURL --- otherwise an error page will render
app.get("/u/:shortURL", (req, res) => {
  let user = users[req.session.user_id];
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(longURL);
  } else {
    res.render("error_page2", user);
  }
});



//----------------------------------------------------------POSTS Requests-----------------------------

//POST Request for submiting a new longURL and converting it to shortURL
//Adds the new longURL and associated shortURL to the urlDatabase and redirects to /urls/:shortURLs page
app.post("/urls", (req, res) => {
  let user_Id = req.session.user_Id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    user_Id: user_Id
  };
  res.redirect(`/urls/${shortURL}`);
});


//POST request for deleting a shortURL along with the associated longURL
//Deletes the shortURL and the longURL from the urlDatabase if it belongs to the user --- otherwise an error page will render
app.post("/urls/:shortURL/delete", (req, res) => {
  let user_Id = req.session.user_Id;
  const user = users[user_Id];
  let removeURL = req.params.shortURL;
  const userURLs = urlsForUser(user_Id, urlDatabase);
  const templateVars = { urls: userURLs, user: user };
  if (user_Id && user_Id === urlDatabase[removeURL].user_Id) {
    delete urlDatabase[removeURL];
    res.redirect("/urls");
  } else {
    res.render("error_page3", templateVars);
  }
});


//POST request to edit/update an existing shortURL with a new longURL
//Updates the shortURL to the new longURL in the urlDatabase if it belongs to the user --- otherwise an error page will render
app.post("/urls/:shortURL", (req, res) => {
  let user_Id = req.session.user_Id;
  const user = users[user_Id];
  let newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(user_Id, urlDatabase);
  const templateVars = { urls: userURLs, user: user };
  if (user_Id && user_Id === urlDatabase[shortURL].user_Id) {
    urlDatabase[shortURL] = {
      longURL: newURL,
      user_Id: user_Id
    };
    res.redirect("/urls");
  } else {
    res.render("error_page3", templateVars);
  }
});


//POST Request when a user creates an account
//If the inputted email address exists in the users database --- an error response will render
//If the provided email address and password are valid then it will add user to the users database and redirect to the /urls main index page
app.post("/register", (req, res) => {
  let user_Id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Please include a valid email address and password.");
  } else if (emailUser(email, users)) {
    res.status(400).send("This email is already associated with an account.");
  } else {

    users[user_Id] = {
      id: user_Id,
      email: email,
      password: bcrypt.hashSync(password, 10)
    };

    req.session.user_Id = user_Id;
    res.redirect("/urls");
  }
});


//POST Request when a user logs in
//If the inputted email address and password match with one in the users database then it will redirect to the main /urls index page --- an error resposne will render
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user_Id = getUserByEmail(email, users);
  let inputPassword = userPassword(email, users);
  if (user_Id && bcrypt.compareSync(password, inputPassword)) {
    req.session.user_Id = user_Id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid username and/or password");
  }
});


//POST Request when logging out
//Clear the encrypted cookies and redirect user to the main /urls index page where it will prompt user to login
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("urls/");
});


//Server listening on the provided PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

