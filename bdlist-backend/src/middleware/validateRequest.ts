import { Request, Response, NextFunction } from "express";
import { processUploadedFiles } from "../utils/functions";
import { requiredBody, requiredQuery } from "./validation";
import { ApiError } from "../utils/error-util";
const MB = 5;
const FILE_SIZE_LIMIT = MB * 1024 * 1024;

export async function validateNewGameSessionDate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionDate = new Date(req.body.date);
    if (sessionDate < new Date())
      throw new ApiError(400, "Cannot create session in the past");

    next();
  } catch (error) {
    next(error);
  }
}

export async function adminCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.user.userType !== "admin")
      throw new ApiError(403, "You must be an admin to access this resource");

    next();
  } catch (error) {
    next(error);
  }
}

export function validateFileUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.files) throw new ApiError(401, "No image was uploaded");

    next();
  } catch (error) {
    next(error);
  }
}

export function fileSizeLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const file = processUploadedFiles(req.files!);

    if (file.size > FILE_SIZE_LIMIT)
      throw new ApiError(
        413,
        `Uploaded file is over the file size limit of ${MB} MB`
      );

    next();
  } catch (error) {
    next(error);
  }
}

export async function validateBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Return early if a GET method
    if (req.method === "GET") return next();

    // Get required req.body keys
    const required = Object.entries(requiredBody);

    const tmp = required.find((path) => path[0] === req.path);

    if (!tmp) return next(); // Return early if there are no targets
    const target = tmp[1];

    // Get supplied req.body keys
    const supplied = Object.keys(req.body);

    // Check if all target keys are in supplied keys
    const missing: string[] = getMissingKeys(target, supplied);

    // Return 400 with dynamic error message if there are missing keys
    if (missing.length > 0) {
      const missingKeys = formatError(missing);
      throw new ApiError(400, `Missing keys:${missingKeys}`);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function validateQuery(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Return early if not a GET method
    if (req.method !== "GET") return next();

    // Get required req.query keys
    const required = Object.entries(requiredQuery);

    const tmp = required.find((path) => path[0] === req.baseUrl);

    if (!tmp) return next(); // Return early if there are no targets
    const target = tmp[1];

    // Get supplied req.query keys
    const supplied = Object.keys(req.query);

    // Check if all target keys are in supplied keys
    const missing: string[] = getMissingKeys(target, supplied);

    // Return 400 with dynamic error message if there are missing keys
    if (missing.length > 0) {
      const missingKeys = formatError(missing);
      throw new ApiError(400, `Missing keys:${missingKeys}`);
    }

    next();
  } catch (error) {
    next(error);
  }
}

function formatError(missing: string[]) {
  let missingKeys = "";
  missing.forEach((word, index) => {
    if (index !== missing.length - 1) missingKeys = `${missingKeys} ${word},`;
    else missingKeys = `${missingKeys} ${word}`;
  });
  return missingKeys;
}

function getMissingKeys(target: string[], supplied: string[]) {
  const missing: string[] = [];
  target.forEach((reqKey) => {
    if (!supplied.includes(reqKey)) missing.push(reqKey);
  });
  return missing;
}
