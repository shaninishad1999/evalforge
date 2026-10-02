import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import uploadPanDocumentMiddleware, {
  uploadSelfie,
} from "../middleware/upload.middleware.js";

import {
  getMe,
  updateMe,
  getMyKyc,
  submitMyKyc,
  uploadPanDocument,
} from "../controllers/user.controller.js";

import {
  getMyFaceVerification,
  startMyFaceVerification,
  uploadMySelfie,
} from "../controllers/faceVerification.controller.js";

import {
  submitMyLiveness,
} from "../controllers/liveness.controller.js";

import {
  getMyFaceReference,
  uploadMyFaceReference,
} from "../controllers/faceReference.controller.js";

const router = Router();

router.use(authenticate);

// ============================================================
// PROFILE
// ============================================================

router.get(
  "/me",
  asyncHandler(getMe)
);

router.patch(
  "/me",
  asyncHandler(updateMe)
);

// ============================================================
// KYC
// ============================================================

router.get(
  "/me/kyc",
  asyncHandler(getMyKyc)
);

router.post(
  "/me/kyc",
  asyncHandler(submitMyKyc)
);

// ============================================================
// PAN DOCUMENT UPLOAD
// ============================================================

router.post(
  "/me/kyc/pan-document",
  uploadPanDocumentMiddleware.single(
    "panDocument"
  ),
  asyncHandler(uploadPanDocument)
);

// ============================================================
// FACE VERIFICATION
// ============================================================

// Get face verification status
router.get(
  "/me/face-verification",
  asyncHandler(
    getMyFaceVerification
  )
);

// Start face verification
router.post(
  "/me/face-verification/start",
  asyncHandler(
    startMyFaceVerification
  )
);

// Submit liveness result
router.post(
  "/me/face-verification/liveness",
  asyncHandler(
    submitMyLiveness
  )
);

// Upload selfie after liveness
router.post(
  "/me/face-verification/selfie",
  uploadSelfie.single("selfie"),
  asyncHandler(
    uploadMySelfie
  )
);

// ============================================================
// FACE REFERENCE
// ============================================================

router.get(
  "/me/face-reference",
  asyncHandler(
    getMyFaceReference
  )
);

router.post(
  "/me/face-reference",
  uploadSelfie.single(
    "referenceFace"
  ),
  asyncHandler(
    uploadMyFaceReference
  )
);

export default router;