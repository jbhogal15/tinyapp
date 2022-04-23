//Generates a random string
const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};


//Checks if email is part of the users databse when logging in or registering
const emailUser = function(email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return true;
    }
  }
  return false;
};


//Find users password when provided with an email address
const userPassword = function(email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key].password;
    }
  }
  return undefined;
};


//Get user_id from email
const getUserByEmail = function(email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return key;
    }
  }
};


//Returns URLs for user_id
const urlsForUser = function(userId, database) {
  let userURLs = {};
  for (const shortURL in database) {
    if (database[shortURL].user_Id === userId) {
      userURLs[shortURL] = database[shortURL];
    }
  }
  return userURLs;
};


module.exports = { generateRandomString, emailUser, userPassword, getUserByEmail, urlsForUser };

