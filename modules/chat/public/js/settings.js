//get the html elements with help from the DOM and saving it in local variables
const confirm = document.getElementById('passwordverify');
const password = document.getElementById('password');
const button = document.querySelector('#button');
const username = document.getElementById('username').value;
const names = document.getElementById('name').value;
const bio = document.getElementById('bio').value;

const data = {
  name: names,
  username: username,
  bio: bio,
};

const saveChanges = () => {
  fetch('https://localhost:80/settings', {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      name: name.value,
      username: username.value,
      website: bio.value,
    }),
  })
    .then((response) => {
      if (response.status === 200) {
        // The request was successful
        return response.json();
      } else {
        // There was an error with the request
        throw new Error('Request failed');
      }
    })
    .then((data) => {
      console.log(data);
    })
    .catch((error) => console.error(error));
};

const reloadChanges = () => {
  fetch('https://jsonplaceholder.typicode.com/users/1')
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // ;(name.innerHTML = `${data.name}`),
      //   (username.innerHTML = `${data.username}`)
    });
};

// getting the pre defined classses , in this case let is better because the value of the variables will change later
let alert = document.querySelector('.alert_class');
let confirmalert = document.querySelector('.alert_class2');

// set the display of the alert at the begining at none
alert.style.display = 'none';
confirmalert.style.display = 'none';
// define regex
let alphabet = /[a-zA-Z]/, //letter a to z and A to Z
  numbers = /[0-9]/, //numbers 0 to 9
  scharacters = /[!,@,#,$,%,^,&,*,?,_,(,),-,+,=,~]/; //special characters
/**
 * passwordChecker function has no param
 * checks if the password input value  matches the minimum password complexity,
 *  if yes set the button to active and set the border color to green
 *  if no display an alert for 2 seconds , set the border to red and set the button to disabled
 * */
const passwordChecker = () => {
  button.disabled = true;
  let val = password.value;
  if (
    val.match(alphabet) &&
    val.match(numbers) &&
    val.match(scharacters) &&
    val.length >= 8
  ) {
    password.style.borderColor = '#22C32A';
    button.disabled = false;
  } else {
    alert.style.display = 'inline';
    alert.innerHTML = 'Password isnt strong , try again';
    setTimeout(() => {
      alert.style.display = 'none';
    }, 2000);

    password.style.borderColor = 'red';
    button.disabled = true;
  }
};

/**
 *  passwordMatcher function has no paramaters
 *  checks if the password matches the repeat password
 *  if yes set the button to active and set the repeat password border color to green
 *  if no display an alert for 2 seconds , set the repeat password border to red and set the button to disabled
 * */
const passwordMatcher = () => {
  let passval = password.value;
  let verifyval = confirm.value;
  if (
    passval == verifyval &&
    verifyval.match(alphabet) &&
    verifyval.match(numbers) &&
    verifyval.match(scharacters) &&
    verifyval.length >= 8
  ) {
    password.style.borderColor = '#22C32A';
    confirm.style.borderColor = '#22C32A';
    button.disabled = false;
  } else {
    confirmalert.style.display = 'inline';
    confirmalert.innerHTML =
      'Password and Verify Password doesnt match, try again';
    setTimeout(() => {
      confirmalert.style.display = 'none';
    }, 2000);

    password.style.borderColor = 'red';
    confirm.style.borderColor = 'red';
    button.disabled = true;
  }
};
//add eventlisteners to check user inputs
password.addEventListener('keyup', passwordChecker);
confirm.addEventListener('keyup', passwordMatcher);
button.addEventListener('click', saveChanges);
document.addEventListener('DOMContentLoaded', reloadChanges);
