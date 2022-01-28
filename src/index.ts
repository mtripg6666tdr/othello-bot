require("dotenv").config();
import { OthelloBot } from "./bot"

const othelloBot = new OthelloBot();
othelloBot.Run(process.env.TOKEN);