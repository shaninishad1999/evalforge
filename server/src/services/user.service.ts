import User from "../models/User.js";
import KycProfile from "../models/KycProfile.js";
import ApiError from "../utils/ApiError.js";

import {
  UpdateProfileInput,
  SubmitKycInput,
} from "../validations/user.validation.js";

import { extractPanData } from "./ocr.service.js";

/**
 * =========================================
 * GET USER PROFILE
 * =========================================
 */
export const getUserProfile = async (
  userId: string
) => {
  const user = await User.findById(
    userId
  ).select("-password");

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  return user;
};

/**
 * =========================================
 * UPDATE USER PROFILE
 * =========================================
 */
export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileInput
) => {
  const user =
    await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  /**
   * Update name
   */
  if (data.name !== undefined) {
    user.name = data.name;
  }

  /**
   * Update phone number
   */
  if (
    data.phoneNumber !== undefined
  ) {
    user.phoneNumber =
      data.phoneNumber;
  }

  /**
   * Update avatar
   */
  if (data.avatar !== undefined) {
    user.avatar = data.avatar;
  }

  /**
   * Update skills
   */
  if (data.skills !== undefined) {
    user.skills = data.skills;
  }

  /**
   * Update languages
   */
  if (
    data.languages !== undefined
  ) {
    user.languages =
      data.languages;
  }

  await user.save();

  return User.findById(
    userId
  ).select("-password");
};

/**
 * =========================================
 * GET KYC PROFILE
 * =========================================
 */
export const getKycProfile = async (
  userId: string
) => {
  let kycProfile =
    await KycProfile.findOne({
      userId,
    });

  /**
   * Create KYC profile if it
   * doesn't exist.
   */
  if (!kycProfile) {
    kycProfile =
      await KycProfile.create({
        userId,
      });
  }

  return kycProfile;
};

/**
 * =========================================
 * SUBMIT KYC
 * =========================================
 */
