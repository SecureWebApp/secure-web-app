let csrf = document.getElementById('csrft').getElementsByTagName('input');
const history = document.querySelector('.chatList');
const userList = document.querySelector('#userlist');
const accordion = document.querySelector('#accordionFlushExample');
let activeUser = {
  userId: 0,
};
/**
 *
 */
const getOwnProfile = () => {
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
      //console.log(data);
      activeUser.userId = data.userId;
    })
    //.then(loadChats);
    .then(getChats);
};

const getChats = () => {
  let output = '';
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
      // filter chats without the admin

      if (data.array.length === 0) {
        accordion.innerHTML = `
         <div class="warning-msg">
          <h4>No chats are available <br> Please try again later</h4>
         </div>`;
      } else {
        const temporary = data.array.filter(
          (data) => data.participant1 != activeUser.userId
        );

        temporary.forEach((d) => {
          accordion.innerHTML += `
     <div class="accordion-item">
          <h2 class="accordion-header" id="flush-heading${d.chatId}">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#flush-collapse${d.chatId}"
              aria-expanded="false"
              aria-controls="flush-collapse${d.chatId}"
            >
              ChatRoom #${d.chatId}
            </button>
          </h2>
          <div
            id="flush-collapse${d.chatId}"
            class="accordion-collapse collapse"
            aria-labelledby="flush-heading${d.chatId}"
            data-bs-parent="#accordionFlushExample"
          >
            <div class="accordion-body">
             <p> participant one: ${d.participant1.profile.userName} <br> </p>
              <p> participant two: ${d.participant2.profile.userName} </p>
              <div class="delete" data-id=${d.chatId}>
             <button type="button" class="delete btn btn-danger" data-id=${d.chatId}>Delete</button>
              </div>
             </div>
          </div>
        </div>
        `;
          getMessages(d.chatId);
        });
      }
      //accordion;
    });
};

/*
 *  getMessages will fetch the messages in the corresponding chat
 * @returns {undefined} it doesn't return anything
 */
const getMessages = (chatId) => {
  /**
   * fetching a GET request with the corresoinding url
   */
  fetch(`/api/chat/${chatId}`, {
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
      console.log(data);
      //loop in every message
    });
};

const deleteChat = (e) => {
  if (e.target.parentElement.classList.contains('delete')) {
    const id = e.target.parentElement.dataset.id;
    getMessages(id);
    if (confirm('Are you sure?')) {
      fetch(`/api/chat/${id}`, {
        method: 'DELETE',
        headers: {
          [csrf[0].name]: csrf[0].value,
        },
      })
        .then((response) => response.json)
        .then((data) => {
          csrf[0].name = data.csrf.name;
          csrf[0].value = data.csrf.value;
        })
        .then(() => {
          getChats();
          window.location.reload();
        })
        .catch((err) => console.log(err));
    }

    // getMessages(e.target.parentElement.dataset.id);
    // console.log(id);
  }
};

accordion.addEventListener('click', deleteChat);
/*

const getMessages = (chatId) => {
  /**
   * fetching a GET request with the corresoinding url
   */
/*
  fetch(`/api/chat/${chatId}`, {
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
      console.log(data);
      //loop in every message
      /*data.array.forEach((d) => {
        //if the creator of the message is the actual logged user
        // display the message on the right
        if (d.author === activeUser.userId) {
          history.innerHTML += `
    <li class="clearfix">
                    <div class="message-data text-right">
                      <span class="message-data-time">${d.sentOnAt}</span>
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
                      <span class="message-data-time">${d.sentOnAt}</span>
                    </div>
                    <div class="message my-message">
                      ${d.data}
                    </div>
                  </li>`;
        }
      });*/
//});
//};
/*
userList.addEventListener('click', (e) => {
  if (e.target.parentElement.classList.contains('about')) {
    // getting the id attribute
    const id = e.target.parentElement.dataset.id;
    console.log(id);
    getMessages(id);
  }
});*/

document.addEventListener('DOMContentLoaded', getOwnProfile);
