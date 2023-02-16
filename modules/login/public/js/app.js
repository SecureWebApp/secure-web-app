const warning = document.createElement('h4');

//Add class
warning.className = 'warning-text';

//create text node and append
warning.appendChild(
  document.createTextNode('Invalid credentials. Please try again.')
);

console.log(warning);
//Append warning as child to div

//Display text when login fails
//document.querySelector('.warning__container').appendChild(warning);