export const submitKyc = async (
  userId: string,
  data: SubmitKycInput
) => {
  let kycProfile =
    await KycProfile.findOne({
      userId,
    });

  /**
   * Create KYC profile if needed.
   */
  if (!kycProfile) {
    kycProfile =
      await KycProfile.create({
        userId,
      });
  }

  /**
   * ---------------------------------------
   * ALREADY PROCESSING
   * ---------------------------------------
   */
  if (
    kycProfile.verificationStatus ===
    "PROCESSING"
  ) {
    throw new ApiError(
      409,
      "Your KYC verification is already under review"
    );
  }

  /**
   * ---------------------------------------
   * ALREADY APPROVED
   * ---------------------------------------
   */
  if (
    kycProfile.verificationStatus ===
    "APPROVED"
  ) {
    throw new ApiError(
      409,
      "Your KYC has already been approved"
    );
  }

  /**
   * ---------------------------------------
   * LOCKED
   * ---------------------------------------
   */
  if (
    kycProfile.verificationStatus ===
    "LOCKED"
  ) {
    throw new ApiError(
      403,
      "Your KYC verification is locked"
    );
  }

  /**
   * ---------------------------------------
   * MAXIMUM ATTEMPTS
   * ---------------------------------------
   */
  if (
    kycProfile.verificationAttempts >=
    kycProfile.maxVerificationAttempts
  ) {
    kycProfile.verificationStatus =
      "LOCKED";

    await kycProfile.save();

    throw new ApiError(
      403,
      "Maximum KYC verification attempts reached"
    );
  }

  /**
   * ---------------------------------------
   * PAN DOCUMENT CHECK
   * ---------------------------------------
   */
  if (
    !kycProfile.panDocumentUrl
  ) {
    throw new ApiError(
      400,
      "Please upload your PAN document before submitting KYC"
    );
  }

  /**
   * ---------------------------------------
   * OCR STATUS CHECK
   * ---------------------------------------
   */
  if (
    kycProfile.ocrStatus !==
    "COMPLETED"
  ) {
    throw new ApiError(
      400,
      "PAN document OCR is not completed yet"
    );
  }

  /**
   * ---------------------------------------
   * PAN NUMBER
   * ---------------------------------------
   */
  const panNumber =
    data.panNumber
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
      panNumber
    )
  ) {
    throw new ApiError(
      400,
      "Please provide a valid PAN number"
    );
  }

  /**
   * ---------------------------------------
   * PAN NAME
   * ---------------------------------------
   */
  const panName =
    data.panName.trim();

  if (
    panName.length < 2
  ) {
    throw new ApiError(
      400,
      "Please provide a valid PAN name"
    );
  }

  /**
   * ---------------------------------------
   * DATE OF BIRTH
   * ---------------------------------------
   */
  if (
    !data.dateOfBirth
  ) {
    throw new ApiError(
      400,
      "Please provide your date of birth"
    );
  }

  const parsedDateOfBirth =
    new Date(
      data.dateOfBirth
    );

  if (
    Number.isNaN(
      parsedDateOfBirth.getTime()
    )
  ) {
    throw new ApiError(
      400,
      "Please provide a valid date of birth"
    );
  }

  /**
   * ---------------------------------------
   * SAVE PAN DETAILS
   * ---------------------------------------
   */
  kycProfile.panNumber =
    panNumber;

  kycProfile.panName =
    panName;

  kycProfile.dateOfBirth =
    parsedDateOfBirth;

  /**
   * Keep uploaded document
   * reference.
   */
  if (
    data.panDocumentUrl
  ) {
    kycProfile.panDocumentUrl =
      data.panDocumentUrl;
  }

  /**
   * ---------------------------------------
   * SAVE ADDRESS
   * ---------------------------------------
   */
  kycProfile.addressLine1 =
    data.addressLine1;

  kycProfile.addressLine2 =
    data.addressLine2 || "";

  kycProfile.city =
    data.city;

  kycProfile.district =
    data.district;

  kycProfile.state =
    data.state;

  kycProfile.pincode =
    data.pincode;

  kycProfile.country =
    data.country;

  /**
   * ---------------------------------------
   * INCREMENT VERIFICATION ATTEMPT
   * ---------------------------------------
   */
  kycProfile.verificationAttempts +=
    1;

  /**
   * ---------------------------------------
   * SET PROCESSING
   * ---------------------------------------
   */
  kycProfile.verificationStatus =
    "PROCESSING";

  kycProfile.rejectionReason =
    "";

  kycProfile.submittedAt =
    new Date();

  kycProfile.verifiedAt =
    null;

  await kycProfile.save();

  return kycProfile;
};

/**
 * =========================================
 * SAVE PAN DOCUMENT + OCR
 * =========================================
 */
