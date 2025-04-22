

// 实现最近对话的收起和展开
const conversation = document.querySelector(".recentConversation");

const hideConversation = document.querySelector(".allConversation");

const hideArraw = document.querySelector(".arraw");

const menu1 = document.querySelector(".menu1 div");

conversation.addEventListener("click", function () {
    if (hideConversation.style.display === "flex") {
        hideConversation.style.display = "none";
        hideArraw.src = "photos/arrawRight.png";
        menu1.style.display = "block";
    }else {
        hideConversation.style.display = "flex";
        hideArraw.src = "photos/arrawDown.png";
        menu1.style.display = "none";
    }
})

//实现资助计划的删除
const deleteAd = document.querySelector(".cancel");
const ad = document.querySelector(".ad");

deleteAd.addEventListener("click", function () {
    ad.style.display = "none";
})
//发送按钮样式变化
const send = document.querySelector(".send");
const input = document.querySelector(".input");

input.addEventListener("input", function () {
    if (input.value.trim() !== "") {
        send.disabled = false;
        send.classList.add("enabled");
    } else {
        send.disabled = true;
    }
})

// 登录与注册页面的打开与关闭
const openLogin = document.querySelector(".userName");
const loginAndSignup = document.querySelector(".loginAndSignup");
const closeLogin = document.querySelector(".closeLogin");
const closeSignup = document.querySelector(".closeSignup");

closeLogin.addEventListener("click", function () {
    loginAndSignup.style.display = "none";
})
closeSignup.addEventListener("click", function () {
    loginAndSignup.style.display = "none";
})

openLogin.addEventListener("click", function () {
    loginAndSignup.style.display = "flex";
})

//按钮的点击效果

//注册登录界面切换
const login = document.querySelector(".login");
const signup = document.querySelector(".signup");

const switchSignup = document.querySelector("#signup");
const switchLogin = document.querySelector("#login");

switchSignup.addEventListener("click", function () {
    login.style.display = "none";
    signup.style.display = "flex";
})
switchLogin.addEventListener("click", function () {
    login.style.display = "flex";
    signup.style.display = "none";
})


//登录注册邮箱验证
const checkmail = function (email,error) {
    const inputMail = document.querySelector(email);
    const theError = document.querySelector(error);
    inputMail.onblur = function () {
        if (!inputMail.value.includes("@")) {
            inputMail.classList.add("invalid");
            inputMail.style.border = "1px solid red";
            theError.innerHTML = "*请输入正确的邮箱";
        }
    };
    inputMail.onfocus = function () {
        if (this.classList.contains("invalid")) {
            this.style.border = "none";
            inputMail.classList.remove("invalid");
            theError.innerHTML = "";
        }
    };
}
checkmail(".loginEmail","#loginError");
checkmail(".signupEmail", "#signupError");

//登录与注册按钮验证
const checkButton = function (selectButton,selectEmail,selectPassword) {
    const button = document.querySelector(selectButton);
    const email = document.querySelector(selectEmail);
    const password = document.querySelector(selectPassword);
    password.addEventListener("input", function () {
    if (email.value.includes("@") && password.value.trim() !== "") {
        button.disabled = false;
        button.classList.add("enabled");
    } else {
        button.disabled = true;
        }
        });
}
checkButton(".loginBtn", ".loginEmail", ".loginPassword");
checkButton(".signupBtn", ".signupEmail", ".signupPassword");

//实现注册
const registerPage = document.querySelector(".signup");
const signupPage = document.querySelector(".login");

async function registerServer(username,email,password){
    try{
        const response = await fetch('api/register',{
            method:'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                username:username,
                email:email,
                password:password
            })
        })
        const data = await response.json();
        if(response.ok){
            console.log("注册成功!");
            registerPage.style.display = "none";
            signupPage.style.display = "flex";
        }
        else if(response.status == 409){
            const error = document.querySelector("#signupError");
            error.innerHTML = "*该邮箱已被注册";
        }
    }catch(error){
        console.error(error);
    }
}
const signupBtn = document.querySelector(".signupBtn");
signupBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const username = document.querySelector(".username").value;
    const signupEmail = document.querySelector(".signupEmail").value;
    const signupPassword = document.querySelector(".signupPassword").value;
    registerServer(username,signupEmail,signupPassword);
});
//实现登录
const loginBtn = document.querySelector(".loginBtn");

async function loginServer(email,password) {
    try{
        const response = await fetch('api/login',{
            method:"POST",
            headers:{
                'content-Type' : 'application/json',
            },
            body:JSON.stringify({
                email    : email,
                password : password
            })
        })
        const data = await response.json();

        if(response.ok){
            alert("登录成功！");
    	    const loginAndSignup = document.querySelector(".loginAndSignup");
            loginAndSignup.style.display = "none";
            const userName = document.querySelector(".userName");
	        userName.innerHTML = data.userName;
            localStorage.setItem('token',data.token);
        }
        else if(response.status == 401){
            wrong.innerHTML = "*该邮箱未注册，请先注册";
        }else if(response.status == 402){
            wrong.innerHTML = "*邮箱或密码错误";
        }
    }catch(error){
        console.log('请求失败',error);
    }
}

