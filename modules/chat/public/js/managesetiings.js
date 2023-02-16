let csrf = document.getElementById('csrft').getElementsByTagName('input');
const history = document.querySelector('.chatList');
const userList = document.querySelector('#userlist');
const accordion = document.querySelector('#accordionFlushExample');
let activeUser = {
  userId: 0,
};
/**
 * * Get the profile of the admin
 * will be called first
 *  this function will be called directly when the page load
 * @see  'DOMContentLoaded' EventListener
 * after this methode is interruptrd , getUsers will be called next
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
      //console.log(data.array);
      // console.log(data);
      activeUser.userId = data.userId;
    })
    //.then(loadChats);
    .then(getUsers);
};

const getUsers = () => {
  let output = '';
  fetch('/api/users', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      //console.log(data.array);
     // console.log(data);
      // filter chats without the admin
      const temporary = data.array.filter(
        (data) => data.participant1 != activeUser.userId
      );
      //data.array.forEach((d) => {

      temporary.forEach((d) => {
        /* userList.innerHTML += `
        <li class="clearfix active">
        <div class="about" data-id="${d.chatId}">
         <div class="name"}">ChatRoom${d.chatId}</div>
   </div>
 </li>
        `;*/
        const twofa = d.account.twoFAEnabled == 1 ? 'yes' : 'no';
        accordion.innerHTML += `
     <div class="accordion-item">
          <h2 class="accordion-header" id="flush-heading${d.account.accountId}">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#flush-collapse${d.account.accountId}"
              aria-expanded="false"
              aria-controls="flush-collapse${d.account.accountId}"
            >
              User #${d.account.accountId}
            </button>
          </h2>
          <div
            id="flush-collapse${d.account.accountId}"
            class="accordion-collapse collapse"
            aria-labelledby="flush-heading${d.account.accountId}"
            data-bs-parent="#accordionFlushExample"
          >
            <div class="accordion-body">
             <p> User email: ${d.account.email} <br> </p>
              <p>  Userame: ${d.profile.userName} </p> 
               <p> twoFAEnabled: ${twofa} </p> 
              <div class="delete" data-id=${d.account.accountId}>
             <button type="button" class="delete btn btn-danger" data-id=${d.account.accountId}>Delete User</button>
              </div>
             </div>
          </div>
        </div>
        `;
      });

      accordion;
    });
};

/*
 *  getMessages will fetch the messages in the corresponding chat
 * @returns {undefined} it doesn't return anything
 *  TODO show messages
 */
//
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
      //console.log(data);
      //loop in every message
    });
};

/**
 *
 * @param {e}  event
 * check first if the elemt has a delete class
 * get a confirmation from the admin
 * deleet the targeted user
 */

const deleteUser = (e) => {
  if (e.target.parentElement.classList.contains('delete')) {
    const id = e.target.parentElement.dataset.id;
    if (confirm('Are you sure?')) {
      fetch(`/api/user/${id}`, {
        method: 'DELETE',
        headers: {
          [csrf[0].name]: csrf[0].value,
        },
      })
        .then((response) => response.json)
        .then((data) => {
          csrf[0].name = data.csrf.name;
          csrf[0].value = data.csrf.value;
          getUsers();
        })
        .catch((err) => console.log(err));
    }
  }
};
// add listeners
accordion.addEventListener('click', deleteUser);
document.addEventListener('DOMContentLoaded', getOwnProfile);