export const savePanDocument = async (
  userId: string,
  documentReference: string
) => {
  let kycProfile =
    await KycProfile.findOne({
      userId,
    });

  /**
   * Create KYC profile if needed.
   */
  if (!kycProfile) {
    kycProfile =
      await KycProfile.create({
        userId,
      });
  }

  /**
   * ---------------------------------------
   * ALREADY APPROVED
   * ---------------------------------------
   */
  if (
    kycProfile.verificationStatus ===
    "APPROVED"
  ) {
    throw new ApiError(
      409,
      "Your KYC has already been approved"
    );
  }

  /**
   * ---------------------------------------
   * LOCKED
   * ---------------------------------------
   */
  if (
    kycProfile.verificationStatus ===
    "LOCKED"
  ) {
    throw new ApiError(
      403,
      "Your KYC verification is locked"
    );
  }

  /**
   * ---------------------------------------
   * SAVE DOCUMENT REFERENCE
   * ---------------------------------------
   */
  kycProfile.panDocumentUrl =
    documentReference;

  /**
   * ---------------------------------------
   * CLEAR OLD OCR DATA
   * ---------------------------------------
   *
   * Very important.
   *
   * If the previous PAN document had:
   *
   * DOB = 05/10/2003
   *
   * and the next document OCR fails to
   * detect DOB, old DOB must NOT remain.
   */
  kycProfile.panNumber = "";

  kycProfile.panName = "";

  kycProfile.dateOfBirth =
    null;

  kycProfile.ocrData = {
    panNumber: "",
    name: "",
    dateOfBirth: "",
    confidence: 0,
  };

  /**
   * ---------------------------------------
   * START OCR
   * ---------------------------------------
   */
  kycProfile.ocrStatus =
    "PROCESSING";

  await kycProfile.save();

  try {
    /**
     * -------------------------------------
     * RUN OCR
     * -------------------------------------
     */
    const ocrResult =
      await extractPanData(
        documentReference
      );

    console.log(
      "📦 OCR Result:",
      ocrResult
    );

    /**
     * -------------------------------------
     * SAVE OCR DATA
     * -------------------------------------
     */
    kycProfile.ocrData = {
      panNumber:
        ocrResult.panNumber ??
        "",

      name:
        ocrResult.name ??
        "",

      dateOfBirth:
        ocrResult.dateOfBirth ??
        "",

      confidence:
        ocrResult.confidence ??
        0,
    };

    /**
     * -------------------------------------
     * AUTO-FILL PAN NUMBER
     * -------------------------------------
     */
    if (
      ocrResult.panNumber
    ) {
      kycProfile.panNumber =
        ocrResult.panNumber
          .trim()
          .toUpperCase();
    } else {
      kycProfile.panNumber =
        "";
    }

    /**
     * -------------------------------------
     * AUTO-FILL PAN NAME
     * -------------------------------------
     */
    if (
      ocrResult.name
    ) {
      kycProfile.panName =
        ocrResult.name.trim();
    } else {
      kycProfile.panName =
        "";
    }

    /**
     * -------------------------------------
     * AUTO-FILL DATE OF BIRTH
     * -------------------------------------
     *
     * OCR expected:
     *
     * 05/10/2003
     *
     * Database:
     *
     * 2003-10-05T00:00:00.000Z
     */
    if (
      ocrResult.dateOfBirth
    ) {
      const [
        day,
        month,
        year,
      ] =
        ocrResult.dateOfBirth.split(
          "/"
        );

      if (
        day &&
        month &&
        year
      ) {
        const dob =
          new Date(
            `${year}-${month}-${day}T00:00:00.000Z`
          );

        if (
          !Number.isNaN(
            dob.getTime()
          )
        ) {
          kycProfile.dateOfBirth =
            dob;
        } else {
          kycProfile.dateOfBirth =
            null;
        }
      } else {
        kycProfile.dateOfBirth =
          null;
      }
    } else {
      /**
       * Complete DOB not detected.
       *
       * Do NOT keep previous DOB.
       */
      kycProfile.dateOfBirth =
        null;
    }

    /**
     * -------------------------------------
     * OCR COMPLETED
     * -------------------------------------
     */
    kycProfile.ocrStatus =
      "COMPLETED";

    await kycProfile.save();

    /**
     * -------------------------------------
     * DEBUG LOG
     * -------------------------------------
     */
    console.log(
      "✅ PAN OCR completed successfully"
    );

    console.log(
      "🔎 Final PAN:",
      kycProfile.panNumber
    );

    console.log(
      "🔎 Final Name:",
      kycProfile.panName
    );

    console.log(
      "🔎 Final DOB:",
      kycProfile.dateOfBirth
    );

    return kycProfile;
  } catch (error) {
    /**
     * -------------------------------------
     * OCR FAILED
     * -------------------------------------
     */
    console.error(
      "❌ PAN OCR failed:",
      error
    );

    /**
     * Mark OCR failed.
     */
    kycProfile.ocrStatus =
      "FAILED";

    /**
     * Clear any OCR-derived values.
     */
    kycProfile.panNumber =
      "";

    kycProfile.panName =
      "";

    kycProfile.dateOfBirth =
      null;

    kycProfile.ocrData = {
      panNumber: "",
      name: "",
      dateOfBirth: "",
      confidence: 0,
    };

    await kycProfile.save();

    throw new ApiError(
      500,
      "PAN document uploaded, but data extraction failed"
    );
  }
};