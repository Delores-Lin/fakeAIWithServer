

// 实现最近对话的收起和展开
const conversation = document.querySelector(".recentConversation");

const hideConversation = document.querySelector(".allConversation");

const hideArraw = document.querySelector(".arraw");

const menu1 = document.querySelector(".menu1 div");

conversation.addEventListener("click", function () {
    if (hideConversation.style.display === "flex") {
        hideConversation.style.display = "none";
        hideArraw.src = "photos/arrawRight.png";
	if(menu1)
        	menu1.style.display = "block";
    }else {
        hideConversation.style.display = "flex";
        hideArraw.src = "photos/arrawDown.png";
	if(menu1)
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
        if(data.success = true){
            console.log("验证邮件已发送，请前往邮箱查收，即可完成注册");
            alert("[验证邮件已发送!]请前往邮箱查收，即可完成注册");
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
const loginAccountBtn = document.querySelector("#loginBtn");
const logoutAccountBtn = document.querySelector("#logoutBtn");
const wrong = document.querySelector(".wrong");

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
	console.log(response.status);
        if(response.ok){
            alert("登录成功！");
    	    const loginAndSignup = document.querySelector(".loginAndSignup");
            loginAndSignup.style.display = "none";
            const userName = document.querySelector(".userName");
	    userName.innerHTML = data.userName;
      	    logoutAccountBtn.style.display = "block";
            loginAccountBtn.style.display = "none";
            localStorage.setItem('token',data.token);
            await loadChatHistoryList();
        }
        else if(response.status == 401){
            wrong.innerHTML = "*该邮箱未注册，请先注册";
        }else if(response.status == 402){
            wrong.innerHTML = "*邮箱或密码错误";
        }else if(response.status == 403){
	    console.log(response.status);
	    wrong.innerHTML = "*该邮箱未验证";
	}
    }catch(error){
        console.log('请求失败',error);
    }
}

loginBtn.addEventListener("click", function (event) {
    event.preventDefault();

    const loginEmail = document.querySelector(".loginEmail").value;
    const loginPassword = document.querySelector(".loginPassword").value;
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
        await loadChatHistoryList();
    }else{
        const logoutBtn = document.querySelector("#logoutBtn");
        logoutBtn.style.display = "none";
        const userName = document.querySelector(".userName");
        userName.innerHTML = "请登录";
    }
}
modifyLogStatus();

//退出登陆状态
async function logoutServer(){
    try{
        const response = await fetch("api/logout",{
            method:"POST",
        })
        const result = await response.json();
	console.log("result:",result);
        allConversation.innerHTML = "";
        const chatBox = document.querySelector(".chat-box");
        chatBox.innerHTML = "";
        return result.success;
    }catch(error){
        console.log("登出错误",error);
	return false;
    }
}
logoutAccountBtn.addEventListener("click",async()=>{
    const status = await logoutServer();
    console.log(status);
    if(status){
        logoutAccountBtn.style.display = "none";
        loginAccountBtn.style.display = "block";
        const userName = document.querySelector(".userName");
        userName.innerHTML = "请登录";
    }
})
//完善登录窗口打开方式
loginAccountBtn.addEventListener("click",()=>{
    loginAndSignup.style.display = "flex";
})

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
let chat_Id = null;

sendBtn.addEventListener("click", ()=>{
        if (getComputedStyle(chatBox).display === "none") {
            chatBox.style.display = "flex";
            }
	const chatWindow = document.querySelector(".messageShowing")
	if(chatWindow) chat_Id = chatWindow.id.split("-")[1];
	else chat_Id = null;
	sendMessage(chat_Id,messageInput);
});


messageInput.addEventListener("keypress", function (send) {
    if (send.key === "Enter") {
        if (getComputedStyle(chatBox).display === "none") {
            chatBox.style.display = "flex";
            }
	const chatWindow = document.querySelector(".messageShowing")
	if(chatWindow) chat_Id = chatWindow.id.split("-")[1];
	else chat_Id = null;
        sendMessage(chat_Id,messageInput);
    }
});

newConversation.addEventListener("click", function () {
    if (getComputedStyle(chatBox).display === "none") {
        return;
    } else {
        const lastShow = document.querySelector(".messageShowing");
	if (lastShow) lastShow.className = "message";
        chatBox.style.display = "none";
    }
});

function displayMessage(message,chatId) {
    console.log(message);
    const messageDiv = document.createElement("div");
    messageDiv.className = "userContent";
    messageDiv.textContent = message;
    const chatWindow = document.querySelector(`.chatWindow#chat-${chatId}`);
    chatWindow.appendChild(messageDiv);
}

function displayBotMessage(data,chatId) {
	console.log(data);
    let messageElement = document.createElement("div");
    messageElement.classList.add("bot-message");
    if(data.reasoningContent && data.reasoningContent != ""){
	console.log(data.reasoningContent)
        const reasoningH = document.createElement("H3");
        reasoningH.innerHTML = "reasoning:";
        const reasoningP = document.createElement("p");
        reasoningP.innerHTML = data.reasoningContent;
        messageElement.appendChild(reasoningH);
        messageElement.appendChild(reasoningP);
    }
    const contentH = document.createElement("H3");
    contentH.innerHTML = "content:";
    const contentP = document.createElement("p");
    contentP.innerHTML = data.content;
    messageElement.appendChild(contentH);
    messageElement.appendChild(contentP);
    const chatWindow = document.querySelector(`.chatWindow#chat-${chatId}`);
    chatWindow.appendChild(messageElement);
}

async function initChat(title) {
    try{
        const response = await fetch('/chat/start',{
            method:"POST",
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                title:title
            })
        });
        const data = await response.json();
        chat_Id = data.chatId;
        const msgblock = document.createElement('section');
            const lastShow = document.querySelector(".messageShowing");
            if (lastShow) lastShow.style.className = "message";
            msgblock.className = "messageShowing";
            msgblock.id = `chat-${chat_Id}`;
            const p = document.createElement('p');
            p.innerHTML = title;
            msgblock.appendChild(p);
	    msgblock.addEventListener("click",()=>{
                const lastShow = document.querySelector(".messageShowing");
                if (lastShow) lastShow.className = "message";
                msgblock.className = "messageShowing";
            });
        const chatWindow = document.createElement("div");
        chatWindow.className = "chatWindow";
        chatWindow.id = `chat-${chat_Id}`;
        chatWindow.style.display = "flex";
	chatBox.appendChild(chatWindow);
	    allConversation.prepend(msgblock);

    }catch(err){
        console.error(err);
    }
}

