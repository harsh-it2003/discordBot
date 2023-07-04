const Discord = require('discord.js');
const { GatewayIntentBits } = require('discord.js');
const translate = require('translate-google');
const axios = require('axios');
const API_KEY = '84TRJE-YLWT688QHA';


// discord.js itself creates a websocket connection with the discord api, so no need to worry about the connection.

const cussWords = ['fuck', 'sex'];


const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});
// intents are used to specify what events your bot should have access to and receive from Discord servers.
// By specifying intents, you have finer control over the events your bot can interact with, optimizing performance and respecting privacy boundaries.


function isModerator(a,b){
    return (a==='harshit147' && b==='6563');
}


client.on('ready', () => {
    console.log('this bot is ready');
})


client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;

    // for kicking the user who used cuss words
    {
        const content = message.content.toLowerCase();
        const containsCuss = cussWords.some((word) => content.includes(word));

        if (containsCuss) {
            const offender = message.member;
            offender.kick('Used offensive language')
                .then(() => {
                    message.channel.send(`kicked ${message.author.username + message.author.discriminator} for using offensive language`);
                    message.delete()
                        .then(() => {
                            console.log('Cuss word message deleted');
                        })
                        .catch((error) => {
                            console.error('Error deleting cuss word message:', error);
                        });
                })
                .catch((error) => {
                    console.error('Error kicking user:', error);
                });
        }
    }


    // commands
    if (message.content.startsWith('!time')) {
        const currentTime = new Date().toLocaleTimeString();
        message.channel.send(`The current time is: ${currentTime}`);
    }

    if (message.content.startsWith('!translate')) {
        const args = message.content.split(' ');
        if (args.length < 3) {
            message.reply('Please provide the language you wanna translate to and also the message');
            return;
        }
        const targetLang = args[1];
        const textToTrans = args.slice(2).join(' ');

        translate(textToTrans, { to: targetLang })
            .then((res) => {
                const translation = res;
                message.channel.send(`${translation}`);
            })
            .catch((err) => {
                console.error('Translation error:', err);
                message.reply('An error occured, try again later');
            });
    }

    if (message.content.startsWith('!createpoll')) {
        const content = message.content.slice(12);
        const [question, ...options] = content.split(', ');

        if (!question || options.length < 2) {
            message.reply('Please provide a question and at least two options for the poll.');
            return;
        }
        let pollMessage = `**${question}**\n\n`;
        const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        options.map((option, index) => {
            pollMessage += `${index + 1}. ${option.trim()}\n`;
        });

        message.channel.send(pollMessage)
            .then((sentMessage) => {
                for (let i = 0; i < options.length; i++) {
                    sentMessage.react(emojiNumbers[i]);
                }
            })
            .catch((error) => {
                console.error('Error sending poll:', error);
            });

    }

    if (message.content.startsWith('!avatar')) {
        const user = message.mentions.users.first();
        message.reply(user.displayAvatarURL({ dynamic: true, size: 4096 }));
    }

    // command to ban a user 
    if (message.content.startsWith('!ban')) {

        if (!isModerator(message.author.username,message.author.discriminator)) {
            return message.reply('You do not have permission to ban members.');
        }

        const userToBan = message.mentions.users.first();
        if (!userToBan) {
            return message.reply('Please mention a user to ban.');
        }
        // resolve function is fetching the corresponding guildmember of userToBan
        const memberToBan = message.guild.members.resolve(userToBan);

        memberToBan.ban()
            .then(() => {
                message.reply(`Successfully banned ${userToBan.tag}.`);
            })
            .catch((error) => {
                console.error('Error banning user:', error);
                message.reply('An error occurred while banning the user.');
            });
    }

    // unban a member
    if (message.content.startsWith('!unban')) {
        if (!isModerator(message.author.username,message.author.discriminator)) {
            return message.reply('You do not have permission to unban members.');
        }
        const userToUnban = message.content.split(' ').slice(1)[0];
        if (!userToUnban) {
            return message.reply('Please give the username also');
        }

        const guild = message.guild;
        guild.bans.fetch().then((bans) => {
            const unbanMember = bans.find((ban) => ban.user.username + ban.user.discriminator === userToUnban);
            if (unbanMember) {
                guild.members.unban(unbanMember.user)
                    .then(() => message.reply("succesfully unbanned"))
                    .catch((err) => message.reply("please try again later"));
            } else {
                message.reply('mentioned user is not banned.')
            }
        });

    }

    // search online
    if (message.content.startsWith('!search')) {
        const query = message.content.slice(8).trim();
        const apiUrl = `http://api.wolframalpha.com/v1/result?appid=${API_KEY}&i=${encodeURIComponent(query)}`;

        try {
            const response = await axios.get(apiUrl);
            const answer = response.data.toString();
            message.channel.send(answer);
        } catch (error) {
            console.error('Error fetching answer from Wolfram Alpha API:', error);
            message.channel.send('Oops! Something went wrong while searching for the answer.');
        }
    }

    if(message.content.startsWith('!bulkDelete')){
        if(!isModerator(message.author.username,message.author.discriminator)){
            return message.reply("You don't have permissions");
        }

        const channelName=message.content.slice(12);
        const channel = message.guild.channels.cache.find((ch) => ch.name === channelName);
        channel.messages.fetch()
        .then(messages=>{
            channel.bulkDelete(messages)
            .then(console.log('Deleted all the messages of this channel successfully'))
            .catch(err=>console.log(err));
        })
        .catch(err=>console.log(err));
    }

    // show all commands 
    if (message.content.startsWith('!help')) {
        const commandList = 'The bot supports the following commands:\n' +
            '1. !time\n' +
            '2. !translate language_code text\n' +
            '3. !createpoll question, options\n' +
            '4. !avatar <mentionUser>\n' +
            '5. !ban <mentionUser>\n' +
            '6. !unban <username>\n' +
            '7. !search question\n' +
            '8. !bulkDelete <channelName>\n' + 
            '9. !help';

        message.reply(`\`\`\`${commandList}\`\`\``);
    }

})


client.on('guildMemberAdd', (member) => {
    const welcomeChannel = member.guild.channels.cache.find((ch) => ch.name === 'welcome');
    const readFirst = member.guild.channels.cache.find((ch) => ch.name === 'read-first');

    if (welcomeChannel) {
        welcomeChannel.send(`Hello ${member}, make sure to visit ${readFirst}`);
    }
});



client.login('MTExNjc4OTMxNDU3NjIwMzgwOA.G4pcg0.Ug-8kfPc4SQ6WbQUBvH1H_Pem5C9dFu0uHQd7k');






// just for more understanding : So, when you call message.channel.send(), you are invoking the send() method on the channel property of the message object. This method sends the specified message content, in this case, 'The current time is: ${currentTime}', as a response in the same channel.
// message looks like : 
/* message : Message {
  channelId: '1116781708117819516',
  guildId: '1116781708117819513',
  id: '1117180034638155910',
  createdTimestamp: 1686426876459,
  type: 0,
  system: false,
  content: '!ban <@776823325066002442>',
  author: User {
    id: '884121404985987143',
    bot: false,
    system: false,
    flags: UserFlagsBitField { bitfield: 0 },
    username: 'harshit147',
    discriminator: '6563',
    avatar: 'd9b019dd322abe9688000aaf9d48b1e5',
    banner: undefined,
    accentColor: undefine.....(some is cut)*/

// above shows that message is an object variable having the right hand side, which is an object of Message class, and suppose that Message class has a function fun(), then we can use as message.fun().
