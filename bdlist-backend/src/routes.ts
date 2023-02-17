import { Express, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { addPrefix } from "./utils/apiRoute";
import { Users, GameSessions, Passwords } from "./db/collections";
import { GameSession, User } from "./db/interfaces";
import { validateNewGameSessionDate } from "./utils/validateRequest";
import * as argon2 from "argon2";

export default function (app: Express) {
  // healthcheck for API service
  app.get(addPrefix("healthcheck"), (req: Request, res: Response) =>
    res.sendStatus(200)
  );

  app.post(addPrefix("login"), async (req: Request, res: Response) => {
    const candidatePw = req.body.password;

    const result = await Passwords.findOne({ name: "checkpoint" });

    if (!argon2.verify(result!.password, candidatePw))
      return res.status(401).json({ error: "Invalid password." });

    res.sendStatus(200);
  });

  // Get game sessions based on date range
  app.get(addPrefix("game-session"), async (req: Request, res: Response) => {
    const fromDate: Date = req.query.fromDate
      ? new Date(req.query.fromDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const toDate: Date = req.query.toDate
      ? new Date(req.query.toDate as string)
      : new Date(); // current date

    const gameSessions = await GameSessions.find({
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).toArray();

    res.status(200).json(gameSessions);
  });

  // Create new game session
  app.post(
    addPrefix("game-session"),
    validateNewGameSessionDate,
    async (req: Request, res: Response) => {
      const sessionDate = new Date(req.body.date as string);

      const document: GameSession = {
        date: sessionDate,
        players: [],
        cost: req.body.cost as number,
        group: req.body.group,
        createdAt: new Date(),
        payTo: req.body.payToUser,
      };

      const result = await GameSessions.insertOne(document);
      res.status(200).json({ ack: result.acknowledged, document });
    }
  );

  // Add user to game session
  app.patch(
    addPrefix("session-add-user"),
    async (req: Request, res: Response) => {
      const result = await GameSessions.updateOne(
        { _id: new ObjectId(req.body.sessionId) },
        {
          $push: {
            players: {
              userEmail: req.body.userEmail,
              paid: false,
              paidAt: undefined,
            },
          },
        }
      );

      res.status(200).json({ result });
    }
  );

  // Remove user from game session
  app.patch(
    addPrefix("session-remove-user"),
    async (req: Request, res: Response) => {
      const result = await GameSessions.updateOne(
        {
          _id: new ObjectId(req.body.sessionId),
          "players.userEmail": req.body.userEmail,
        },
        {
          $pull: {
            players: {
              userEmail: req.body.userEmail,
            },
          },
        }
      );

      res.status(200).json({ result });
    }
  );

  // Update payment status of user TODO ADD FILE UPLOAD
  app.post(
    addPrefix("payment-user-session"),
    async (req: Request, res: Response) => {
      const result = await GameSessions.updateOne(
        {
          _id: new ObjectId(req.body.sessionId),
          "players.userEmail": req.body.playerEmail,
          "players.paidAt": { $eq: null },
        },
        { $set: { "players.$.paid": true, "players.$.paidAt": new Date() } }
      );

      res.status(200).json({ result });
    }
  );

  // Create new user
  app.post(addPrefix("user"), async (req: Request, res: Response) => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const nickname = req.body.nickname;

    const document: User = {
      email,
      firstName,
      lastName,
      nickname,
      createdAt: new Date(),
      userType: "player",
    };

    const result = await Users.insertOne(document);
    res.status(200).json({ result, document });
  });
}
