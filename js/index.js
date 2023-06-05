// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB7hJJeeUJPJ7nFTHuEp3DYYeOF7wrJWJk",
    authDomain: "seller-6a33e.firebaseapp.com",
    databaseURL: "https://seller-6a33e-default-rtdb.firebaseio.com",
    projectId: "seller-6a33e",
    storageBucket: "seller-6a33e.appspot.com",
    messagingSenderId: "1026233826913",
    appId: "1:1026233826913:web:08e0a85ba0b3fcee1cf420"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize variables
  const auth = firebase.auth();
  const database = firebase.database();
  
  // Set up our register function
  function register() {
  // Get all our input fields
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  
  // Validate input fields
  if (validate_email(email) == false || validate_password(password) == false) {
    alert('Email or Password is Outta Line!!');
    return;
  }
  
  // Move on with Auth
  auth.createUserWithEmailAndPassword(email, password)
    .then(function() {
      // Declare user variable
      var user = auth.currentUser;
  
      // Add this user to Firebase Database
      var database_ref = database.ref();
  
      // Create User data
      var user_data = {
        email: email,
        last_login: Date.now(),
        user_tokens: []
      };
  
      // Push to Firebase Database
      database_ref.child('users/' + user.uid).set(user_data);
  
      // Done
      alert('User Created!!');
    })
    .catch(function(error) {
      // Firebase will use this to alert its errors
      var error_code = error.code;
      var error_message = error.message;
  
      alert(error_message);
    });
  }
  
  // Set up our login function
  function login() {
  // Get all our input fields
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  
  // Validate input fields
  if (validate_email(email) == false || validate_password(password) == false) {
    alert('Email or Password is Outta Line!!');
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password)
    .then(function() {
      // Declare user variable
      var user = auth.currentUser;
  
      // Check if user is already logged in on another device
      if (user && user.uid !== firebase.auth().currentUser.uid) {
        // Sign out from the current device
        auth.signOut()
          .then(function() {
            alert('You are already logged in on another device. Please log out from that device to continue.');
          })
          .catch(function(error) {
            var error_message = error.message;
            alert(error_message);
          });
        return;
      }
  
      // Add this user to Firebase Database
      var userRef = database.ref('users/' + user.uid);
  
      // Check if user is already logged in on another device
      userRef.once('value', function(snapshot) {
        if (snapshot.exists()) {
          var userData = snapshot.val();
          if (userData.isLoggedIn) {
            auth.signOut()
              .then(function() {
                alert('You are already logged in on another device. Please log out from that device to continue.');
              })
              .catch(function(error) {
                var error_message = error.message;
                alert(error_message);
              });
          } else {
            // Update user's login status
            userRef.update({
              isLoggedIn: true
            })
              .then(function() {
                // Done
                alert('User Logged In!!');
  
                // Redirect to welcome page
                window.location.href = 'welcome.html';
              })
              .catch(function(error) {
                var error_message = error.message;
                alert(error_message);
              });
          }
        } else {
          // User does not exist in the database, create new entry
          userRef.set({
            isLoggedIn: true
          })
            .then(function() {
              // Done
              alert('User Logged In!!');
  
              // Redirect to welcome page
              window.location.href = 'welcome.html';
            })
            .catch(function(error) {
              var error_message = error.message;
              alert(error_message);
            });
        }
      });
    })
    .catch(function(error) {
      // Firebase will use this to alert its errors
      var error_code = error.code;
      var error_message = error.message;
  
      alert(error_message);
    });
  }
  
  
  // Validate Functions
  function validate_email(email) {
  expression = /^[^@]+@\w+(\.\w+)+\w$/;
  if (expression.test(email) == true) {
    // Email is good
    return true;
  } else {
    // Email is not good
    return false;
  }
  }
  
  function validate_password(password) {
  // Firebase only accepts lengths greater than 6
  if (password.length < 6) {
    return false;
  } else {
    return true;
  }
  }
  
  // Logout function
  function logout() {
  auth.signOut()
    .then(function() {
      // Sign-out successful
      alert('User Logged Out!!');
  
      // Redirect to login page
      window.location.href = 'index.html';
    })
    .catch(function(error) {
      // An error happened
      var error_code = error.code;
      var error_message = error.message;
  
      alert(error_message);
    });
  }
  
  // Check if user is authenticated
  firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in
    if (window.location.pathname.includes('/index.html')) {
      // Redirect to welcome page
      window.location.href = 'welcome.html';
    }
  } else {
    // User is not signed in
    if (window.location.pathname.includes('/welcome.html')) {
      // Redirect to login page
      window.location.href = 'index.html';
    }
  }
  });
  
  // Set up account removal listener
  firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in
    const userRef = firebase.database().ref('users/' + user.uid);
  
    userRef.on('value', function(snapshot) {
      if (!snapshot.exists()) {
        // User's account has been removed
        firebase.auth().signOut().then(function() {
          // User logged out successfully
          alert('Your account has been removed. You have been logged out.');
          window.location.href = 'index.html';
        }).catch(function(error) {
          // An error occurred while logging out
          console.log(error);
        });
      }
    });
  }
  });
  
  // Set up token removal listener
  firebase.auth().onIdTokenChanged(function(user) {
  if (user) {
    // User is signed in
    const userRef = firebase.database().ref('users/' + user.uid);
  
    userRef.child('user_tokens').once('value', function(snapshot) {
      const tokens = snapshot.val();
  
      // Remove all tokens except the current one
      const currentToken = firebase.auth().currentUser.getIdToken();
      const filteredTokens = tokens.filter(token => token !== currentToken);
  
      // Update the user's tokens
      userRef.child('user_tokens').set(filteredTokens);
    });
  }
  });
  
  