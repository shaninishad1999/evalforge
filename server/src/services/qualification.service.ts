import mongoose from "mongoose";

import Qualification from "../models/Qualification.js";
import QualificationAttempt from "../models/QualificationAttempt.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import Project from "../models/Project.js";

import ApiError from "../utils/ApiError.js";

import {
  CreateQualificationInput,
  UpdateQualificationInput,
} from "../validations/qualification.validation.js";

// ============================================================
// HELPERS
// ============================================================

const validateObjectId = (
  value: string,
  fieldName: string
) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// ROLE HELPERS
// ============================================================

const canManageQualification = (
  userId: string,
  userRole: string,
  createdBy: mongoose.Types.ObjectId
) => {
  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return true;
  }

  if (
    (
      userRole === "CLIENT" ||
      userRole === "PROJECT_MANAGER"
    ) &&
    createdBy.toString() === userId
  ) {
    return true;
  }

  return false;
};

// ============================================================
// NORMALIZE ANSWER
// ============================================================

const normalizeAnswer = (
  answer: string | string[]
): string[] => {
  const values = Array.isArray(answer)
    ? answer
    : [answer];

  return values
    .map((value) =>
      value
        .trim()
        .toLowerCase()
    )
    .filter(Boolean)
    .sort();
};

// ============================================================
// EXACT ANSWER MATCH
// ============================================================

const isExactAnswerMatch = (
  userAnswer: string | string[],
  correctAnswer: string | string[]
): boolean => {
  const userValues =
    normalizeAnswer(userAnswer);

  const correctValues =
    normalizeAnswer(correctAnswer);

  if (
    userValues.length !==
    correctValues.length
  ) {
    return false;
  }

  return userValues.every(
    (value, index) =>
      value === correctValues[index]
  );
};

// ============================================================
// TEXT ANSWER MATCH
//
// Current implementation:
//
// 1. Exact normalized match
// 2. Keyword coverage
//
// Future AI semantic evaluation can be plugged in here.
// ============================================================

// ============================================================
// TEXT ANSWER MATCH
// ============================================================
//
// Current implementation:
//
// 1. Exact normalized match
// 2. Keyword coverage
// 3. Basic token-based semantic similarity
//
// Future AI semantic evaluation can be plugged in here.
//
// Returns a score ratio between 0 and 1.
// ============================================================

const evaluateTextAnswer = (
  userAnswer: string,
  referenceAnswer: string | null,
  keywords: string[]
): number => {
  const normalizeText = (
    text: string
  ): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getTokens = (
    text: string
  ): string[] => {
    return normalizeText(text)
      .split(" ")
      .filter(
        (word) =>
          word.length > 2
      );
  };

  const normalizedUser =
    normalizeText(userAnswer);

  if (!normalizedUser) {
    return 0;
  }

  /*
   * ========================================================
   * EXACT MATCH
   * ========================================================
   */

  if (
    referenceAnswer &&
    normalizedUser ===
      normalizeText(referenceAnswer)
  ) {
    return 1;
  }

  /*
   * ========================================================
   * REFERENCE ANSWER TOKEN MATCH
   * ========================================================
   */

  let referenceScore = 0;

  if (referenceAnswer) {
    const userTokens =
      new Set(
        getTokens(userAnswer)
      );

    const referenceTokens =
      getTokens(referenceAnswer);

    if (
      referenceTokens.length > 0
    ) {
      const matchedTokens =
        referenceTokens.filter(
          (token) =>
            userTokens.has(token)
        );

      referenceScore =
        matchedTokens.length /
        referenceTokens.length;
    }
  }

  /*
   * ========================================================
   * KEYWORD MATCH
   * ========================================================
   */

  let keywordScore = 0;

  const validKeywords =
    keywords
      .map((keyword) =>
        normalizeText(keyword)
      )
      .filter(Boolean);

  if (
    validKeywords.length > 0
  ) {
    const matchedKeywords =
      validKeywords.filter(
        (keyword) =>
          normalizedUser.includes(
            keyword
          )
      );

    keywordScore =
      matchedKeywords.length /
      validKeywords.length;
  }

  /*
   * ========================================================
   * COMBINED SCORE
   * ========================================================
   *
   * Reference answer gets higher weight because it represents
   * the expected explanation.
   *
   * Keywords provide additional evidence.
   */

  let finalScore = 0;

  if (
    referenceAnswer &&
    validKeywords.length > 0
  ) {
    finalScore =
      referenceScore * 0.7 +
      keywordScore * 0.3;
  } else if (
    referenceAnswer
  ) {
    finalScore =
      referenceScore;
  } else {
    finalScore =
      keywordScore;
  }

  /*
   * ========================================================
   * SCORE NORMALIZATION
   * ========================================================
   */

  finalScore =
    Math.max(
      0,
      Math.min(
        1,
        finalScore
      )
    );

  return Math.round(
    finalScore * 100
  ) / 100;
};
// ============================================================
// CREATE QUALIFICATION
// ============================================================

