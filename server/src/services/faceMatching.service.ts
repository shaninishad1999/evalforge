import { createRequire } from "node:module";

import path from "path";

import mongoose from "mongoose";

import sharp from "sharp";

import * as tf from "@tensorflow/tfjs";

import * as wasm from "@tensorflow/tfjs-backend-wasm";

import FaceReference from "../models/FaceReference.js";

import FaceVerification from "../models/FaceVerification.js";

import ApiError from "../utils/ApiError.js";


// ============================================================
// LOAD FACE API WASM BUILD
// ============================================================

const require = createRequire(import.meta.url);

const faceapi = require(
  "@vladmandic/face-api/dist/face-api.node-wasm.js"
);


// ============================================================
// FACE API CONFIGURATION
// ============================================================

const modelsPath = path.resolve(
  process.cwd(),
  "models"
);


// ============================================================
// INITIALIZATION STATE
// ============================================================

let faceApiInitialized = false;


// ============================================================
// INITIALIZE FACE API
// ============================================================

const initializeFaceApi = async () => {
  if (faceApiInitialized) {
    return;
  }

  const wasmPath = path.resolve(
    process.cwd(),
    "node_modules",
    "@tensorflow",
    "tfjs-backend-wasm",
    "dist"
  );

  wasm.setWasmPaths(`${wasmPath}${path.sep}`);

  await tf.setBackend("wasm");
  await tf.ready();

  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

  faceApiInitialized = true;
};


// ============================================================
// CONVERT IMAGE TO TENSOR
// ============================================================

const imageToTensor = async (
  imagePath: string
) => {

  if (!imagePath) {

    throw new ApiError(
      400,
      "Face image path is required"
    );

  }


  // ============================================================
  // RESOLVE IMAGE PATH
  // ============================================================

  const absolutePath =
    path.resolve(imagePath);


  // ============================================================
  // READ IMAGE USING SHARP
  // ============================================================

  const { data, info } =
    await sharp(absolutePath)
      .removeAlpha()
      .raw()
      .toBuffer({
        resolveWithObject: true,
      });


  // ============================================================
  // VALIDATE IMAGE CHANNELS
  // ============================================================

  if (
    info.channels !== 3
  ) {

    throw new ApiError(
      400,
      "Invalid image format. RGB image is required"
    );

  }


  // ============================================================
  // CREATE TENSOR
  // ============================================================

  const tensor =
    tf.tensor3d(
      new Uint8Array(data),
      [
        info.height,
        info.width,
        info.channels,
      ],
      "int32"
    );


  return tensor;

};


// ============================================================
// GET FACE EMBEDDING
// ============================================================

