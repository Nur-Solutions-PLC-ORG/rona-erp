import FaceIO from "@faceio/fiojs";

type FaceIoHandle = Pick<
  FaceIO,
  "enroll" | "authenticate" | "restartSession" | "fetchAllErrorCodes"
>;

let faceioInstance: FaceIoHandle | null = null;
let loadPromise: Promise<FaceIoHandle> | null = null;

const FIO_JS_CDN = "https://cdn.faceio.net/fio.js";

export function isFaceIoConfigured(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_FACEIO_PUBLIC_ID,
  );
}

async function getFaceIo(): Promise<FaceIoHandle> {
  if (!isFaceIoConfigured()) {
    throw new Error("FACEIO_NOT_CONFIGURED");
  }

  if (faceioInstance) return faceioInstance;

  if (!loadPromise) {
    loadPromise = loadFaceIo();
  }

  return loadPromise;
}

async function loadFaceIo(): Promise<FaceIoHandle> {
  const publicId = process.env.NEXT_PUBLIC_FACEIO_PUBLIC_ID!;
  const handle = new FaceIO(publicId);
  await waitForCdnWidget();
  faceioInstance = handle;
  return handle;
}

function waitForCdnWidget(): Promise<void> {
  const cdnReady = () =>
    typeof (window as unknown as { faceio?: unknown; faceIO?: unknown })
      .faceio !== "undefined" ||
    typeof (window as unknown as { faceio?: unknown; faceIO?: unknown })
      .faceIO !== "undefined";

  if (cdnReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${FIO_JS_CDN}"]`,
    );
    const script =
      existing ??
      (() => {
        const created = document.createElement("script");
        created.setAttribute("src", FIO_JS_CDN);
        created.setAttribute("defer", "true");
        document.head.appendChild(created);
        return created;
      })();

    if (script.dataset.loaded === "true" || cdnReady()) {
      resolve();
      return;
    }

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("FIO_CDN_FAILED")), {
      once: true,
    });

    setTimeout(() => {
      if (cdnReady()) {
        resolve();
      }
    }, 400);
  });
}

export async function enrollFace(payload: unknown): Promise<string> {
  const faceio = await getFaceIo();
  const result = await faceio.enroll({
    locale: "auto",
    showAbortBtn: true,
    payload,
  });
  return result.facialId;
}

export async function authenticateFace(): Promise<string> {
  const faceio = await getFaceIo();
  const result = await faceio.authenticate({ locale: "auto" });
  return result.facialId;
}

export function friendlyFaceIoError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FACEIO_NOT_CONFIGURED") {
      return "Face authentication is not configured on this device.";
    }
    if (error.message === "FIO_CDN_FAILED") {
      return "The face recognition service could not be loaded. Try again later.";
    }
  }

  const status = (
    error as { status?: string; reason?: string; code?: number } | undefined
  )?.status;
  const reason = (
    error as { status?: string; reason?: string; code?: number } | undefined
  )?.reason;

  if (status === "PERMISSION_REFUSED") {
    return "Camera access was denied. Allow camera access and try again.";
  }
  if (status === "NO_FACES_DETECTED") {
    return "No face was detected. Look directly at the camera and try again.";
  }
  if (status === "MANY_FACES") {
    return "Multiple faces were detected. Only one person should be in frame.";
  }
  if (status === "UNRECOGNIZED_FACE") {
    return "This face is not recognized on the kiosk.";
  }
  if (status === "FACE_DUPLICATION") {
    return "This face is already enrolled for an employee.";
  }
  if (status === "PAD_ATTACK") {
    return "The scan was flagged by the anti-spoofing check. Try again.";
  }
  if (status === "TIMEOUT" || status === "NETWORK_IO") {
    return "The face scan timed out. Check your network and try again.";
  }
  if (status === "FORBIDDEN_ORIGIN") {
    return "Face authentication is not allowed on this address.";
  }
  if (status === "ABORTED_BY_USER") {
    return "The face scan was cancelled.";
  }
  return (
    reason ??
    (error as { status?: string } | undefined)?.status ??
    "Face authentication failed. Please try again."
  );
}