export const createQualification =
  async (
    userId: string,
    userRole: string,
    data: CreateQualificationInput
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    if (
      ![
        "SUPER_ADMIN",
        "ADMIN",
        "CLIENT",
        "PROJECT_MANAGER",
      ].includes(userRole)
    ) {
      throw new ApiError(
        403,
        "You are not allowed to create qualifications"
      );
    }

    // ========================================================
    // PROJECT VALIDATION
    // ========================================================

    if (data.project) {
      validateObjectId(
        data.project,
        "project ID"
      );

      const project =
        await Project.findById(
          data.project
        );

      if (!project) {
        throw new ApiError(
          404,
          "Project not found"
        );
      }

      if (
        userRole === "CLIENT" &&
        project.client.toString() !==
          userId
      ) {
        throw new ApiError(
          403,
          "You are not allowed to create a qualification for this project"
        );
      }

      if (
        userRole ===
          "PROJECT_MANAGER" &&
        (
          !project.projectManager ||
          project.projectManager.toString() !==
            userId
        )
      ) {
        throw new ApiError(
          403,
          "You are not allowed to manage this project"
        );
      }
    }

    // ========================================================
    // VALIDATE QUESTION COUNT
    // ========================================================

    if (
      data.questions.length > 0 &&
      data.assessment.questionCount >
        data.questions.length
    ) {
      data.assessment.questionCount =
        data.questions.length;
    }

    // ========================================================
    // VALIDATE QUESTION TYPES
    // ========================================================

    for (const question of data.questions) {
      if (
        (
          question.type ===
            "SINGLE_CHOICE" ||
          question.type ===
            "MULTIPLE_CHOICE"
        ) &&
        question.options.length === 0
      ) {
        throw new ApiError(
          400,
          `Options are required for ${question.type} question`
        );
      }

      if (
        question.type ===
        "TRUE_FALSE"
      ) {
        if (
          question.options.length ===
          0
        ) {
          question.options = [
            {
              label: "A",
              text: "True",
            },
            {
              label: "B",
              text: "False",
            },
          ];
        }
      }

      if (
        question.type ===
          "TEXT_ANSWER" &&
        !question.referenceAnswer &&
        question.keywords.length === 0
      ) {
        throw new ApiError(
          400,
          "Text answer question requires a reference answer or keywords"
        );
      }
    }

    const qualification =
      await Qualification.create({
        ...data,
        createdBy: userId,
      });

    return qualification;
  };

  
