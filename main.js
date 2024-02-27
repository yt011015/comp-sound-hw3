var audioCtx;
var globalGain;
var gainSum = 0;
const maxOverallGain = 0.8;
var rhpf;
const startButton = document.querySelector("#startButton");
const babblingBrookButton = document.querySelector("#babblingBrookButton");
const alarmButton = document.querySelector("#alarmButton");
const ballBounceButton = document.querySelector("#ballBounceButton");

startButton.addEventListener("click", initializeAudioContext, false); 
babblingBrookButton.addEventListener("click", babblingBrook, false); 
alarmButton.addEventListener("click", createAlarm, false); 
ballBounceButton.addEventListener("click", ballBounce, false);

function initializeAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        globalGain = audioCtx.createGain(); //this will control the volume of all notes
        globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
        globalGain.connect(audioCtx.destination);
    }
}


function babblingBrook() {
    let brownNoise = createBrownNoise();

    let lpf1 = createLPF(400);
    let lpf2 = createLPF(14);

    brownNoise.connect(lpf1);
    brownNoise.connect(lpf2);

    let gainNode = audioCtx.createGain();
    gainNode.gain.value = 400;
    lpf2.connect(gainNode);
    gainSum += gainNode.gain.value;

    rhpf = createRHPF(140, 15);
    lpf1.connect(rhpf);
    gainNode.connect(rhpf.frequency);

    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    updateGlobalGain();
    rhpf.connect(globalGain);

    brownNoise.start(0);

    setTimeout(() => {
        globalGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        brownNoise.stop(0);
    }, 5000);

    return;
}

function createBrownNoise() {
    var bufferSize = 10 * audioCtx.sampleRate,
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
    output = noiseBuffer.getChannelData(0);

    var lastOut = 0;
    for (var i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
    
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    brownNoise = audioCtx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    return brownNoise;
}

function createLPF(cutoffFrequency) {
    var filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoffFrequency;
    return filter;
}

function createRHPF(q, gain) {
    var filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.Q.value = q;
    filter.gain.value = gain;
    gainSum += filter.gain.value;
    return filter;
}

function updateGlobalGain() {
    let newGlobalGain = maxOverallGain / Math.max(1, gainSum);
    globalGain.gain.setValueAtTime(newGlobalGain, audioCtx.currentTime);
}

function createAlarm() {
    const osc = audioCtx.createOscillator();
    osc.frequency.value = 800;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.2;

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();

    let count = 0;
    function modulateFrequency() {
        count++;
        if (count % 5 === 0) {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
        } else if (count % 5== 1) {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime); 
        } else if (count % 5 == 2) {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
        } else if (count % 5 == 3) {
            osc.frequency.setValueAtTime(200, audioCtx.currentTime); 
        } else {
            osc.frequency.setValueAtTime(100, audioCtx.currentTime); 
        }
    }

    interval = setInterval(modulateFrequency, 150);

    setTimeout(() => {
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc.stop();
        clearInterval(interval);
    }, 5000);

    return;
}

function ballBounce() {

    let osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 120;
    osc.start(0);

    let gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    let envelope = createEnvelope();
    envelope.connect(gainNode.gain);
    gainNode.connect(audioCtx.destination);

    let count = 0;
    let intervalDuration = 120;
    interval = setInterval(modulateFrequency, intervalDuration);

    function createEnvelope() {
        const attackTime = 0.1;
        const decayTime = 0.1;
        const envelope = audioCtx.createGain();
        envelope.gain.setValueAtTime(0, audioCtx.currentTime);
        envelope.gain.setValueAtTime(0.5, audioCtx.currentTime)
        envelope.gain.setTargetAtTime(0.2, audioCtx.currentTime + attackTime, decayTime);
        return envelope;
    }

    function modulateFrequency() {
        if (count % 2 == 0) {
            osc.frequency.setValueAtTime(0, audioCtx.currentTime);
            clearInterval(interval);
            intervalDuration -= (2 + 0.1 * count);
            if (intervalDuration < 5) {
                const fadeoutDuration = 0.1;
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeoutDuration);
                osc.stop();
                clearInterval(interval);
                return;
            }
            interval = setInterval(modulateFrequency, intervalDuration)
        } else {
            osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        }
        count++;
    }
    
}
