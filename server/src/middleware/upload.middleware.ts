import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// ============================================================
// PAN / KYC DOCUMENT UPLOAD
// ============================================================

const uploadDirectory = path.join(
  process.cwd(),
  "private",
  "kyc"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const panStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const randomName = crypto
      .randomBytes(16)
      .toString("hex");

    cb(
      null,
      `${randomName}${extension.toLowerCase()}`
    );
  },
});

const panAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const panFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  if (!panAllowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPG, PNG and PDF files are allowed"
      )
    );
  }

  cb(null, true);
};

const uploadPanDocument = multer({
  storage: panStorage,
  fileFilter: panFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ============================================================
// SELFIE UPLOAD
// ============================================================

const selfieDirectory = path.join(
  process.cwd(),
  "private",
  "selfie"
);

if (!fs.existsSync(selfieDirectory)) {
  fs.mkdirSync(selfieDirectory, {
    recursive: true,
  });
}

const selfieStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, selfieDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const randomName = crypto
      .randomBytes(16)
      .toString("hex");

    cb(
      null,
      `${randomName}${extension.toLowerCase()}`
    );
  },
});

const selfieAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const selfieFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  if (!selfieAllowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPG, PNG and WEBP selfie images are allowed"
      )
    );
  }

  cb(null, true);
};

const uploadSelfie = multer({
  storage: selfieStorage,
  fileFilter: selfieFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ============================================================
// EXPORTS
// ============================================================

export { uploadSelfie };

export default uploadPanDocument;