let model = "deepseek-chat";

function extractTitle(text) {
    // 取第一句或前20字
    const sentenceEnd = text.search(/[。！？.\?!]/);
    if (sentenceEnd !== -1) {
        return text.slice(0, sentenceEnd + 1);
    }
    return text.slice(0, 20);
}

async function sendMessage(chatId,messageInput) {
    const message = messageInput.value.trim();
    if (message === "") {
        return;
    } else {
	const LogStatus = await checkLoginStatus();
        if (! LogStatus.isLoggedIn){
	    console.log("未登录，请先登录");
            showError("未登录，请先登录");
            return false;
        }
	messageInput.value = "";
        if (!chat_Id){
            const title = extractTitle(message);
            await initChat(title);
        }
        displayMessage(message,chat_Id);
	if (reasoner.classList.contains("active")){
		model = "deepseek-reasoner";
	}
	else{
		model = "deepseek-chat";
	}
        const res = await fetch(`/chat/${chat_Id}/message`,{
            method : "POST",
            headers : {'Content-Type':'application/json'},
            body : JSON.stringify({
                text : message,
                model:model
            })
        })

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
            const {contentP,reasoningP}= createChatBox(reasoner.classList.contains("active")?1:0);

        while(true) {
            const {value,done} = await reader.read();
            if(done) break;

            buffer += decoder.decode(value,{stream:true});
            const parts = buffer.split('\n\n');
            buffer = parts.pop();


            for(const part of parts){
                if(part.startsWith('data:')) {
                    const payload = JSON.parse(part.replace(/^data:\s*/,''));
		    console.log(payload);
                    if(payload.chunck) {
			//console.log(payload.chunk);
                        contentP.innerHTML += payload.chunck;
                    }
                }else if(part.startsWith('reasoning_data:')) {
                    const payload = JSON.parse(part.replace(/^reasoning_data:\s*/,''));
                    if(payload.chunck) {
                        reasoningP.innerHTML += payload.chunck;
                    }
                }
            }
        }
    }
}

