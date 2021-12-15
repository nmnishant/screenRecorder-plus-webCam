
let cameraRecElem = document.querySelector('#cameraRecord');
let recBtn = document.querySelector('.record-btn');
let startBtn = document.querySelector('.startBtn');
let countDown = document.querySelector('.countDown');
let startContainer = document.querySelector('.start-container');
let inProgressContainer = document.querySelector('.inprogress-container');
let saveVideoContainer = document.querySelector('.saveVideo-container');
let stopRecBtn =  document.querySelector('.stopRec');
let optionContainer = document.querySelector('.options-container');
let micBtn = document.querySelector('.mic-icon');
let homeBtn = document.querySelector('.ph-house');

let counting;
let recorder;
let chunks = [];


// Event listeners
startBtn.addEventListener('click', (e) => {
    startContainer.classList.add('hide');
    optionContainer.classList.add('hide');
    inProgressContainer.classList.remove('hide');
    let micStatus = micBtn.classList.contains('mic-disabled');
    Array.from(optionContainer.children).forEach((elem)=>{
        if(elem.classList.contains('selected')){
            let optionNo = elem.dataset.option;
            if(optionNo == 0) cameraRecording(micStatus);
            else if(optionNo == 1) screenRecording(micStatus);
            else cameraPlusScreenRecording(micStatus);
        }
    });
});

stopRecBtn.addEventListener('click', (e) => {
    inProgressContainer.classList.add('hide');
    saveVideoContainer.classList.remove('hide');
    recorder.stop();
});

optionContainer.addEventListener('click', (e) => {
    let targetElem = e.target.closest('.option');
    if(!targetElem) return;

    Array.from(optionContainer.children).forEach((elem) => elem.classList.remove('selected'));
    targetElem.classList.add('selected');
});

micBtn.addEventListener('click', (e) => {
    micBtn.classList.toggle('mic-disabled');
    if(micBtn.classList.contains('mic-disabled')) micBtn.classList.replace('ph-microphone', 'ph-microphone-slash');
    else micBtn.classList.replace('ph-microphone-slash', 'ph-microphone');
});

homeBtn.addEventListener('click', setDefaultUI);

document.querySelector('.saveBtn-container').addEventListener('click', (e) => {
    
})


// Functions
const record = function(stream, pipStatus, stream2){
    recorder = new MediaRecorder(stream);
    
    recorder.addEventListener('start', (e) =>{
        chunks = [];
        if(pipStatus) cameraRecElem.requestPictureInPicture() && (cameraRecElem.style.opacity="0");
    });

    recorder.addEventListener('dataavailable', (e) =>{
        chunks.push(e.data);
    });

    recorder.addEventListener('stop', (e) =>{
        stream.getTracks().forEach(track => track.stop());
        if(stream2) stream2.getTracks().forEach(track => track.stop());
        clearInterval(counting);
        setLink(chunks);
        if(pipStatus) document.exitPictureInPicture();
    });

    startCountDown();
    recorder.start();
}


const cameraRecording = async function(micStatus){
    try{
        const stream = await navigator.mediaDevices.getUserMedia({
            video : true, 
            audio: micStatus ? false : true
        });
        cameraRecElem.srcObject = stream;
        record(stream, true);
    }
    catch(err){
        showError('Error accessing camera or microphone');
    }
};

const screenRecording = async function(micStatus){
    try{
        let stream = await navigator.mediaDevices.getDisplayMedia({ video : true });
        if(!micStatus) stream.addTrack(await getAudioTrack());
        record(stream, false);
    }
    catch{
        showError('Error capturing screen or microphone');
    }
}

const cameraPlusScreenRecording = async function(micStatus){
    try{
        let screenStream = await navigator.mediaDevices.getDisplayMedia({ video : true });
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video : true, audio: true });
        cameraRecElem.srcObject = cameraStream;

        if(!micStatus) screenStream.addTrack(cameraStream.getAudioTracks()[0]);
        record(screenStream, true, cameraStream);   
    }
    catch(err){
        if(err == "Error accessing microphone") showError(err);
        else showError('Error accessing camera or capturing screen');
    }
}

async function getAudioTrack(){
    try{
        let audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                noiseSuppression: true,
                echoCancellation: true
            }
        });
    
        let audioTrack = audioStream.getAudioTracks()[0];
        return audioTrack;
    }
    catch{
        return Promise.reject('Error accessing microphone');
    }
}

function setDefaultUI(){
    document.querySelector('.save-vid').src = '';
    document.querySelector('.saveBtnLink').setAttribute('href', '');
    countDown.innerHTML = '00:00';
    startContainer.classList.remove('hide');
    optionContainer.classList.remove('hide');
    inProgressContainer.classList.add('hide');
    saveVideoContainer.classList.add('hide');
}

function startCountDown(){
    let sec = 0;
    counting = setInterval(() => {
        sec++;
        let min = Math.floor(sec/60);
        countDown.innerHTML = (`${min >= 10 ? min : '0'+min}:${sec%60 >= 10 ? sec%60 : '0'+sec%60}`);
    }, 1000);
}

function setLink(chunks){
    console.log(chunks);
    let blob = new Blob(chunks, { type: 'video/mp4' } );
    let videoURL = URL.createObjectURL(blob);
    let a = document.querySelector('.saveBtnLink');
    a.setAttribute('href', videoURL);
    a.setAttribute('download', 'recorded_video.mp4');
    let saveVideo = document.querySelector('.save-vid');
    saveVideo.src = videoURL;
}

function showError(msg){
    setDefaultUI();
    let errorElem = document.querySelector('.error-cont');
    errorElem.innerText = msg;
    errorElem.classList.remove('hide');
    setTimeout(()=>errorElem.classList.add('hide'), 3000);
}