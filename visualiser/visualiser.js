
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
  requestAnimationFrame(drawVisualisation);
  analyser.getByteTimeDomainData(dataArray);

  // Calculate the microphone's overall volume (RMS), from 0 to 1.
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const sample = (dataArray[i] - 128) / 128;
    sumSquares += sample * sample;
  }
  const loudness = Math.sqrt(sumSquares / dataArray.length);

  // Fill solid color
  canvasContext.fillStyle = "rgb(49, 49, 49)";
  canvasContext.fillRect(0, 0, window.innerWidth, window.innerHeight);
  // Begin the path
  canvasContext.lineWidth = 2;
  // A quiet signal is blue; a loud signal moves towards red.
  canvasContext.strokeStyle = getBlueToRedColor(loudness, 0, 0.25);
  canvasContext.beginPath();
  // Draw each point in the waveform
  const sliceWidth = window.innerWidth / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const centreY = window.innerHeight / 2;
    const amplitude = window.innerHeight * 0.45;
    const y = centreY + ((dataArray[i] - 128) / 128) * amplitude;

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

function getBlueToRedColor(value, min, max) {
    // 1. Prevent division by zero if min and max are the same
    if (min === max) return `hsl(0deg 100% 50%)`;

    // 2. Clamp the incoming value strictly between your min and max boundaries
    const clampedValue = Math.max(min, Math.min(max, value));

    // 3. Normalize the value into a percentage percentage ratio (0.0 to 1.0)
    const ratio = (clampedValue - min) / (max - min);

    // 4. Interpolate from Blue (240) down to Red (0)
    const hue = 240 - (ratio * 240);

    // 5. Return the native CSS HSL string
    return `hsl(${hue}deg 100% 50%)`;
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
