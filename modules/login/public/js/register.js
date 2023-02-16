 //get the html elements with help from the DOM and saving it in local variables
      const confirm = document.getElementById('passwordverify');
      const password = document.getElementById('password');
      const button = document.querySelector('button');
      // getting the pre defined classses , in this case let is better because the value of the variables will change later
      let alert = document.querySelector('.alert_class1');
      let confirmalert = document.querySelector('.alert_class2');
      // at the begenning the button is disabled
      button.disabled = true;
      // set the display of the alert at the begining at none
      alert.style.display = 'none';
      confirmalert.style.display = 'none';
      // define regex
      let alphabet = /[a-zA-Z]/, //letter a to z and A to Z
        numbers = /[0-9]/, //numbers 0 to 9
        scharacters = /[.,!,@,#,$,%,^,&,*,?,_,(,),-,+,=,~]/; //special characters
      /**
       * passwordChecker function has no param
       * checks if the password input value  matches the minimum password complexity,
       *  if yes set the button to active and set the border color to green
       *  if no display an alert for 2 seconds , set the border to red and set the button to disabled
       * */
      const passwordChecker = () => {
        let val = password.value;
        if (
          val.match(alphabet) &&
          val.match(numbers) &&
          val.match(scharacters) &&
          val.length >= 8
        ) {
          password.style.borderColor = '#18A0FB'; // blue
          
        } else {
          alert.style.display = 'inline';
          alert.innerHTML = 'Password is not strong enough.';
          setTimeout(() => {
            alert.style.display = 'none';
          }, 2000);

          password.style.borderColor = '#CF1820'; // red
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
        if (passval == verifyval &&
           verifyval.match(alphabet) &&
          verifyval.match(numbers) &&
          verifyval.match(scharacters) &&
          verifyval.length >= 8 ) {
          password.style.borderColor = '#18A0FB'; 
          confirm.style.borderColor = '#18A0FB';
          button.disabled = false;
        } else {
          confirmalert.style.display = 'inline';
          confirmalert.innerHTML =
            'Passwords do not match. Please try again.';
          setTimeout(() => {
            confirmalert.style.display = 'none';
          }, 2000);

          password.style.borderColor = '18A0FB';
          confirm.style.borderColor = '18A0FB';
          button.disabled = true;
        }
      };
      //add eventlisteners to check user inputs
      password.addEventListener('keyup', passwordChecker);
      confirm.addEventListener('keyup', passwordMatcher);