function createChatBox(reasoning){
    let messageElement = document.createElement("div");
    messageElement.classList.add("bot-message");
    const reasoningH = document.createElement("H3");
    const reasoningP = document.createElement("p");
    if(reasoning){
        reasoningH.innerHTML = "reasoning:";
        reasoningP.innerHTML = '';
        messageElement.appendChild(reasoningH);
        messageElement.appendChild(reasoningP);
    }
    const contentH = document.createElement("H3");
    contentH.innerHTML = "content:";
    const contentP = document.createElement("p");
    contentP.innerHTML = '';
    messageElement.appendChild(contentH);
    messageElement.appendChild(contentP);
    const chatWindow = document.querySelector(`.chatWindow#chat-${chat_Id}`);
    chatWindow.appendChild(messageElement);
    return {contentP : contentP,
            reasoningP : reasoningP};
}

//加载历史对话
async function loadChatHistoryList(){
    const status = await checkLoginStatus();
//    console.log(status.isloggedIn);
    if (!status.isLoggedIn) return;
    let chatList = [];
    try{
        const res = await fetch("/chat/history/list",{method:"GET"});
        chatList = await res.json();
    }catch(err){
        console.error(err);
    }
    console.log(chatList);
    chatList.rows.forEach(chat =>{
        //添加侧边栏的chatBlock
        const msgblock = document.createElement('section');
        msgblock.className = "message";
        msgblock.id = `chat-${chat.chatId}`;
            const p = document.createElement('p');
            p.innerHTML = chat.title;
            msgblock.appendChild(p);
            allConversation.appendChild(msgblock);
        //预添加聊天窗口
        const chatWindow = document.createElement("div");
        chatWindow.className = "chatWindow";
        chatWindow.id = `chat-${chat.chatId}`;
        chatWindow.style.display = "none";
        const chatBox = document.querySelector(".chat-box");
        chatBox.appendChild(chatWindow);
        const chatId = chat.chatId;
        msgblock.addEventListener("click",async(event)=>{
            const lastShow = document.querySelector(".messageShowing");
	    console.log(lastShow);
            if (lastShow) lastShow.className = "message";
            msgblock.className = "messageShowing";
            const chatWindows = document.querySelectorAll(".chatWindow");
            chatWindows.forEach(chatWindow =>{
                chatWindow.style.display = "none";
            })
//	    console.log(chat);
            const chatWindow = document.querySelector(`.chatWindow#${msgblock.id}`);
//	    console.log(msgblock);
            chatWindow.style.display = "flex";
	    chatBox.style.display = "flex";
            if(chatWindow.innerHTML.trim() == "")
                await loadChatHistoryContent(chatId);
        })
    })
}

async function loadChatHistoryContent(chatId){
    const res = await fetch(`/chat/${chatId}/history/content`,{
        method:"GET"
    });
    const datas = await res.json();
    datas.forEach(data =>{
	console.log(data);
        if(data.sender == "user") {
            displayMessage(data.content,chatId);
        }else {
            displayBotMessage(data,chatId);
        }
    })
}

function showError(message, duration = 3000) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
