const MODELS_URI = "/models";

let faceApiReady: Promise<typeof import("face-api.js")> | null = null;

function loadFaceApi() {
  if (!faceApiReady) {
    faceApiReady = import("face-api.js").then(async (faceapi) => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URI);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URI);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URI);
      return faceapi;
    }).catch((error) => {
      faceApiReady = null;
      throw error;
    });
  }
  return faceApiReady;
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener("abort", abort);
      reject(signal.reason);
    };
    if (signal.aborted) {
      reject(signal.reason);
    } else {
      signal.addEventListener("abort", abort, { once: true });
    }
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}

export async function captureFace(signal: AbortSignal): Promise<number[]> {
  signal.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error("CAPTURE_CANCELLED"));
  signal.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new Error("CAPTURE_TIMEOUT")),
    60000,
  );
  const dialog = document.createElement("dialog");
  dialog.className = "m-auto w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-black/60";
  dialog.setAttribute("aria-label", "Capture your face");
  const heading = document.createElement("h2");
  heading.textContent = "Capture your face";
  heading.className = "mb-3 text-xl font-semibold";
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.className = "aspect-video w-full rounded-lg bg-slate-900 object-cover -scale-x-100";
  video.setAttribute("aria-label", "Live camera preview");
  const status = document.createElement("p");
  status.className = "my-4 text-sm";
  status.setAttribute("role", "status");
  status.textContent = "Starting camera and loading face models…";
  const capture = document.createElement("button");
  capture.type = "button";
  capture.textContent = "Capture";
  capture.disabled = true;
  capture.className = "rounded-lg bg-purple-600 px-4 py-2 font-medium text-white disabled:opacity-50";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.className = "ml-3 rounded-lg border border-slate-300 px-4 py-2";
  cancelButton.onclick = cancel;
  dialog.oncancel = (event) => {
    event.preventDefault();
    cancel();
  };
  const frame = document.createElement("div");
  frame.className = "relative aspect-video w-full overflow-hidden rounded-lg";
  frame.setAttribute("aria-hidden", "true");
  const corners = document.createElement("div");
  corners.className = "pointer-events-none absolute inset-0 z-10";
  corners.innerHTML = [
    '<span class="rona-corner rona-corner-tl"></span>',
    '<span class="rona-corner rona-corner-tr"></span>',
    '<span class="rona-corner rona-corner-bl"></span>',
    '<span class="rona-corner rona-corner-br"></span>',
  ].join("");
  const sweep = document.createElement("div");
  sweep.className = "pointer-events-none absolute inset-x-0 top-0 z-10 rona-sweep";
  const flash = document.createElement("div");
  flash.className = "pointer-events-none absolute inset-0 z-20 rona-flash";
  frame.append(video, corners, sweep, flash);
  const kioskScanStyles = document.createElement("style");
  kioskScanStyles.textContent = [
    ".rona-corner{position:absolute;width:26px;height:26px;border:2px solid #22d3ee;}",
    ".rona-corner-tl{top:10px;left:10px;border-right-width:0;border-bottom-width:0;border-top-left-radius:12px;}",
    ".rona-corner-tr{top:10px;right:10px;border-left-width:0;border-bottom-width:0;border-top-right-radius:12px;}",
    ".rona-corner-bl{bottom:10px;left:10px;border-right-width:0;border-top-width:0;border-bottom-left-radius:12px;}",
    ".rona-corner-br{bottom:10px;right:10px;border-left-width:0;border-top-width:0;border-bottom-right-radius:12px;}",
    ".rona-sweep{height:3px;background:linear-gradient(90deg,transparent,#22d3ee,transparent);opacity:.85;animation:rona-sweep 1.6s linear infinite;}",
    "@keyframes rona-sweep{0%{top:-4px;}100%{top:calc(100% - 3px);}}",
    ".rona-flash{background:radial-gradient(circle,rgba(255,255,255,.95),rgba(209,250,229,.85));opacity:0;}",
    ".rona-flash.is-flashing{animation:rona-flash .45s ease-out;}",
    "@keyframes rona-flash{0%{opacity:0;}30%{opacity:1;}100%{opacity:0;}}",
  ].join("");
  document.head.appendChild(kioskScanStyles);
  dialog.append(heading, frame, status, capture, cancelButton);
  document.body.appendChild(dialog);
  let stream: MediaStream | undefined;
  try {
    dialog.showModal();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("NO_CAMERA");
    stream = await abortable(
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      }).then((media) => {
        if (controller.signal.aborted) {
          media.getTracks().forEach((track) => track.stop());
          throw controller.signal.reason;
        }
        return media;
      }),
      controller.signal,
    );
    const ready = new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("CAMERA_FAILED"));
    });
    video.srcObject = stream ?? null;
    await abortable(ready, controller.signal);
    await abortable(video.play(), controller.signal);
    const faceapi = await abortable(loadFaceApi(), controller.signal);
    status.textContent = "Position only your face in the preview, then select Capture. This scan is not identity verification.";
    capture.disabled = false;
    await abortable(new Promise<void>((resolve) => {
      capture.onclick = () => resolve();
    }), controller.signal);
    capture.disabled = true;
    status.textContent = "Capturing face…";
    const results = await abortable(
      Promise.resolve(faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }),
      ).withFaceLandmarks().withFaceDescriptors()),
      controller.signal,
    );
    controller.signal.throwIfAborted();
    if (results.length === 0) throw new Error("NO_FACES_DETECTED");
    if (results.length > 1) throw new Error("MANY_FACES");
    return Array.from(results[0].descriptor);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
    stream?.getTracks().forEach((track) => track.stop());
    video.pause();
    video.srcObject = null;
    video.onloadeddata = null;
    video.onerror = null;
    capture.onclick = null;
    cancelButton.onclick = null;
    dialog.oncancel = null;
    dialog.close();
    dialog.remove();
  }
}

const FACE_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: "Camera access was denied. Allow camera access to capture your face.",
  PermissionDeniedError: "Camera access was denied. Allow camera access to capture your face.",
  NotFoundError: "No camera was found on this device.",
  NotReadableError: "The camera is in use by another application.",
  NO_CAMERA: "No camera is available. Use a supported browser over HTTPS.",
  CAMERA_FAILED: "The camera could not be started. Please try again.",
  CAPTURE_CANCELLED: "Face capture cancelled.",
  CAPTURE_TIMEOUT: "Face capture expired. Please try again.",
  NO_FACES_DETECTED: "No face was detected. Stand in front of the camera and try again.",
  MANY_FACES: "More than one face was detected. Only one person should be in view.",
};

export function friendlyFaceError(error: unknown): string {
  if (error instanceof Error) {
    return FACE_ERROR_MESSAGES[error.message] ?? FACE_ERROR_MESSAGES[error.name] ??
      "Face capture failed. Please try again.";
  }
  return "Face capture failed. Please try again.";
}
