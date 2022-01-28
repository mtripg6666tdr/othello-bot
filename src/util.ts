import type { CellNums, Game } from "othello.js";
import * as discord from "discord.js";

export const blackCell = "<:othello_black:841292211046973451>";
export const whiteCell = "<:othello_white:841292400743546912>";
export const emptyCell = "<:green:841292069137022986>";

export const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

export async function ignoreUnhandledReject<T>(fn:Promise<T>):Promise<T> {
  try {
    return await fn;
  }
  catch(e){
    console.error(e);
    return null;
  }
}

export function renderGameBoard(game:Game){
  let board = emptyCell;
  for(let x = 0; x < 8; x++){
    board += numberEmojis[x];
  }
  board += "\r\n";
  for(let y = 0 as CellNums; y < 8; y++){
    board += numberEmojis[y];
    const row = game.board.getRow(y);
    for(let x = 0; x < 8; x++){
      const cell = row[x];
      switch(cell.type){
        case "black":
          board += blackCell;
          break;
        case "white":
          board += whiteCell;
          break;
        case "none":
          board += emptyCell;
          break;
      }
    }
    if(y !== 7) board += "\r\n";
  }
  return board;
}

export function renderDescription(game:Game, first:string, second:string){
  const fm = whiteCell + " 先手 " + `<@${first}>`;
  const sm = blackCell + " 後手 " + `<@${second}>`;
  const lastTurn = game.board.putLog[game.board.putLog.length - 1];
  let turnStr = "";
  if(!lastTurn) {
    turnStr = "-";
  } else if (lastTurn.type === "pass"){
    turnStr = "パス" + (lastTurn.current === "white" ? "白" : "黒");
  }else{
    turnStr = `${lastTurn.x},${lastTurn.y}${lastTurn.current === "white" ? "白" : "黒"}`;
  }
  return (
    fm + sm + 
    "次の手: " + (game.board.nextStone === "white" ? fm : sm) + "\r\n" +
    "前の手: " + turnStr + "\r\n\r\n" +
    renderGameBoard(game)
  )
}

export function renderFooter(game:Game, member:discord.GuildMember):discord.EmbedFooterData{
  return {
    iconURL: member.avatarURL(),
    text: `${game.board.putLog.length}手/白:${game.white.count}/黒:${game.black.count}`
  }
}

export function createComponents(x:number = -1, y:number = -1){
  return [
    new discord.MessageActionRow()
    .addComponents(
      new discord.MessageSelectMenu()
      .setCustomId("x_c")
      .setMaxValues(1)
      .setMinValues(1)
      .setPlaceholder("横方向の座標を入力")
      .addOptions([0,1,2,3,4,5,6,7].map(n => ({
        emoji: numberEmojis[n],
        label: n.toString(),
        value: n.toString(),
        default: n === x
      })))
    )
    ,
    new discord.MessageActionRow()
    .addComponents(
      new discord.MessageSelectMenu()
      .setCustomId("y_c")
      .setMaxValues(1)
      .setMinValues(1)
      .setPlaceholder("縦方向の座標を入力")
      .addOptions([0,1,2,3,4,5,6,7].map(n => ({
        emoji: numberEmojis[n],
        label: n.toString(),
        value: n.toString(),
        default: n === y
      })))
    )
    ,
    new discord.MessageActionRow()
    .addComponents([
      new discord.MessageButton()
      .setCustomId("done")
      .setEmoji("🆗")
      .setLabel("打つ")
      .setStyle("PRIMARY")
      ,
      new discord.MessageButton()
      .setCustomId("pass")
      .setEmoji("⏩")
      .setLabel("パス")
      .setStyle("SECONDARY")
    ])
  ];
}