
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
let microphoneStream;

function resizeCanvas() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * devicePixelRatio);
  canvas.height = Math.floor(height * devicePixelRatio);
  canvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  canvasContext.clearRect(0, 0, width, height);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);

function drawVisualisation() {
  const drawVisual = requestAnimationFrame(drawVisualisation);
  analyser.getByteTimeDomainData(dataArray);
  // Fill solid color
  canvasContext.fillStyle = "rgb(49, 49, 49)";
  canvasContext.fillRect(0, 0, window.innerWidth, window.innerHeight);
  // Begin the path
  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = "rgb(13, 255, 0)";
  canvasContext.beginPath();
  // Draw each point in the waveform
  const sliceWidth = window.innerWidth / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const centreY = window.innerHeight / 2;
    const aplitude = window.innerHeight * 0.45;
    const y = centreY + ((dataArray[i] - 128) / 128) * aplitude;

    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }

    x += sliceWidth;
  }

  // Finish the line
  canvasContext.lineTo(window.innerWidth, window.innerHeight / 2);
  canvasContext.stroke();
}

async function startRecording() {
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.createMediaStreamSource(microphoneStream).connect(analyser);
      drawVisualisation();
      return true;
    } catch (err) {
      console.error(`The following getUserMedia error occurred: ${err}`);
      return false;
    }
  } else {
    console.log("Media capture is not supported on your browser!");
  }
}

async function stopRecording() {
  await audioContext.suspend();
  microphoneStream?.getTracks().forEach((track) => track.stop());
  microphoneStream = undefined;
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  console.log("Recording stopped.");
}


function setButtonState(button, isRecording, label) {
  button.dataset.recording = String(isRecording);
  button.setAttribute("aria-label", `${isRecording ? "Stop" : "Start"} ${label}`);
  button.querySelector(".sr-only").textContent = `${isRecording ? "Stop" : "Start"} ${label}`;
}

function addRecordingButton(button, label) {
  button.addEventListener("click", async () => {
    const isRecording = button.dataset.recording === "true";
    const nextState = !isRecording;

    setButtonState(button, nextState, label);

    if (nextState) {
      const started = await startRecording();
      if (!started) {
        setButtonState(button, false, label);
      }
    } else {
      await stopRecording();
    }
  });
}

addRecordingButton(
  document.querySelector("#record-button"),
  "microphone recording",
);