const getFaceEmbedding = async (
  imagePath: string
): Promise<number[]> => {

  if (!imagePath) {

    throw new ApiError(
      400,
      "Face image path is required"
    );

  }


  // ============================================================
  // INITIALIZE FACE API
  // ============================================================

  await initializeFaceApi();


  // ============================================================
  // CREATE IMAGE TENSOR
  // ============================================================

  const image =
    await imageToTensor(
      imagePath
    );


  try {

    // ============================================================
    // DETECT FACE
    // ============================================================

    const detections =
      await faceapi
        .detectAllFaces(
          image,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();


    // ============================================================
    // NO FACE DETECTED
    // ============================================================

    if (
      !detections ||
      detections.length === 0
    ) {

      throw new ApiError(
        400,
        "No face detected in the image"
      );

    }


    // ============================================================
    // MULTIPLE FACES DETECTED
    // ============================================================

    if (
      detections.length > 1
    ) {

      throw new ApiError(
        400,
        "Multiple faces detected. Please upload an image with only one face"
      );

    }


    // ============================================================
    // GET FACE DESCRIPTOR
    // ============================================================

    const descriptor =
      detections[0].descriptor;


    // ============================================================
    // VALIDATE DESCRIPTOR
    // ============================================================

    if (
      !descriptor ||
      descriptor.length === 0
    ) {

      throw new ApiError(
        400,
        "Unable to generate face embedding"
      );

    }


    // ============================================================
    // RETURN DESCRIPTOR
    // ============================================================

    return Array.from(
      descriptor
    );

  } finally {

    // ============================================================
    // DISPOSE IMAGE TENSOR
    // ============================================================

    image.dispose();

  }

};


// ============================================================
// COMPARE TWO FACE EMBEDDINGS
// ============================================================

const compareFaceEmbeddings = (
  referenceEmbedding: number[],
  selfieEmbedding: number[]
) => {

  if (
    referenceEmbedding.length !==
    selfieEmbedding.length
  ) {

    throw new ApiError(
      400,
      "Face embeddings are incompatible"
    );

  }


  // ============================================================
  // CALCULATE EUCLIDEAN DISTANCE
  // ============================================================

  const distance =
    faceapi.euclideanDistance(
      referenceEmbedding,
      selfieEmbedding
    );


  // ============================================================
  // CONVERT DISTANCE TO SIMILARITY
  // ============================================================

  /*
   * FaceAPI euclidean distance:
   *
   * Lower distance = more similar
   *
   * We convert it into a 0-1 similarity score
   * for the existing EvalForge match-score system.
   */

  const similarity =
    Math.max(
      0,
      Math.min(
        1,
        1 - distance
      )
    );


  return similarity;

};


// ============================================================
// PERFORM FACE MATCH
// ============================================================

export const performFaceMatch = async (
  userId: string
) => {

  // ============================================================
  // VALIDATE USER ID
  // ============================================================

  if (
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {

    throw new ApiError(
      400,
      "Invalid user ID"
    );

  }


  // ============================================================
  // GET FACE REFERENCE
  // ============================================================

  const faceReference =
    await FaceReference.findOne({
      userId,
    });


  if (!faceReference) {

    throw new ApiError(
      404,
      "Face reference not found"
    );

  }


  if (
    faceReference.status !==
    "READY"
  ) {

    throw new ApiError(
      409,
      "Face reference is not ready"
    );

  }


  // ============================================================
  // GET FACE VERIFICATION
  // ============================================================

  const faceVerification =
    await FaceVerification.findOne({
      userId,
    });


  if (!faceVerification) {

    throw new ApiError(
      404,
      "Face verification session not found"
    );

  }


  // ============================================================
  // CHECK VERIFICATION STATUS
  // ============================================================

  if (
    faceVerification.verificationStatus ===
    "LOCKED"
  ) {

    throw new ApiError(
      403,
      "Face verification is locked"
    );

  }


  if (
    faceVerification.verificationStatus ===
    "PASSED"
  ) {

    throw new ApiError(
      409,
      "Face verification is already completed"
    );

  }


  // ============================================================
  // CHECK LIVENESS
  // ============================================================

  if (
    faceVerification.livenessStatus !==
    "PASSED"
  ) {

    throw new ApiError(
      409,
      "Liveness verification must be completed first"
    );

  }


  // ============================================================
  // CHECK SELFIE
  // ============================================================

  if (
    !faceVerification.selfieUrl
  ) {

    throw new ApiError(
      400,
      "Verification selfie not found"
    );

  }


  // ============================================================
  // CHECK FACE MATCH ATTEMPTS
  // ============================================================

  if (
    faceVerification.faceMatchAttempts >=
    faceVerification.maxFaceMatchAttempts
  ) {

    faceVerification.matchStatus =
      "FAILED";

    faceVerification.verificationStatus =
      "LOCKED";

    faceVerification.rejectionReason =
      "Maximum face matching attempts reached";

    await faceVerification.save();


    throw new ApiError(
      403,
      "Maximum face matching attempts reached"
    );

  }


  // ============================================================
  // START FACE MATCHING
  // ============================================================

  faceVerification.matchStatus =
    "PROCESSING";

  faceVerification.faceMatchAttempts +=
    1;

  await faceVerification.save();


  try {

    // ============================================================
    // GENERATE REFERENCE EMBEDDING
    // ============================================================

    const referenceEmbedding =
      await getFaceEmbedding(
        faceReference.imageUrl
      );


    // ============================================================
    // GENERATE SELFIE EMBEDDING
    // ============================================================

    const selfieEmbedding =
      await getFaceEmbedding(
        faceVerification.selfieUrl
      );


    // ============================================================
    // COMPARE FACES
    // ============================================================

    const similarity =
      compareFaceEmbeddings(
        referenceEmbedding,
        selfieEmbedding
      );


    // ============================================================
    // CONVERT SIMILARITY TO PERCENTAGE
    // ============================================================

    const matchScore =
      Math.round(
        similarity * 10000
      ) / 100;


    // ============================================================
    // FACE MATCH THRESHOLD
    // ============================================================

    const matchThreshold =
      faceVerification.matchThreshold;


    // ============================================================
    // CHECK MATCH RESULT
    // ============================================================

    const matched =
      matchScore >=
      matchThreshold;


    faceVerification.matchScore =
      matchScore;

    faceVerification.matchThreshold =
      matchThreshold;


    // ============================================================
    // MATCHED
    // ============================================================

    if (matched) {

      faceVerification.matchStatus =
        "MATCHED";

      faceVerification.verificationStatus =
        "PASSED";

      faceVerification.matchedAt =
        new Date();

      faceVerification.completedAt =
        new Date();

      faceVerification.rejectionReason =
        "";

      await faceVerification.save();


      return {

        matched: true,

        matchScore,

        matchThreshold,

        matchStatus:
          faceVerification.matchStatus,

        verificationStatus:
          faceVerification.verificationStatus,

        matchedAt:
          faceVerification.matchedAt,

      };

    }


    // ============================================================
    // NOT MATCHED
    // ============================================================

    faceVerification.matchStatus =
      "NOT_MATCHED";

    faceVerification.verificationStatus =
      "FAILED";

    faceVerification.rejectionReason =
      "Face does not match the reference image";

    await faceVerification.save();


    return {

      matched: false,

      matchScore,

      matchThreshold,

      matchStatus:
        faceVerification.matchStatus,

      verificationStatus:
        faceVerification.verificationStatus,

      matchedAt: null,

    };


  } catch (error) {

    // ============================================================
    // FACE MATCH ERROR
    // ============================================================

    faceVerification.matchStatus =
      "FAILED";

    faceVerification.verificationStatus =
      "FAILED";

    faceVerification.rejectionReason =
      "Face matching could not be completed";

    await faceVerification.save();

    throw error;

  }

};