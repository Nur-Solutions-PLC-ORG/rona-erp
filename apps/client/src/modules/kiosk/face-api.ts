import * as faceapi from "face-api.js";

const MODELS_URI = "/models";

/** Distance threshold for recognition; lower is stricter. */
const FACE_MATCH_THRESHOLD = 0.55;

export interface EnrolledFace {
  id: string;
  descriptor: number[];
}

let faceApiReady: Promise<void> | null = null;

export function loadFaceApi(): Promise<void> {
  if (!faceApiReady) {
    faceApiReady = faceapi.nets.tinyFaceDetector
      .loadFromUri(MODELS_URI)
      .then(() => faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URI))
      .then(() => faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URI))
      .then(() => undefined);
  }
  return faceApiReady;
}

async function acquireCameraVideo(): Promise<{
  video: HTMLVideoElement;
  stop: () => void;
}> {
  const video = document.createElement("video");
  video.id = "face-api-video";
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.position = "fixed";
  video.style.left = "-10000px";
  video.style.top = "0";
  document.body.appendChild(video);

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false,
    });
  } catch (error) {
    video.remove();
    const name = (error as { name?: string })?.name;
    if (
      name === "NotAllowedError" ||
      name === "PermissionDeniedError"
    ) {
      throw new Error("PERMISSION_DENIED");
    }
    if (name === "NotFoundError") {
      throw new Error("NO_CAMERA");
    }
    if (name === "NotReadableError") {
      throw new Error("CAMERA_BUSY");
    }
    throw new Error("CAMERA_FAILED");
  }

  video.srcObject = stream;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("CAMERA_FAILED"));
      setTimeout(() => reject(new Error("CAMERA_TIMEOUT")), 10000);
    });
    await video.play();
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    video.remove();
    throw error;
  }

  return {
    video,
    stop: () => {
      stream.getTracks().forEach((track) => track.stop());
      video.remove();
    },
  };
}

async function computeFaceDescriptor(): Promise<number[]> {
  await loadFaceApi();
  const camera = await acquireCameraVideo();
  try {
    const results = await faceapi
      .detectAllFaces(
        camera.video,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (results.length === 0) {
      throw new Error("NO_FACES_DETECTED");
    }
    if (results.length > 1) {
      throw new Error("MANY_FACES");
    }

    return Array.from(results[0].descriptor);
  } finally {
    camera.stop();
  }
}

/** Computes a face descriptor to store during HR enrollment. */
export async function enrollFace(): Promise<number[]> {
  return computeFaceDescriptor();
}

/**
 * Authenticates the person in front of the camera against the given
 * enrolled faces and returns the matched enrollment id, or throws an
 * Error with a machine-readable message.
 */
export async function authenticateFace(
  faces: EnrolledFace[],
): Promise<string> {
  if (faces.length === 0) {
    throw new Error("NO_ENROLLED_FACES");
  }

  const descriptor = await computeFaceDescriptor();

  const labeled = faces.map(
    (face) =>
      new faceapi.LabeledFaceDescriptors(face.id, [
        Float32Array.from(face.descriptor),
      ]),
  );
  const matcher = new faceapi.FaceMatcher(labeled, FACE_MATCH_THRESHOLD);
  const bestMatch = matcher.findBestMatch(Float32Array.from(descriptor));

  if (bestMatch.label === "unknown") {
    throw new Error("UNRECOGNIZED_FACE");
  }

  return bestMatch.label;
}

const FACE_ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED:
    "Camera access was denied. Allow camera access to use face sign-in.",
  NO_CAMERA: "No camera was found on this device.",
  CAMERA_BUSY: "The camera is in use by another application.",
  CAMERA_FAILED: "The camera could not be started. Please try again.",
  CAMERA_TIMEOUT: "The camera took too long to start. Please try again.",
  NO_FACES_DETECTED:
    "No face was detected. Stand in front of the camera and try again.",
  MANY_FACES:
    "More than one face was detected. Only one person should be in view.",
  NO_ENROLLED_FACES:
    "No employees have an enrolled face yet. Ask an administrator to enroll faces.",
  UNRECOGNIZED_FACE:
    "Face not recognized. Stand in front of the camera and try again.",
};

export function friendlyFaceError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error);
  return (
    FACE_ERROR_MESSAGES[message] ??
    "Face recognition failed. Please try again."
  );
}