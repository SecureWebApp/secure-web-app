/**
 *
 *Access the DOM
 */
const history = document.querySelector('.chatList');
const userList = document.querySelector('#userlist');
let csrf = document.getElementById('csrft').getElementsByTagName('input');
const send = document.getElementById('sendmessage');
const messageContent = document.getElementById('messagevalue');
const header = document.getElementById('chat-header');
const parentdiv = document.getElementById('parentdiv');
const warning = document.getElementById('warning');
const searchinput = document.getElementById('searchinput');
const search = document.getElementById('search');
let timeout = new Date();
let activeUser = {
  userId: 0,
};
//
send.disabled = true;

//console.log('value', csrf[0].value);
//console.log('name', csrf[0].name);
//global variable
let local = [];
let localUser = [];
/**
 * Get all users from database
 * Display the users as list
 * give evry user a data.id attribute to access it later
 * this function will be called directly when the page load
 * @see  'DOMContentLoaded' EventListener
 */
//const getUsers = () => {
function getUsers() {
  let output = '';
  fetch('api/users', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      console.log(data);
      /*
       if(data.array.userId <=1)
       parentdiv.style="none"
       */
      if (data.array.length === 1) {
        console.log('hi');
        parentdiv.style.display = 'none';
        warning.style.display = 'block';
      } else {
        const temporary = data.array.filter(
          (data) => data.userId != activeUser.userId
        );

        //data.array.forEach((d) => {
        temporary.forEach((d) => {
          // <div class="name" name="${d.profile.userName}">${d.profile.userName}</div> line 49
          localUser.push(d);

          userList.innerHTML += `
        <li class="clearfix active">
         <img src="/img/user.png" alt="avatar" />
        <div class="about" data-id="${d.profile.profileId}">
         <div class="name">${d.profile.userName}</div>
   </div>
 </li>
        `;
        });
      }
    })
    //.then(getOwnProfile);
    .then(loadChats);
}
/**
 * Get the profile of the logged in user
 * will be called first
 *  this function will be called directly when the page load
 * @see  'DOMContentLoaded' EventListener
 * after this methode , getUs
 *
 *
 */
function getOwnProfile() {
  fetch('api/user/profile', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      activeUser.userId = data.userId;
    })
    //.then(loadChats);
    .then(getUsers);
}

// clear input
const removeInput = () => {
  messageContent.value = '';
};

/*
searchinput.addEventListener('input', (e) => {
  const value = e.target.value.toLowerCase();
  users.forEach((user) => {
    const isVisible =
      user.name.toLowerCase().includes(value) ||
      user.email.toLowerCase().includes(value);
    user.element.classList.toggle('hide', !isVisible);
  });
});
*/
/*
const searchforUser = () => {
  const li = userList.getElementsByTagName('li');
  var div, txtValue;
  for (i = 0; i < li.length; i++) {
    div = li[i].getElementsByTagName('div')[0];
    txtValue = div.textContent || div.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = '';
    } else {
      li[i].style.display = 'none';
    }
  }
};

search.addEventListener('click', searchforUser);
*/
//insert chat in UI
const insertMessageinUI = (value) => {
  if (value.length > 0) {
    send.disabled = false;
    history.innerHTML += `
    <li class="clearfix">
                    <div class="message-data text-right">
                      <span class="message-data-time">${
                        timeout.getHours() + ':' + timeout.getMinutes()
                      }</span>
                    </div>
                    <div class="message other-message float-right">
                      ${value}
                    </div>
                  </li>
  `;
  } else {
    send.disabled = true;
  }
};
//create a Message and stroe it in the database

/**
 *  sendMessage is a function that sends a message to a specified recipient and update the ui with the message
 * @returns {undefined} it doesn't return anything
 */
