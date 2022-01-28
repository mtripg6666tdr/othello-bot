import * as discord from "discord.js"
import { CellNums, Game } from "othello.js";
import { createComponents, ignoreUnhandledReject, numberEmojis, renderDescription, renderFooter } from "./util";

export class OthelloBot {
  private readonly client = null as discord.Client;
  private readonly games = {} as {[msgId:string]:{
    game:Game, 
    first:string, 
    second:string,
    nextData: {x:number, y:number},
    date: Date,
  }};

  constructor(){
    this.client = new discord.Client({
      intents: [
        discord.Intents.FLAGS.GUILDS,
        discord.Intents.FLAGS.GUILD_MESSAGES,
      ],
      allowedMentions: {
        repliedUser: false
      }
    });
    this.client
      .on("ready", () => {console.log("Dicord Bot is ready")})
      .on("messageCreate", (message) => ignoreUnhandledReject(this.onMessageCreate(message)))
      .on("interactionCreate", (interaction) => ignoreUnhandledReject(this.onInteractionCreate(interaction)))
    ;
  }
  
  private async onMessageCreate(message:discord.Message){
    if(message.content.startsWith("!")){
      const [command, ...args] = message.content.substring(1).split(" ");
      console.log(command, args);
      switch(command){
        case "othello": {
          const match = args[0]?.match(/<@!?(?<id>\d+)>/);
          if(match){
            const user = await this.client.users.fetch(match.groups.id).catch(() => null);
            if(!user){
              await message.reply("ユーザーが不正です");
              return;
            }
            const reply = await message.reply("準備中...");
            const game = new Game({});
            this.games[reply.id] = {
              game,
              first: message.author.id,
              second: user.id,
              nextData: {x:-1, y:-1},
              date: new Date(),
            };
            await reply.edit({
              content: null,
              embeds: [
                new discord.MessageEmbed()
                  .setTitle("オセロ対戦")
                  .setDescription(renderDescription(game, message.author.id, user.id))
                  .setFooter(renderFooter(game, message.member))
                  .setTimestamp(this.games[reply.id].date)
                  .setColor(0xe6f5e6)
              ],
              components: createComponents()
            });
          }else{
            await message.reply("対戦するユーザーを引数につけてください");
          }
        } break;
      }
    }
  }

  private async onInteractionCreate(interaction:discord.Interaction){
    if(interaction.isSelectMenu()){
      const data = this.games[interaction.message.id];
      if(!data || interaction.user.id !== data[data.game.board.nextStone === "white" ? "first" : "second"]) return;
      data.nextData[interaction.customId === "x_c" ? "x" : "y"] = Number(interaction.values[0]);
      await interaction.update({
        content: null, 
        embeds: [
          new discord.MessageEmbed()
          .setTitle("オセロ対戦")
          .setDescription(renderDescription(data.game, data.first, data.second))
          .setFooter(renderFooter(data.game, interaction.guild.members.resolve(data.first)))
          .setTimestamp(data.date)
          .setColor(0xe6f5e6)
        ],
        components: createComponents(data.nextData.x, data.nextData.y)
      });
    }else if(interaction.isButton()){
      const data = this.games[interaction.message.id];
      if(!data || interaction.user.id !== data[data.game.board.nextStone === "white" ? "first" : "second"]) return;
      if(interaction.customId === "done"){
        if(data.nextData.x < 0 || data.nextData.y < 0){
          await interaction.reply({
            content: "縦横両方の座標を先に選択してから打ってください",
            ephemeral: true
          });
          return;
        }
        try{
          const result = data.game.put({
            current: data.game.board.nextStone,
            type: "put",
            x: data.nextData.x as CellNums, y: data.nextData.y as CellNums
          });
          data.nextData.x = data.nextData.y = -1;
          if(!result.winner){
            await interaction.update({
              content: null, 
              components: createComponents(),
              embeds: [
                new discord.MessageEmbed()
                .setTitle("オセロ対戦")
                .setDescription(renderDescription(data.game, data.first, data.second))
                .setFooter(renderFooter(data.game, interaction.guild.members.resolve(data.first)))
                .setTimestamp(data.date)
                .setColor(0xe6f5e6)
              ]
            });
          }else{
            let winner = result.winner === "white" ? data.first :
              result.winner === "black" ? data.second : null;
            if(winner){
              winner = `** <@${winner}> の勝利です!おめでとうございます!**`;
            }else{
              winner = "**引き分けです!**";
            }
            await interaction.update({
              content: null, 
              embeds: [
                new discord.MessageEmbed()
                .setTitle("オセロ対戦")
                .setDescription(winner + "\r\n" + renderDescription(data.game, data.first, data.second))
                .setFooter(renderFooter(data.game, interaction.guild.members.resolve(data.first)))
                .setColor(0xe6f5e6)
              ],
              components: []
            });
            delete this.games[interaction.message.id];
          }
        }
        catch(er){
          await interaction.reply({
            content: "<@" + (interaction.user.id) + "> 失敗しました: " + er,
            ephemeral: true
          });
        }
      }else if(interaction.customId === "pass"){
        data.game.put({
          current: data.game.board.nextStone,
          type: "pass"
        });
        await interaction.update({
          content: null, 
          embeds: [
            new discord.MessageEmbed()
            .setTitle("オセロ対戦")
            .setDescription(renderDescription(data.game, data.first, data.second))
            .setFooter(renderFooter(data.game, interaction.guild.members.resolve(data.first)))
            .setTimestamp(data.date)
            .setColor(0xe6f5e6)
          ]
        });
      }
    }
  }

  Run(token:string){
    return this.client.login(token);
  }
}