loginBtn.addEventListener("click", function (event) {
    event.preventDefault();

    const loginEmail = document.querySelector(".loginEmail").value;
    const loginPassword = document.querySelector(".loginPassword").value;
    const wrong = document.querySelector(".wrong");
    loginServer(loginEmail,loginPassword);

});


//获取登陆状态，自动登录
async function checkLoginStatus(){
    try{
        const response = await fetch('api/auth/check',{
            method:"GET",
	    credentials: 'include'
        })
        const status = await response.json();
        return status;
    }catch(error){
        console.error(error);
    }
}
async function modifyLogStatus(){
    const status = await checkLoginStatus();
    if (status.isLoggedIn){
        const userName = document.querySelector(".userName");
        userName.innerHTML = status.user.username;
        const loginBtn = document.querySelector("#loginBtn");
        loginBtn.style.display = "none";
    }else{
        const logoutBtn = document.querySelector("#logoutBtn");
        logoutBtn.style.display = "none";
    }
}
modifyLogStatus();

//弹出对话框
// 实现聊天页面的发送消息
const newConversation = document.querySelector(".newConversation");
const chatBox = document.querySelector(".chat-box");
const allConversation = document.querySelector(".allConversation");

const chatWindow = document.querySelector(".chatWindow");
const messageInput = document.querySelector(".input");
const sendBtn = document.querySelector(".send");



// 推理模式开关
let reasoner = document.querySelector("#reasoner");
reasoner.addEventListener("click", function () {
    if (reasoner.classList.contains("active")) {
        reasoner.classList.remove("active");
        reasoner.classList.add("close");
    } else {
        reasoner.classList.remove("close");
        reasoner.classList.add("active");
    }
});



//发起对话
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", function (send) {
    if (send.key === "Enter") {
        if (chatBox.style.display === "none") {
            chatBox.style.display = "flex";
            clearChatHistory();
            }
        sendMessage();
    }
});
newConversation.addEventListener("click", function () {
    if (chatBox.style.display === "none") {
        return;
    } else {
        chatBox.style.display = "none";
    }
});
function displayMessage(message) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message.content;
    chatWindow.appendChild(messageDiv);
}
function displayBotMessage(messageHtml) {
    let messageElement = document.createElement("div");
    messageElement.classList.add("bot-message");
    messageElement.innerHTML = messageHtml
    chatWindow.appendChild(messageElement);
}
let chat = [];
async function sendMessage() {
    const message = messageInput.value.trim();
    if (message === "") {
        return;
    } else {
        const userMessage = {
            "role": "user",
            "content":message,
        };
        displayMessage(userMessage);
        chatHistory.push(userMessage);
        saveChatHistory();
        messageInput.value = "";
        sendBtn.disabled = true;
        chat.push(userMessage);
        try {
            if (reasoner.classList.contains("active")){
                let messages = getDeepSeekR1(chat);
                console.log(messages);
                let result = await messages;
                let reasoningContentHtml = marked(result[0]);
                let contentHtml = marked(result[1]);
                console.log(reasoningContentHtml);
                console.log(contentHtml);
                let bot = {
                    "role":"assistant",
                    "content":result[1]
                }
                chat.push(bot);
                displayMessage({"content":"reasoning content-------------------------------"});
                displayBotMessage(reasoningContentHtml);
                displayMessage({"content":"content-----------------------------"});
                displayBotMessage(contentHtml);
                chatHistory.push(contentHtml);
                saveChatHistory();
            }
            else{
                let messages = getDeepSeekV3(chat);
                let result = await messages;
                let resulthtml = marked(result);
                console.log(resulthtml);
                let bot = {"role":"assistant",
                    "content":result
                };
                chat.push(bot);
                displayBotMessage(resulthtml);
                chatHistory.push(resulthtml);
                saveChatHistory();
            }
        } catch (error) {
            console.error("出现错误：", error);
        }
    }
}

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
window.onload = function () {
    loadChatHistory();
}
function loadChatHistory() {
    chatHistory.forEach(message => {
        displayMessage(message);
    });
}
function saveChatHistory() {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}
function clearChatHistory() {
    localStorage.removeItem("chatHistory");
    chatHistory = [];
    chatWindow.innerHTML = "";
    chat = [];
}

// const openai = new OpenAI({
//     baseURL : 'https://api.deepseek.com',
//     apiKey: '',
//     dangerouslyAllowBrowser: true,
// })

// // 进行单轮对话
// async function getDeepSeekV3(chat){
//     const completion = await openai.chat.completions.create({
//         messages:chat,
//         model:"deepseek-chat",
//     });
//     let messages = completion.choices[0].message.content;
//     return messages;
// }

// //推理模式
// async function getDeepSeekR1(chat){
//     const completion = await openai.chat.completions.create({
//         model:"deepseek-reasoner",
//         messages:chat,
//     })
//     let reasoningContent = await completion.choices[0].message.reasoning_content;
//     let content = await completion.choices[0].message.content;
//     return [reasoningContent,content];
// }