const sendMessage = () => {
  // retrieve the message content from the input
  const value = messageContent.value;
  // retrieve the receiver ID
  const receiverId = messageContent.getAttribute('data-id');
  // because of prettier
  const mockdata = 'Accept';

  if (value.length > 0) {
    /**
     * send a POST Request to the specified url
     * a messagee will be created and stored in the correspond it chat
     */
    fetch(`/api/chat/send/${receiverId}`, {
      method: 'POST',
      body: JSON.stringify({
        message: value,
      }),
      //needed headers
      headers: {
        [mockdata]: 'application/json',
        'Content-Type': 'application/json',
        [csrf[0].name]: csrf[0].value,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        csrf[0].name = data.csrf.name;
        csrf[0].value = data.csrf.value;
      });
    /**
     * add the message to the chat window
     * @see insertMessageinUI body
     */
    insertMessageinUI(value);
    /**
     * after the button is clicked, the input feld will be cleared
     * for next messages
     * @see removeInput body
     */
    removeInput();

    //document.location.reload();
  } else {
    console.log('hi');
  }
};

/**
 * Eventlistner, evry time the user click the send button
 * the sendMessage function will be called
 * @see sendMessage
 */
send.addEventListener('click', sendMessage);

//trigger send button when enter is clicked
messageContent.addEventListener('keyup', function (event) {
  event.preventDefault();
  if (event.keyCode === 13 && messageContent.value.length > 0) {
    send.click();
  }
});

// get all chats of the logged use
async function loadChats() {
  fetch('/api/chat', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      data.array.forEach((d) => local.push(d));
      // data.array.forEach((d) => local.push(d));
    });
}

/**
 *  getMessages will fetch the messages in the corresponding chat
 * @returns {undefined} it doesn't return anything
 */
const getMessages = (data) => {
  /**
   * fetching a GET request with the corresoinding url
   */
  fetch(`/api/chat/${data.chatId}`, {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    //csrf exchange with the backend
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      //loop in every message
      data.array.forEach((d) => {
        //if the creator of the message is the actual logged user
        // display the message on the right
        const sentonAtDate = new Date(d.sentOnAt);
        if (d.author === activeUser.userId) {
          history.innerHTML += `
    <li class="clearfix">
                    <div class="message-data text-right">
                      <span class="message-data-time">${
                        sentonAtDate.getHours() +
                        ':' +
                        sentonAtDate.getMinutes()
                      }</span>
                    </div>
                    <div class="message other-message float-right">
                     ${d.data}
                    </div>
                  </li>
                  `;
          //display the message on the left
        } else {
          history.innerHTML += `
            <li class="clearfix">
                    <div class="message-data">
                      <span class="message-data-time">${
                        sentonAtDate.getHours() +
                        ':' +
                        sentonAtDate.getMinutes()
                      }</span>
                    </div>
                    <div class="message my-message">
                      ${d.data}
                    </div>
                  </li>`;
        }
      });
    });
};

//document.addEventListener('DOMContentLoaded', loadChats);
//document.querySelector('#chats').addEventListener('click', loadData);

/**
 * every list item has a id and can be clickable
 * after clicking on a user , the old messages should be loaded
 * and this specific user will be set as receiver
 *
 */
userList.addEventListener('click', (e) => {
  if (e.target.parentElement.classList.contains('about')) {
    send.disabled = false;
    // getting the id attribute
    const id = e.target.parentElement.dataset.id;
    localUser.forEach((d) => {
      if (d.userId == e.target.parentElement.dataset.id) {
        header.innerHTML = `<div class="col-lg-6">
                    
                    <div class="chat-about">
                      <h6 class="m-b-0">${d.profile.userName}</h6>
                    </div>
                  </div>`;
        history.innerHTML = '';
      }
    });
    local.forEach((d) => {
      if (d.participant2.userId == e.target.parentElement.dataset.id) {
        console.log(d.participant2.userId);
        console.log(e.target.parentElement.dataset.id);
        history.innerHTML = '';
        getMessages(d);
        /*
        setTimeout(() => {
          console.log('hi from timeout');
          document.location.reload();
        }, 3000);*/
      }
    });
    messageContent.setAttribute('data-id', id);
  }
  e.preventDefault();
});
/**
 * call getOwnProfile when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', getOwnProfile);