// ============================================================
// GET QUALIFICATION BY ID
// ============================================================
export const getQualificationById =
  async (
    qualificationId: string,
    userId?: string,
    userRole?: string
  ) => {
    validateObjectId(
      qualificationId,
      "qualification ID"
    );

    const qualification =
      await Qualification.findById(
        qualificationId
      )
        .populate(
          "project",
          "title status client projectManager"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    if (!qualification) {
      throw new ApiError(
        404,
        "Qualification not found"
      );
    }

    /*
     * Contributor access
     *
     * Contributors can only access
     * qualifications that are currently ACTIVE.
     */
    if (
      userRole === "CONTRIBUTOR"
    ) {
      if (
        qualification.status !==
        "ACTIVE"
      ) {
        throw new ApiError(
          403,
          "This qualification is not currently available"
        );
      }

      /*
       * Security:
       *
       * Contributors must never receive
       * correct answers, reference answers,
       * or evaluation keywords.
       *
       * These values are required by the server
       * for automatic evaluation after submission.
       */
      const qualificationData =
        qualification.toObject();

      qualificationData.questions =
        qualificationData.questions.map(
          (question: any) => {
            const {
              correctAnswer,
              referenceAnswer,
              keywords,
              ...safeQuestion
            } = question;

            return safeQuestion;
          }
        );

      return qualificationData;
    }

    /*
     * Public access without authentication
     * is not allowed for management operations.
     */
    if (!userId || !userRole) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    /*
     * Super Admin and Admin
     * can access all qualifications.
     */
    if (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    ) {
      return qualification;
    }

    /*
     * Project-based authorization.
     *
     * Client:
     * Can access qualifications belonging
     * to their own project.
     *
     * Project Manager:
     * Can access qualifications belonging
     * to the project they manage.
     */
    const project =
      qualification.project as unknown as {
        _id: mongoose.Types.ObjectId;
        client?: mongoose.Types.ObjectId;
        projectManager?: mongoose.Types.ObjectId;
      } | null;

    if (!project) {
      throw new ApiError(
        403,
        "Qualification project is not available"
      );
    }

    if (
      userRole === "CLIENT"
    ) {
      const projectClientId =
        project.client?.toString();

      if (
        projectClientId === userId
      ) {
        return qualification;
      }
    }

    if (
      userRole === "PROJECT_MANAGER"
    ) {
      const projectManagerId =
        project.projectManager?.toString();

      if (
        projectManagerId === userId
      ) {
        return qualification;
      }
    }

    /*
     * Fallback:
     * Qualification creator can access
     * their own qualification.
     */
    const createdById =
      qualification.createdBy
        ? (
            qualification.createdBy as unknown as {
              _id: mongoose.Types.ObjectId;
            }
          )._id?.toString()
        : null;

    if (
      createdById === userId
    ) {
      return qualification;
    }

    throw new ApiError(
      403,
      "You are not allowed to access this qualification"
    );
  };
// ============================================================
// GET QUALIFICATIONS
// ============================================================

export const getQualifications =
  async (
    userId: string,
    userRole: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    if (
      userRole === "CONTRIBUTOR"
    ) {
      return Qualification.find({
        status: "ACTIVE",
      })
        .populate(
          "project",
          "title description status rewardConfiguration qualification"
        )
        .sort({
          createdAt: -1,
        });
    }

    if (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    ) {
      return Qualification.find()
        .populate(
          "project",
          "title status"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });
    }

    return Qualification.find({
      createdBy: userId,
    })
      .populate(
        "project",
        "title status"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// UPDATE QUALIFICATION
// ============================================================

export const updateQualification =
  async (
    qualificationId: string,
    userId: string,
    userRole: string,
    data: UpdateQualificationInput
  ) => {
    validateObjectId(
      qualificationId,
      "qualification ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const qualification =
      await Qualification.findById(
        qualificationId
      );

    if (!qualification) {
      throw new ApiError(
        404,
        "Qualification not found"
      );
    }

    if (
      !canManageQualification(
        userId,
        userRole,
        qualification.createdBy
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update this qualification"
      );
    }

    if (
      qualification.status ===
      "ARCHIVED"
    ) {
      throw new ApiError(
        400,
        "Archived qualifications cannot be updated"
      );
    }

    if (
      qualification.status ===
      "ACTIVE"
    ) {
      throw new ApiError(
        400,
        "Active qualifications cannot be edited"
      );
    }

    if (data.title !== undefined) {
      qualification.title =
        data.title;
    }

    if (
      data.description !==
      undefined
    ) {
      qualification.description =
        data.description;
    }

    if (
      data.instructions !==
      undefined
    ) {
      qualification.instructions =
        data.instructions;
    }

    if (
      data.project !== undefined
    ) {
      if (data.project) {
        validateObjectId(
          data.project,
          "project ID"
        );

        const project =
          await Project.findById(
            data.project
          );

        if (!project) {
          throw new ApiError(
            404,
            "Project not found"
          );
        }
      }

      qualification.project =
        data.project
          ? new mongoose.Types.ObjectId(
              data.project
            )
          : null;
    }

    if (
      data.learningMaterial
    ) {
      qualification.learningMaterial =
        {
          ...qualification.learningMaterial,
          ...data.learningMaterial,
          sections:
            data.learningMaterial
              .sections ??
            qualification
              .learningMaterial
              .sections,
        };
    }

    if (
      data.eligibility
    ) {
      qualification.eligibility =
        {
          ...qualification.eligibility,
          ...data.eligibility,
          skills:
            data.eligibility.skills ??
            qualification.eligibility
              .skills,
          languages:
            data.eligibility
              .languages ??
            qualification.eligibility
              .languages,
          countries:
            data.eligibility
              .countries ??
            qualification.eligibility
              .countries,
          requirements:
            data.eligibility
              .requirements ??
            qualification.eligibility
              .requirements,
        };
    }

    if (
      data.assessment
    ) {
      qualification.assessment =
        {
          ...qualification.assessment,
          ...data.assessment,
        };
    }

    if (
      data.scoring
    ) {
      qualification.scoring =
        {
          ...qualification.scoring,
          ...data.scoring,
          humanReviewRequired:
            false,
        };
    }

    if (
      data.questions !==
      undefined
    ) {
      qualification.questions =
        data.questions;
    }

    if (
      data.status !== undefined
    ) {
      qualification.status =
        data.status;
    }

    await qualification.save();

    return qualification;
  };

// ============================================================
// CHANGE STATUS
// ============================================================

export const changeQualificationStatus =
  async (
    qualificationId: string,
    userId: string,
    userRole: string,
    newStatus:
      | "DRAFT"
      | "PUBLISHED"
      | "ACTIVE"
      | "PAUSED"
      | "ARCHIVED"
  ) => {
    validateObjectId(
      qualificationId,
      "qualification ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const qualification =
      await Qualification.findById(
        qualificationId
      );

    if (!qualification) {
      throw new ApiError(
        404,
        "Qualification not found"
      );
    }

    if (
      !canManageQualification(
        userId,
        userRole,
        qualification.createdBy
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to change this qualification status"
      );
    }

    const currentStatus =
      qualification.status;

    // ========================================================
    // SAME STATUS
    // ========================================================

    if (
      currentStatus === newStatus
    ) {
      return qualification;
    }

    // ========================================================
    // ARCHIVED
    // ========================================================

    if (
      currentStatus ===
      "ARCHIVED"
    ) {
      throw new ApiError(
        400,
        "Archived qualifications cannot be changed"
      );
    }

    // ========================================================
    // PUBLISH
    // ========================================================

    if (
      newStatus ===
      "PUBLISHED"
    ) {
      if (
        currentStatus !==
        "DRAFT"
      ) {
        throw new ApiError(
          400,
          "Only draft qualifications can be published"
        );
      }

      if (
        qualification.questions.length ===
        0
      ) {
        throw new ApiError(
          400,
          "Qualification must contain at least one question"
        );
      }

      qualification.status =
        "PUBLISHED";

      qualification.publishedAt =
        new Date();
    }

    // ========================================================
    // ACTIVATE
    // ========================================================

    else if (
      newStatus === "ACTIVE"
    ) {
      if (
        currentStatus !==
          "PUBLISHED" &&
        currentStatus !==
          "PAUSED"
      ) {
        throw new ApiError(
          400,
          "Only published or paused qualifications can be activated"
        );
      }

      qualification.status =
        "ACTIVE";

      qualification.activatedAt =
        new Date();
    }

    // ========================================================
    // PAUSE
    // ========================================================

    else if (
      newStatus === "PAUSED"
    ) {
      if (
        currentStatus !==
        "ACTIVE"
      ) {
        throw new ApiError(
          400,
          "Only active qualifications can be paused"
        );
      }

      qualification.status =
        "PAUSED";

      qualification.pausedAt =
        new Date();
    }

    // ========================================================
    // ARCHIVE
    // ========================================================

    else if (
      newStatus ===
      "ARCHIVED"
    ) {
      if (
        currentStatus ===
        "ACTIVE"
      ) {
        throw new ApiError(
          400,
          "Active qualifications must be paused before archiving"
        );
      }

      qualification.status =
        "ARCHIVED";

      qualification.archivedAt =
        new Date();
    }

    // ========================================================
    // DRAFT
    // ========================================================

    else if (
      newStatus === "DRAFT"
    ) {
      if (
        currentStatus !==
        "PUBLISHED"
      ) {
        throw new ApiError(
          400,
          "Only published qualifications can return to draft"
        );
      }

      qualification.status =
        "DRAFT";
    }

    await qualification.save();

    return qualification;
  };

// ============================================================
// START QUALIFICATION ATTEMPT
// ============================================================

export const startQualificationAttempt =
  async (
    qualificationId: string,
    userId: string,
    projectId?: string | null
  ) => {
    validateObjectId(
      qualificationId,
      "qualification ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const qualification =
      await Qualification.findById(
        qualificationId
      );

    if (!qualification) {
      throw new ApiError(
        404,
        "Qualification not found"
      );
    }

    if (
      qualification.status !==
      "ACTIVE"
    ) {
      throw new ApiError(
        400,
        "This qualification is not active"
      );
    }

    // ========================================================
    // CHECK EXISTING ACTIVE ATTEMPT
    // ========================================================

    const existingAttempt =
      await QualificationAttempt.findOne(
        {
          user: userId,
          qualification:
            qualificationId,
          status: {
            $in: [
              "IN_PROGRESS",
              "PAUSED",
            ],
          },
        }
      );

    if (existingAttempt) {
      return existingAttempt;
    }

    // ========================================================
    // COUNT PREVIOUS ATTEMPTS
    // ========================================================

    const previousAttempts =
      await QualificationAttempt.countDocuments(
        {
          user: userId,
          qualification:
            qualificationId,
        }
      );

    if (
      previousAttempts >=
      qualification.assessment.maxAttempts
    ) {
      throw new ApiError(
        400,
        "Maximum qualification attempts reached"
      );
    }

    // ========================================================
    // PROJECT
    // ========================================================

    let project:
      | mongoose.Types.ObjectId
      | null =
      qualification.project;

    if (projectId) {
      validateObjectId(
        projectId,
        "project ID"
      );

      project =
        new mongoose.Types.ObjectId(
          projectId
        );
    }

    // ========================================================
    // SELECT QUESTIONS
    // ========================================================

    const activeQuestions =
      qualification.questions.filter(
        (question) =>
          question.isActive
      );

    if (
      activeQuestions.length ===
      0
    ) {
      throw new ApiError(
        400,
        "No active questions are available"
      );
    }

    let selectedQuestions = [
      ...activeQuestions,
    ];

    if (
      qualification.assessment
        .randomizeQuestions
    ) {
      selectedQuestions.sort(
        () => Math.random() - 0.5
      );
    }

    selectedQuestions =
      selectedQuestions.slice(
        0,
        Math.min(
          qualification.assessment
            .questionCount,
          selectedQuestions.length
        )
      );

    // ========================================================
    // ENSURE QUESTIONS HAVE IDS
    // ========================================================

    const questionsWithIds =
      selectedQuestions.filter(
        (
          question
        ): question is typeof question & {
          _id: mongoose.Types.ObjectId;
        } => Boolean(question._id)
      );

    if (
      questionsWithIds.length !==
      selectedQuestions.length
    ) {
      throw new ApiError(
        500,
        "Qualification contains an invalid question without an ID"
      );
    }

    // ========================================================
    // CREATE ANSWER RECORDS
    // ========================================================

    const answers =
      questionsWithIds.map(
        (question) => ({
          questionId:
            question._id,
          answer: null,
          attemptsUsed: 0,
          attemptsAllowed:
            question.attemptsAllowed,
          status:
            "UNANSWERED" as const,
          pointsAwarded: 0,
          maxPoints:
            question.points,
          answeredAt: null,
          lastAttemptAt: null,
        })
      );

    const totalPoints =
      questionsWithIds.reduce(
        (total, question) =>
          total + question.points,
        0
      );

    const attempt =
      await QualificationAttempt.create(
        {
          user: userId,
          qualification:
            qualificationId,
          project,
          attemptNumber:
            previousAttempts + 1,
          status:
            "IN_PROGRESS",
          questionIds:
            questionsWithIds.map(
              (question) =>
                question._id
            ),
          answers,
          totalQuestions:
            questionsWithIds.length,
          answeredQuestions: 0,
          correctQuestions: 0,
          incorrectQuestions: 0,
          totalPoints,
          obtainedPoints: 0,
          percentage: 0,
          passingScore:
            qualification.scoring
              .passingScore,
          result: "PENDING",
          totalActiveTimeSeconds: 0,
          pauseCount: 0,
          startedAt:
            new Date(),
          lastResumedAt:
            new Date(),
          lastPausedAt: null,
          submittedAt: null,
          projectAssigned: false,
          projectAssignedAt: null,
          projectAssignmentId:
            null,
        }
      );

    return attempt;
  };

// ============================================================
// RESUME ATTEMPT
// ============================================================

export const resumeQualificationAttempt =
  async (
    attemptId: string,
    userId: string
  ) => {
    validateObjectId(
      attemptId,
      "attempt ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const attempt =
      await QualificationAttempt.findOne(
        {
          _id: attemptId,
          user: userId,
        }
      );

    if (!attempt) {
      throw new ApiError(
        404,
        "Qualification attempt not found"
      );
    }

    if (
      attempt.status !==
      "PAUSED"
    ) {
      throw new ApiError(
        400,
        "Only paused attempts can be resumed"
      );
    }

    attempt.status =
      "IN_PROGRESS";

    attempt.lastResumedAt =
      new Date();

    await attempt.save();

    return attempt;
  };

// ============================================================
// PAUSE ATTEMPT
// ============================================================

export const pauseQualificationAttempt =
  async (
    attemptId: string,
    userId: string
  ) => {
    validateObjectId(
      attemptId,
      "attempt ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const attempt =
      await QualificationAttempt.findOne(
        {
          _id: attemptId,
          user: userId,
        }
      );

    if (!attempt) {
      throw new ApiError(
        404,
        "Qualification attempt not found"
      );
    }

    if (
      attempt.status !==
      "IN_PROGRESS"
    ) {
      throw new ApiError(
        400,
        "Only active attempts can be paused"
      );
    }

    const now =
      new Date();

    if (
      attempt.lastResumedAt
    ) {
      const activeSeconds =
        Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              attempt.lastResumedAt.getTime()
            ) / 1000
          )
        );

      attempt.totalActiveTimeSeconds +=
        activeSeconds;
    }

    attempt.status =
      "PAUSED";

    attempt.lastPausedAt =
      now;

    attempt.lastResumedAt =
      null;

    attempt.pauseCount += 1;

    await attempt.save();

    return attempt;
  };

// ============================================================
// SUBMIT QUESTION ANSWER
// ============================================================

export const submitQuestionAnswer =
  async (
    attemptId: string,
    userId: string,
    questionId: string,
    answer: string | string[]
  ) => {
    validateObjectId(
      attemptId,
      "attempt ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      questionId,
      "question ID"
    );

    const attempt =
      await QualificationAttempt.findOne(
        {
          _id: attemptId,
          user: userId,
        }
      );

    if (!attempt) {
      throw new ApiError(
        404,
        "Qualification attempt not found"
      );
    }

    if (
      attempt.status !==
      "IN_PROGRESS"
    ) {
      throw new ApiError(
        400,
        "Only active attempts can accept answers"
      );
    }

    const qualification =
      await Qualification.findById(
        attempt.qualification
      );

    if (!qualification) {
      throw new ApiError(
        404,
        "Qualification not found"
      );
    }

    const question =
      qualification.questions.find(
        (item) =>
          item._id?.toString() ===
          questionId
      );

    if (!question) {
      throw new ApiError(
        404,
        "Question not found"
      );
    }

    const answerRecord =
      attempt.answers.find(
        (item) =>
          item.questionId.toString() ===
          questionId
      );

    if (!answerRecord) {
      throw new ApiError(
        404,
        "Question is not part of this attempt"
      );
    }

    if (
      answerRecord.attemptsUsed >=
      answerRecord.attemptsAllowed
    ) {
      throw new ApiError(
        400,
        "Maximum attempts reached for this question"
      );
    }

    const now =
      new Date();

    answerRecord.attemptsUsed += 1;

    answerRecord.answer =
      answer;

    answerRecord.lastAttemptAt =
      now;

    answerRecord.answeredAt =
      now;

    answerRecord.status =
      "ANSWERED";

    let scoreRatio = 0;

    // ========================================================
    // OBJECTIVE QUESTIONS
    // ========================================================

    if (
      question.type ===
        "SINGLE_CHOICE" ||
      question.type ===
        "MULTIPLE_CHOICE" ||
      question.type ===
        "TRUE_FALSE"
    ) {
      const isCorrect =
        isExactAnswerMatch(
          answer,
          question.correctAnswer
        );

      if (isCorrect) {
        answerRecord.status =
          "CORRECT";

        answerRecord.pointsAwarded =
          question.points;

        scoreRatio = 1;
      } else {
        answerRecord.status =
          "INCORRECT";

        answerRecord.pointsAwarded =
          0;

        scoreRatio = 0;
      }
    }

    // ========================================================
    // TEXT ANSWER
    // ========================================================

    else if (
      question.type ===
      "TEXT_ANSWER"
    ) {
      const textAnswer =
        Array.isArray(answer)
          ? answer.join(" ")
          : answer;

      scoreRatio =
        evaluateTextAnswer(
          textAnswer,
          question.referenceAnswer ??
            null,
          question.keywords
        );

      answerRecord.pointsAwarded =
        Math.round(
          question.points *
            scoreRatio *
            100
        ) / 100;

      if (scoreRatio >= 0.8) {
        answerRecord.status =
          "CORRECT";
      } else {
        answerRecord.status =
          "INCORRECT";
      }
    }

    // ========================================================
    // RECALCULATE CURRENT SCORE
    // ========================================================

    attempt.answeredQuestions =
      attempt.answers.filter(
        (item) =>
          item.attemptsUsed > 0
      ).length;

    attempt.correctQuestions =
      attempt.answers.filter(
        (item) =>
          item.status ===
          "CORRECT"
      ).length;

    attempt.incorrectQuestions =
      attempt.answers.filter(
        (item) =>
          item.status ===
          "INCORRECT"
      ).length;

    attempt.obtainedPoints =
      attempt.answers.reduce(
        (total, item) =>
          total +
          item.pointsAwarded,
        0
      );

    attempt.percentage =
      attempt.totalPoints > 0
        ? Math.round(
            (
              attempt.obtainedPoints /
              attempt.totalPoints
            ) *
              10000
          ) / 100
        : 0;

    await attempt.save();

    return {
      attempt,
      question: {
        questionId:
          question._id ?? null,
        status:
          answerRecord.status,
        attemptsUsed:
          answerRecord.attemptsUsed,
        attemptsAllowed:
          answerRecord.attemptsAllowed,
        pointsAwarded:
          answerRecord.pointsAwarded,
        maxPoints:
          answerRecord.maxPoints,
      },
    };
  };

// ============================================================
// SUBMIT COMPLETE ASSESSMENT
// ============================================================

export const submitQualificationAttempt =
  async (
    attemptId: string,
    userId: string
  ) => {
    validateObjectId(
      attemptId,
      "attempt ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const attempt =
      await QualificationAttempt.findOne(
        {
          _id: attemptId,
          user: userId,
        }
      );

    if (!attempt) {
      throw new ApiError(
        404,
        "Qualification attempt not found"
      );
    }

    if (
      ![
        "IN_PROGRESS",
        "PAUSED",
      ].includes(attempt.status)
    ) {
      throw new ApiError(
        400,
        "This assessment cannot be submitted"
      );
    }

    const now =
      new Date();

    // ========================================================
    // ADD FINAL ACTIVE SESSION TIME
    // ========================================================

    if (
      attempt.status ===
        "IN_PROGRESS" &&
      attempt.lastResumedAt
    ) {
      const activeSeconds =
        Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              attempt.lastResumedAt.getTime()
            ) / 1000
          )
        );

      attempt.totalActiveTimeSeconds +=
        activeSeconds;
    }

    // ========================================================
    // FINAL SCORE
    // ========================================================

    attempt.answeredQuestions =
      attempt.answers.filter(
        (item) =>
          item.attemptsUsed > 0
      ).length;

    attempt.correctQuestions =
      attempt.answers.filter(
        (item) =>
          item.status ===
          "CORRECT"
      ).length;

    attempt.incorrectQuestions =
      attempt.answers.filter(
        (item) =>
          item.status ===
          "INCORRECT"
      ).length;

    attempt.obtainedPoints =
      attempt.answers.reduce(
        (total, item) =>
          total +
          item.pointsAwarded,
        0
      );

    attempt.percentage =
      attempt.totalPoints > 0
        ? Math.round(
            (
              attempt.obtainedPoints /
              attempt.totalPoints
            ) *
              10000
          ) / 100
        : 0;

    attempt.submittedAt =
      now;

    attempt.lastResumedAt =
      null;

    attempt.status =
      "SUBMITTED";

    // ========================================================
    // PASS / FAIL
    // ========================================================

    if (
      attempt.percentage >=
      attempt.passingScore
    ) {
      attempt.result =
        "PASS";

      attempt.status =
        "PASSED";
    } else {
      attempt.result =
        "FAIL";

      attempt.status =
        "FAILED";
    }

    await attempt.save();

    // ========================================================
    // AUTO PROJECT ASSIGNMENT
    // ========================================================

    if (
      attempt.result === "PASS" &&
      attempt.project
    ) {
      const existingAssignment =
        await ProjectAssignment.findOne(
          {
            project:
              attempt.project,
            contributor:
              attempt.user,
          }
        );

      if (!existingAssignment) {
        const assignment =
          await ProjectAssignment.create(
            {
              project:
                attempt.project,
              contributor:
                attempt.user,
              qualification:
                attempt.qualification,
              qualificationAttempt:
                attempt._id,
              assignedBy: null,
              assignedAt:
                now,
              startedAt: null,
              completedAt: null,
              removedAt: null,
              status: "ACTIVE",
            }
          );

        attempt.projectAssigned =
          true;

        attempt.projectAssignedAt =
          now;

        attempt.projectAssignmentId =
          assignment._id;

        await attempt.save();
      } else {
        attempt.projectAssigned =
          true;

        attempt.projectAssignedAt =
          existingAssignment.assignedAt;

        attempt.projectAssignmentId =
          existingAssignment._id;

        await attempt.save();
      }
    }

    return attempt;
  };

// ============================================================
// GET ATTEMPT
// ============================================================
// ============================================================
// GET ATTEMPT
// ============================================================
export const getQualificationAttempt =
  async (
    attemptId: string,
    userId: string
  ) => {
    validateObjectId(
      attemptId,
      "attempt ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const attempt =
      await QualificationAttempt.findOne(
        {
          _id: attemptId,
          user: userId,
        }
      )
        .populate(
          "qualification",
          "title description instructions learningMaterial eligibility assessment scoring questions status"
        )
        .populate(
          "project",
          "title description status rewardConfiguration"
        )
        .populate(
          "projectAssignmentId"
        );

    if (!attempt) {
      throw new ApiError(
        404,
        "Qualification attempt not found"
      );
    }

    /*
     * ========================================================
     * SECURITY
     * ========================================================
     *
     * The qualification contains answer keys that are required
     * by the server for automatic evaluation.
     *
     * These fields must NEVER be returned to the contributor.
     *
     * Remove:
     * - correctAnswer
     * - referenceAnswer
     * - keywords
     */

    const attemptData =
      attempt.toObject();

    if (
      attemptData.qualification &&
      typeof attemptData.qualification ===
        "object"
    ) {
      const qualificationData =
        attemptData.qualification as any;

      qualificationData.questions =
        qualificationData.questions.map(
          (question: any) => {
            const {
              correctAnswer,
              referenceAnswer,
              keywords,
              ...safeQuestion
            } = question;

            return safeQuestion;
          }
        );

      attemptData.qualification =
        qualificationData;
    }

    return attemptData;
  };
// ============================================================
// GET MY ATTEMPTS
// ============================================================

export const getMyQualificationAttempts =
  async (
    userId: string,
    qualificationId?: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const query: Record<
      string,
      unknown
    > = {
      user: userId,
    };

    if (qualificationId) {
      validateObjectId(
        qualificationId,
        "qualification ID"
      );

      query.qualification =
        qualificationId;
    }

    return QualificationAttempt.find(
      query
    )
      .populate(
        "qualification",
        "title status scoring assessment"
      )
      .populate(
        "project",
        "title status rewardConfiguration"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// GET MY PROJECT ASSIGNMENTS
// ============================================================

export const getMyProjectAssignments =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    return ProjectAssignment.find(
      {
        contributor: userId,
      }
    )
      .populate(
        "project",
        "title description status rewardConfiguration requirements"
      )
      .populate(
        "qualification",
        "title scoring"
      )
      .sort({
        assignedAt: -1,
      });
  };