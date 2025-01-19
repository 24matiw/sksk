const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const crypto = require('crypto');
const Canvas = require('canvas');
const chalk = require('chalk');
const OpenAI = require('openai');
const { spawn } = require('child_process');
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});
const openai = new OpenAI({
    apiKey: "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",
});
client.setMaxListeners(40);
client.once('ready', () => {
    console.log(chalk.green('¡bot activado correctamente!'));
});


// Comando para encender el bot de Python
const startPythonBot = () => {
    const command = 'python C:\\Users\\matias\\Desktop\\logs.ds\\logeador.py';
    pythonProcess = spawn('python', ['C:\\Users\\matias\\Desktop\\logs.ds\\logeador.py']); // Usamos spawn para obtener el proceso

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Proceso de Python terminó con código ${code}`);
    });
};

// Comando para apagar el bot de Python
const stopPythonBot = () => {
    if (pythonProcess) {
        pythonProcess.kill();  // Termina el proceso Python
        console.log('Bot de Python apagado.');
    } else {
        console.log('No se encontró un proceso de Python en ejecución.');
    }
};

client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignorar mensajes de otros bots

    // Comando logs.on para encender el bot Python
    if (message.content === '-onlog') {
        message.channel.send('**el bot de python se prendio correctamente >> canal: logs**');
        startPythonBot(); // Llamar la función para encender el bot Python
    }

    // Comando logs.off para apagar el bot Python
    if (message.content === '-offlog') {
        message.channel.send('**el bot de python se apago correctamente**');
        stopPythonBot(); // Llamar la función para apagar el bot Python
    }
});


client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignorar mensajes de otros bots

    // Comando: Ping
    if (message.content === '-ping') {
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('PING DE EL BOT')
            .setDescription(`Mi ping es de **${ping}ms**.`)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    // Comando: Server Info
    if (message.content === '-info') {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📜 Información del Servidor')
            .addFields(
                { name: '**Servidor:**', value: message.guild.name, inline: true },
                { name: '**Miembros:**', value: message.guild.memberCount.toString(), inline: true }
            )
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    // Comando: User Info
    if (message.content === '-userinfo') {
        const user = message.author;
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('👤 Información del Usuario')
            .addFields(
                { name: '**Usuario:**', value: user.tag, inline: true },
                { name: '**ID:**', value: user.id, inline: true },
                { name: '**Cuenta Creada:**', value: user.createdAt.toDateString(), inline: true }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    // Comando: Avatar
    if (message.content === '-avatar') {
        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🖼️ Tu Avatar')
            .setImage(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
});

// Manejo de contraseñas
let passwords = {};
if (fs.existsSync('passwords.json')) {
    passwords = JSON.parse(fs.readFileSync('passwords.json', 'utf8'));
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);

    if ((args[0] === '-guardar' || args[0] === '-g') && args.length >= 3) {
        const password = args[1];
        const key = args.slice(2).join(' ');

        passwords[key] = password;
        fs.writeFileSync('passwords.json', JSON.stringify(passwords, null, 2));

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('GUARDADA CORRECTAMENTE')
            .setDescription(`para recordarla, usa: \`-restaurar "${key}"\``);

        return message.reply({ embeds: [embed] });
    }

    if ((args[0] === '-restaurar' || args[0] === '-r') && args.length >= 2) {
        const key = args.slice(1).join(' ');

        if (passwords[key]) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('RESTAURADA CORRECTAMENTE')
                .setDescription(`la pw de **"${key}" es >> ** \`${passwords[key]}\`\n\n ***usa el boton para que  genere la pw para copiar >>***`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('copy_password')
                        .setLabel('copiar contraseña')
                        .setStyle(ButtonStyle.Primary)
                );

            const response = await message.reply({ embeds: [embed], components: [row] });

            const filter = (interaction) => interaction.customId === 'copy_password' && interaction.user.id === message.author.id;
            const collector = response.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async (interaction) => {
                await interaction.reply({
                    content: `\n\`\`\`${passwords[key]}\`\`\``,
                    ephemeral: true
                });
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });
        } else {
            const embed = new EmbedBuilder()
                .setColor('FF0000')
                .setTitle('✖ NO ENCONTRADO')
                .setDescription(`**"${key}" no está guardado.**`);

            return message.reply({ embeds: [embed] });
        }
    }

    
    if (message.content === "-img") {
        const imageUrls = [
            "https://i.ibb.co/9WGxy7m/gaturro-AF2-SWy-FZP7.png",
            "https://i.ibb.co/fvSSFdJ/Discord-BHjg-Pifaaq.png",
            "https://i.ibb.co/cgNFWj9/gaturro-8g-Uj-FWErnm.png",
            "https://i.ibb.co/7WSwMbr/gaturro-AETWx5m-Y2-Z.png",
            "https://i.ibb.co/zrYqVQ6/Roblox-Player-Beta-Emucklac-O2.png",
            "https://i.ibb.co/fGVnkZx/oo.png",
            "https://i.ibb.co/cCtqJ1Y/nigayvall.png",
            "https://i.ibb.co/2yrR2Br/nigacin.png",
            "https://i.ibb.co/Qpxhgrj/nigaa.png",
            "https://i.ibb.co/QJQ3fN7/Captura-de-pantalla-2025-01-04-021007.png",
            "https://i.ibb.co/sQC6mHL/Captura-de-pantalla-2025-01-05-042447o.png",
            "https://i.ibb.co/Fmb6Hd8/Captura-de-pantalla-2024-12-26-043207.png",
            "https://i.ibb.co/XF7ndvR/Captura-de-pantalla-2024-12-21-210735.png",
            "https://i.ibb.co/QY5QMjQ/Captura-de-pantalla-2024-12-23-0157330.png",
            "https://i.ibb.co/ySrmQLQ/Captura-de-pantalla-2024-12-23-0215249.png",
            "https://i.ibb.co/7SjkWc6/Captura-de-pantalla-2024-12-15-005008.png",
            "https://i.ibb.co/2FXwqyv/Captura-de-pantalla-2024-12-15-004956.png",
            "https://i.ibb.co/YLzTnGb/Captura-de-pantalla-2024-12-14-235922.png",
            "https://i.ibb.co/m4RdXD3/Captura-de-pantalla-2024-12-14-235729.png",
            "https://i.ibb.co/xhtw6cv/Captura-de-pantalla-2024-12-06-013718.png",
            "https://i.ibb.co/rcfQB8Q/Captura-de-pantalla-2024-10-31-221641.png",
            "https://i.ibb.co/qW6XjHy/Captura-de-pantalla-2024-11-06-004022.png",
            "https://i.ibb.co/TRNN14H/Captura-de-pantalla-2024-11-20-010447.png",
            "https://i.ibb.co/BwYbVP1/Captura-de-pantalla-2024-11-30-025525.png",
            "https://i.ibb.co/fD6BCxv/Captura-de-pantalla-2024-11-01-210006.png",
            "https://i.ibb.co/THK31ZW/Captura-de-pantalla-2024-11-18-033258.png",
            "https://i.ibb.co/0Q1BfjD/Captura-de-pantalla-2024-11-14-003507.png",
            "https://i.ibb.co/6HCPd4Q/Captura-de-pantalla-2024-11-04-0056050.png",
            "https://i.ibb.co/5kXcMsr/Captura-de-pantalla-2024-11-22-022255.png",
            "https://i.ibb.co/PNjwxRK/Captura-de-pantalla-2024-11-22-025225.png",
            "https://i.ibb.co/02N2wsT/Captura-de-pantalla-2025-01-04-041040.png",
            "https://i.ibb.co/3FqPnk3/Captura-de-pantalla-2024-11-07-232741.png"
        ];
    
        const frasesRandis = ["oy oy oy", "ti amu", "y mi besito bb", "vicoliva forever", "mamerto", "marmota", "uwu", "sapito"];
        const fraseAleatoria = frasesRandis[Math.floor(Math.random() * frasesRandis.length)];
        const randomUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        
        const colorHex = "F04980";
        const colorDecimal = parseInt(colorHex.replace("#", ""), 16);
        
        const embed = new EmbedBuilder()
            .setTitle("img random")
            .setDescription(fraseAleatoria)
            .setColor(colorDecimal)
            .setImage(randomUrl)
            .setFooter({ text: "Comando: -img" })
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    }
    
    
});




client.on(Events.MessageCreate, async (message) => {
    if (message.content === "test") 
        {
        message.reply("test 1");
    }
    
    if (message.content.startsWith("-pregunta ")) 
        
        {

        const pregunta = message.content.slice(5).trim();
        
        if (!pregunta) {
            return message.reply("hace una pregunta asi la IA responde.");
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini", 
                messages: [
                    { role: "user", content: pregunta }, 
                ],
            });

            const respuesta = completion.choices[0].message.content; 
            message.reply(`**IA >>**  ${respuesta}`); 

        } catch (error) {
            console.error("**error para interactuar con la IA**", error);
            message.reply("***error para responderte , intenta denuevo gei***");
        }
    }

        if (message.content.startsWith("-clear ")) 
           
            {

            const args = message.content.split(" ");
            const amount = parseInt(args[1]);
            
            if (!amount || amount <= 0 || amount > 100) {
                return message.reply("**PONE LA CANTIDAD DE MENSAJES QUE QUERES BORRAR**");
            }
    
            message.channel.bulkDelete(amount, true).catch(err => message.reply("***no se puede borrar esos mensajes :,v***"));
        }


    
        if (message.content === '-help') {
            const colorHex = "00FFFF";
            const colorDecimal = parseInt(colorHex.replace("#", ""), 16);
        
            // Crea un embed con la lista de comandos
            const embed = new EmbedBuilder()
                .setTitle("CMDS DE EL BOT")
                .setDescription(`
--------------------------------------
***estos son los comandos por ahora >> ***
--------------------------------------

**cmd | descripcion | uso**     

**-brute** » *Genera posibles contraseñas para una cuenta* \`[-brute "cuenta"]\`.
**-pw** » *Genera una contraseña aleatoria*.
**-sala** » *Muestra la ID de la sala* \`[-sala "nombreSala"]\`.
**-id** » *Muestra el nombre de la sala con la ID* \`[-id "salaId"]\`.
**-encode** » *Encripta texto en Base64* \`[-encode "string"]\`.
**-decode** » *Decodifica texto en Base64* \`[-decode "string"]\`.
**-actions** » *Muestra lista de acciones*.
**-effects** » *Muestra lista de efectos*.
**-server** » *Lista de comandos para el servidor*.
**-mmo** » *Busca el último MMO y te da el size <parcheado>*.
**-swf** » *Devuelve el link de descarga del .SWF* \`[-swf "nombreSwf"]\`.
**-exact** » *Devuelve el EXACT* \`[-exact "tipoExact" "nombre"]\`.
**-json** » *Devuelve el link del .JSON* \`[-json "nombre"]\`.
**-pregunta** » *Interactúa con la IA* \`[-pregunta "pregunta"]\`.
**-cuentas** » *Muestra las multicuentas* \`[-cuentas "nombre"]\`.
**-guardar** » *Guarda tus contraseñas* \`[-guardar "contraseña" "usuario"]\`.
**-restaurar** » *Recupera tu contraseña* \`[-restaurar "usuario"]\`.
**-logs** » *Muestra como usar el bot de python*.
**-clear** » *Borra mensajes anteriores* \`[-clear "int"]\`.
**-boludeces** » *Lista de comandos extra del bot*.
                `.trim())
                .setColor(colorDecimal) 
                .setFooter({ text: "<cmds | usage>" })
                .setTimestamp();
        
            message.channel.send({ embeds: [embed] });
        }
    
    

    
    if (message.content === '-boludeces') {
        // Color en formato hexadecimal convertido a número decimal
        const colorHex = "FF8700";
        const colorDecimal = parseInt(colorHex.replace("#", ""), 16);
    
        // Crea un embed con la lista de comandos
        const embed = new EmbedBuilder()
            .setTitle("BOLUDECES")
            .setDescription(`
------------------------
***comandos para jugar >> ***        
------------------------
            
**cmd | descripcion | uso**  

 **-elegir** » *Elige entre mati y val*.
 **-siono** » *Elige la respuesta si/no*.
 **-deci** » *El bot dice lo que vos quieras* \`[-deci "string"]\`.
 **-pregunta** » *Interactúa con la IA* \`[-pregunta "pregunta"]\`.
 **-privado** » *Te tiene que ganar la curiosidad*.
 **-img** » *Pasa una foto random de algun momento*.
 **-clear** » *Usa ese comando borrar mensajes anteriores* \`[-clear "int"]\`.

            `.trim())
            .setColor(colorDecimal) 
            .setFooter({ text: "boludeces : cmds | usage" })
            .setTimestamp();
    
        message.channel.send({ embeds: [embed] });
    }


    if (message.content === '-server') {
        // Color en formato hexadecimal convertido a número decimal
        const colorHex = "FFFFFF";
        const colorDecimal = parseInt(colorHex.replace("#", ""), 16);
    
        // Crea un embed con la lista de comandos
        const embed = new EmbedBuilder()
            .setTitle("INFORMACION DEL SERVIDOR")
            .setDescription(`
------------------------
***comandos para el sv >> ***        
------------------------
            
**cmd | descripcion | uso**  

**-ping** » *te dice el ping del bot*.
**-userinfo** » *informacion sobre el miembro*.
**-avatar** » *muestra imagen/gift del miembro*.
**-info** » *informacion sobre el servidor*.
**-pregunta** » *Interactúa con la IA* \`[-pregunta "pregunta"]\`.
**-clear** » *Usa ese comando borrar mensajes anteriores* \`[-clear "int"]\`.

            `.trim())
            .setColor(colorDecimal) 
            .setFooter({ text: "server : cmds | usage" })
            .setTimestamp();
    
        message.channel.send({ embeds: [embed] });
    }



    if (message.content === '-logs') {
        // Color en formato hexadecimal convertido a número decimal
        const colorHex = "FFFF00";
        const colorDecimal = parseInt(colorHex.replace("#", ""), 16);
    
        // Crea un embed con la lista de comandos
        const embed = new EmbedBuilder()
            .setTitle("BOT LOGEADOR >>")
            .setDescription(`
------------------------
***comandos del bot de PY por ahora >> ***        
------------------------
            
**cmd | descripcion | uso**  

**-onlog** » *prende el bot de python para logear*.
**-offlog** » *apaga el bot de python*.
**-pregunta** » *Interactúa con la IA* \`[-pregunta "pregunta"]\`.
**-clear** » *Usa ese comando borrar mensajes anteriores* \`[-clear "int"]\`.

            `.trim())
            .setColor(colorDecimal) 
            .setFooter({ text: "logs : cmds | usage" })
            .setTimestamp();
    
        message.channel.send({ embeds: [embed] });
    }

    //esto es para boludear con val , no se agrega a la lista de cmds


    if (message.content === "-elegir") 
        {
            
        const puta = ["mati", "val", "cande=empate"];
        const elije = puta [Math.floor(Math.random() * puta.length)];
        message.reply(elije);
    }
    

    if (message.content === "-siono") 
        {
            
        const puta = ["1 (si) ", "2 (no) ", "3 (otro intento) "];
        const elije = puta [Math.floor(Math.random() * puta.length)];
        message.reply(elije);
    }

    
    if (message.content === "-pw") {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@_';
        let password = '';
        let numbersCount = 0;
        let hasUppercase = false;
        let hasSpecialChar = false;

        while (password.length < 12) {
            const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));

            // Contar números
            if ('0123456789'.includes(randomChar)) {
                if (numbersCount < 3) {
                    numbersCount++;
                } else {
                    continue; 
                }
            }

           
            if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(randomChar)) {
                hasUppercase = true;
            }

            if ('@_'.includes(randomChar)) {
                hasSpecialChar = true;
            }

            password += randomChar;
        }

    
        if (!hasUppercase) 
            {
            const randomIndex = Math.floor(Math.random() * 12);
            password = password.substring(0, randomIndex) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26)) + password.substring(randomIndex + 1);
        }

        if (!hasSpecialChar) 
            {
            const randomIndex = Math.floor(Math.random() * 12);
            password = password.substring(0, randomIndex) + '@_'.charAt(Math.floor(Math.random() * 2)) + password.substring(randomIndex + 1);
        }

        message.reply(`**tu contraseña aleatoria es >>**  ${password}`);
    }
    if (message.content.startsWith("-brute ")) {
        const accountName = message.content.split(" ")[1];
        if (!accountName) {
            return message.reply("**PONE ALGUNA CUENTA/NOMBRE QUE QUIERAS ROBAR**");
        }
    
        const commonPasswords = [
            '1234', '12345', '123456', '1234567', '12345678', '123456789',
            'mundogaturro', 'gaturro', '1111', '3333',
            'contraseña', 'password', 'qwerty', 'superman', 'princesa',
            'abc123', 'argentina', '123123', 'password1', '102030',
            'milanesa', 'river', 'boca', 'qwerty123', 'argentina123'
        ];
    
        // Primero mostramos el diccionario de contraseñas comunes
        message.reply(`**pws comunes >>** \`\`\`\n${commonPasswords.join('\n')}\`\`\``);
    
        // Limitamos las combinaciones a las siguientes
        const combinationPasswords = [];
        const baseNumbers = ['123', '1234'];
        const specialChars = ['@', '_'];
    
        baseNumbers.forEach(num => {
            const variations = [
                accountName.toLowerCase(),    // accountName en minúsculas
                accountName.toUpperCase(),    // accountName en mayúsculas
                accountName.charAt(0).toUpperCase() + accountName.slice(1).toLowerCase()  // Primera letra mayúscula
            ];
    
            variations.forEach(variation => {
                specialChars.forEach(char => {
                    // Añadimos solo algunas combinaciones
                    combinationPasswords.push(`${variation}${num}`);
                    combinationPasswords.push(`${variation}${char}`);
                    combinationPasswords.push(`${char}${variation}`);
                });
            });
        });
    
        const MAX_MESSAGE_LENGTH = 2000;
        let messageParts = [];
        let currentPart = "";
    
        combinationPasswords.forEach(password => {
            const newPart = (currentPart ? currentPart + '\n' : '') + password;
            if (newPart.length > MAX_MESSAGE_LENGTH) {
                messageParts.push(currentPart);
                currentPart = password;
            } else {
                currentPart = newPart;
            }
        });
    
        if (currentPart) {
            messageParts.push(currentPart);
        }
    
        // Enviar las combinaciones generadas
        if (messageParts.length > 0) {
            console.log(`Enviando Parte 1: ${messageParts[0].length} caracteres`);
            message.reply(`**combinaciones >> **\`\`\`\n${messageParts[0]}\`\`\``);
        }
    }
    

    if (message.content.startsWith("-encode ")) {
        const textToEncode = message.content.slice(8).trim();
        if (textToEncode) {
            const encodedText = Buffer.from(textToEncode).toString('base64');
            message.reply(`**codificado >>** \`\`\`css\n${encodedText}\n\`\`\``);
        } else {
            message.reply("*pone algo para codificar*");
        }
    }

    if (message.content.startsWith("-decode ")) {
        const textToDecode = message.content.slice(8).trim();
        if (textToDecode) {
            try {
                const decodedText = Buffer.from(textToDecode, 'base64').toString('utf-8');
                message.reply(`**decodificado >>** \`\`\`css\n${decodedText}\n\`\`\``);
            } catch (error) {
                message.reply("*fijate que este en base54 y que sea valido boludon*");
            }
        } else {
            message.reply("*pone algo para decodificar*");
        }
    }

    client.on('messageCreate', async (message) => {
        if (message.content === '-privado') {  // Aquí el comando
          try {
            // Enviar un mensaje directo al usuario que ejecuta el comando
            await message.author.send('hola estas siendo hackeado.');
            console.log('Mensaje enviado correctamente.');
          } catch (error) {
            console.error('No se pudo enviar el mensaje:', error);
          }
        }
      });

    if (message.content.startsWith("-actions")) 
        {
        const actions = 
        [
            "icecream", "horn", "throwDown", "percussion", "spray", "colouredSpray", 
            "flag", "football", "kick", "showObject", "showObjectUp", "gym", "free",
            "eat", "drink", "sweep", "phone", "water", "pedo", "eructo", "rayos", 
            "estornudo", "guitar", "dig", "jueguito", "spellfighting",
            "phone_loop", "fish", "nadando", "flotando", "get", "sweep", "percussion", 
            "gymLoop", "guitar", "dormido", "amazed", "celebrate", "dance", "greet", 
            "idea", "joke", "jump", "laugh", "love", "sad", "vertical", "sit", "dance2", 
            "fortnite2", "fortnite1", "dance3", "dance4", "dance5", "blank",
            "transportMove_horse", "transportMove_vuela", "transportMove_gorro", "transportMove_bike", 
            "transportMove_pogo", "transportMove_escoba", "transportMove_balloon", "transportMove_colgante", 
            "transportMove_surf", "transportMove", "transportStand", "transportStand_horse", 
            "transportStand_vuela", "transportStand_gorro", "transportStand_surf", "transportStand_bike", 
            "transportStand_pogo", "transportStand_escoba"
        ];
    
        // Eliminar duplicados usando Set
        const uniqueActions = [...new Set(actions)];
    
        // Mostrar todas las acciones en formato lista
        const actionsList = uniqueActions.map(action => `- ${action}`).join('\n'); 
        message.reply(`**lista acciones de mg >>** \`\`\`\n${actionsList}\`\`\``);

    }
    
    if (message.content.startsWith("-effects")) 
        {
        const effects = 
        [
            "h", "dirty", "retro", "ghost", "invert", "shade", "censored", "..."
        ];
    
        // Mostrar todos los efectos en formato lista
        const effectsList = effects.map(effect => `- ${effect}`).join('\n'); // Unir todos los efectos con un guion al principio de cada uno
        message.reply(`**lista efectos de mg >>** \`\`\`\n${effectsList}\`\`\``);

    }
    
    
    


    const rooms = {
        "bar": { id: 26580, coord: "22,7" },
        "amistad": { id: 51690477, coord: "1,9" },
        "cables": { id: 25373, coord: "11,5" },
        "cabaña": { id: 25376, coord: "0,0" },
        "campamento": { id: 51690474, coord: "8,8" },
        "plazita": { id: 51690076, coord: "17,6" },
        "cafe": { id: 51689134, coord: "10,8" },
        "parque de agua": { id: 46747, coord: "0,0" },
        "galeria": { id: 32950, coord: "0,0" },
        "ciudad": { id: 25355, coord: "0,0" },
        "playa (spawn)": { id: 25364, coord: "0,0" },
        "peluqueria": { id: 25375, coord: "0,0" },
        "terraza moderna": { id: 25370, coord: "0,0" },
        "terraza ph": { id: 25371, coord: "0,0" },
        "gatufashion": { id: 25374, coord: "0,0" },
        "gatushoping": { id: 51689177, coord: "0,0" },
        "parque de diversiones": { id: 51688279, coord: "0,0" },
        "discoteca": { id: 56280, coord: "0,0" },
        "estadio": { id: 45698, coord: "0,0" },
        "parque (spawn)": { id: 25358, coord: "0,0" },
        "arbol": { id: 25377, coord: "0,0" },
        "lab": { id: 72746, coord: "0,0" },
        "muelle": { id: 33168, coord: "0,0" },
        "isla": { id: 33764, coord: "0,0" },
        "faro": { id: 43019, coord: "0,0" },
        "despegue": { id: 25369, coord: "0,0" },
        "escuela": { id: 51684582, coord: "0,0" },
        "museo": { id: 42325, coord: "0,0" },
        "nieve": { id: 25367, coord: "0,0" },
        "aeropuerto": { id: 54163, coord: "0,0" },
        "plaza-cafe": { id: 45419, coord: "0,0" },
        "planeta unicef": { id: 47731, coord: "0,0" },
        "hospital": { id: 51688107, coord: "0,0" },
        "veterinario": { id: 43657, coord: "0,0" },
        "hotel embrujado": { id: 51683129, coord: "0,0" },
        "spawn-parque diversiones": { id: 32540, coord: "0,0" },
        "potter": { id: 51690298, coord: "13,10" },
       "eboy": { id: 25374, coord: "12,6" },
  "cafeteria": { id: 51689134, coord: "17,11" },
  "parkWater": { id: 46747, coord: "10,2" },
  "cuadros": { id: 32950, coord: "12,7" },
  "dailyQuest": { id: 25358, coord: "5,7" },
  "robo": { id: 43657, coord: "8,6" },
  "city1": { id: 25355, coord: null },
  "city2": { id: 25356, coord: "9,8" },
  "city3": { id: 25363, coord: null },
  "city4": { id: 25362, coord: null },
  "city5": { id: 31739, coord: null },
  "beach1": { id: 25361, coord: "16,9" },
  "beach2": { id: 25360, coord: null },
  "beach3": { id: 25364, coord: null },
  "beach4": { id: 38341, coord: null },
  "snow1": { id: 25367, coord: "13,6" },
  "snow2": { id: 25368, coord: null },
  "snow3": { id: 25369, coord: "17,7" },
  "park1": { id: 25357, coord: null },
  "park2": { id: 25358, coord: null },
  "plaza": { id: 45419, coord: "12,11" },
  "parkLove": { id: 38318, coord: "1,1" },
  "parkDark": { id: 43032, coord: "4,9" },
  "parkDark2": { id: 43032, coord: "4,9" },
  "hotelEmbrujado": { id: 51683129, coord: "21,10" },
  "bruja": { id: 43121, coord: "5,3" },
  "parkDiversion": { id: 51688279, coord: "6,11" },
  "museo": { id: 42325, coord: "6,11" },
  "sky1": { id: 25371, coord: null },
  "sky2": { id: 25373, coord: null },
  "sky3": { id: 25370, coord: "8,9" },
  "casamiento": { id: 51683119, coord: "10,9" },
  "escuelaNueva": { id: 51684582, coord: "6,12" },
  "unicef": { id: 47731, coord: "7,11" },
  "museoCiencias": { id: 42325, coord: "6,11" },
  "estadio": { id: 45698, coord: "10,7" },
  "egipto": { id: 56280, coord: "15,9" },
  "muelle": { id: 33168, coord: "15,9" },
  "isla": { id: 33764, coord: "12,6" },
  "aeropuerto": { id: 54163, coord: "16,10" },
  "space": { id: 51686897, coord: "7,10" },
  "cottage": { id: 25376, coord: "12,4" },
  "veterinaria": { id: 43657, coord: "8,6" },
  "cine": { id: 25356, coord: "12,8" },
  "hospital": { id: 51688107, coord: "9,10" },
  "gatubersGallery": { id: 32950, coord: "12,7" },
  "flowerStore": { id: 35342, coord: "22,11" },
  "hairdressing": { id: 25375, coord: "8,4" },
  "laboratorioDiseno": { id: 72746, coord: "7,4" },
  "edificio": { id: 25362, coord: "10,3" },
  "giftstore": { id: 31755, coord: "17,3" },
  "compraVenta": { id: 33860, coord: "7,6" },
  "tecno": { id: 45583, coord: "7,11" },
  "comisaria": { id: 46749, coord: "10,11" },
  "fashion": { id: 25374, coord: "12,6" },
  "shopping": { id: 51689177, coord: "13,11" },
  "bar": { id: 26580, coord: "11,9" },
  "g_snowPenguin": { id: 25368, coord: "19,7" },
  "g_findthecat": { id: 25368, coord: "16,5" },
  "g_match": { id: 42739, coord: "14,11" },
  "g_snowball": { id: 25369, coord: "18,5" },
  "g_spacehunters": { id: 42736, coord: "13,8" },
  "g_whackacat2": { id: 25370, coord: "5,7" },
  "g_jetpack": { id: 68114, coord: "12,7" },
  "g_cooking": { id: 26580, coord: "4,7" },
  "g_petvet": { id: 43657, coord: "6,7" },
  "g_butterflies": { id: 32540, coord: "12,10" },
  "g_driving": { id: 31739, coord: "11,10" },
  "g_snowwar": { id: 25369, coord: "13,4" },
  "g_bibliotecav2": { id: 47985, coord: "11,10" },
  "g_dressers": { id: 69633, coord: "12,7" },
  "g_matematica": { id: 70155, coord: "11,9" },
  "g_skate": { id: 25355, coord: "9,10" },
  "g_ingredientes": { id: 47985, coord: "9,10" },
  "g_runjump": { id: 45698, coord: "8,6" },
  "g_personajes": { id: 47985, coord: "4,7" },
  "g_turismo": { id: 70155, coord: "16,10" },
  "g_colourcode": { id: 70155, coord: "4,8" },
  "cielo": { id: 51688, coord: "0,0" },
  "g_jumprope": { id: 25364, coord: "2,4" },
  "g_clima": { id: 68114, coord: "14,10" }
    };


    const idsToRooms = Object.fromEntries(Object.entries(rooms).map(([name, { id }]) => [id, name]));

    if (message.content.startsWith("-sala ")) {
        const roomName = message.content.slice(6).trim(); // Obtiene el nombre de la sala
        const room = rooms[roomName]; // Busca la sala en el objeto `rooms`

        if (room) {
            // Embed verde si la sala fue encontrada
            const embed = new EmbedBuilder()
                .setTitle("SALA ENCONTRADA")
                .setDescription(`**SALA >> ** ${roomName}\n**ID >> ** ${room.id}\n**COORD >> ** ${room.coord}`)
                .setColor(0x00FF00); // Color verde
            message.reply({ embeds: [embed] });
        } else {
            // Embed rojo si la sala no fue encontrada
            const embed = new EmbedBuilder()
                .setTitle("SALA NO ENCONTRADA")
                .setDescription("**no se encontro la sala**")
                .setColor(0xFF0000); // Color rojo
            message.reply({ embeds: [embed] });
        }
    }


    if (message.content.startsWith("-id ")) {
        const id = parseInt(message.content.split(" ")[1]);
        if (!isNaN(id)) {
            // Verifica si el ID está dentro del rango del array y si tiene un valor definido
            const roomName = idsToRooms[id];
            if (roomName) {
                // Crea un embed para la respuesta cuando se encuentra la ID
                const embed = new EmbedBuilder()
                    .setTitle("ID ENCONTRADA")
                    .setDescription(`**SALA >> ** ${roomName}\n**ID >> ** ${id}`)
                    .setColor(0x00FF00); // Color verde
                message.reply({ embeds: [embed] });
            } else {
                // Crea un embed para la respuesta cuando no se encuentra la ID
                const embed = new EmbedBuilder()
                    .setTitle("NO SE ENCONTRO LA ID")
                    .setDescription("**ID no encontrada**")
                    .setColor(0xFF0000); 
                message.reply({ embeds: [embed] });
            }
        } else {
            message.reply("**pone bien la id boludito**");
        }
    }
    

const personas = {
    artico: ["PAYASO TRISTE", "NAHUE", "NAKENI", "ARCEUS", "GABUMON", "PRANKASTER", "MATEITOS", "NAHU 2003", "PAYASO TRISTE", "A L E", "IGNORED", "IGNORE", "DEVOUR", "DEVORAR", "UNSKILLED", "POLO SUR", "POLO NORTE", "ARTICO", "ARTIC", "HOLA PRINCESA", "ESTAS RE BUENA", "OUTFIT", "TORETO 800"],
    mili: ["MILI JIJI", "MILI JEJE", "TAMBORCIN", "XMILI", "TAMBOR.CANJES", "MILI LINDA", "SELEECLV", "CENSURATE", "GOHRDO", "DISCULPATE", "CHWUPALA"],
    lino: ["LINO39", "AMERI.", "47STREET"],
    cande: ["AMOROSITA.", "CANDE", "CAANDEVIGEVANI", "CANDE V"],
    marga: ["MARGAME", "GARITAA.", "ROGELIOROGELIO", "KITTYMUAMUA", "AYLEEEEEN"],
    val: ["VALENTINA", "VALL", "XVALL", "777.777.777", "GATA VAL", "BOCA 2011", "EDISON CAVANI", "😂"],
    pyñon: ["PYÑON", "LUCAS123", "PYÑON.TIENDAS"],
    pochon: ["ENTIDAD", "GLOPETA", "POCHON8"],
    vicoliva: ["VICTORIA1961"],
    narma: ["NARMA14", "SOYDEMILI4"],
    isi: ["ISI 1", "PROGRAMADOR", "ISI 2", "ISI CHIQUITO", "ISI TRISTE"],
    mafi: ["ADMINISTRATIVO.", "LIBRIANO.", "M4RIC4TOTAL", "MAFIBIENHOT", "PILBORQUEZ.", "QB9.NET", "REMAKEADO", "SOYDEABE", "TELECOM.", "LAUU1CABJ", "MONITOREANDO"],
    zero: ["MILTONG123", "SNOWSPIA", "GUILLOTINA" ,"DARKU"],
    enzo: ["ENZO 54", "FRANKY.STYLE", "DUKISSJ"],
    gatugg: ["GIULIANO", "CARS", "C A R S", "G I U L I", "CARS 2", "GATUGG."],
    mati: [
        "EL REY MATIAS", "MATI EL LINDO", "MATI WWWWW", "ESPIA MATIAS", "MATI CRACK", "MATIAS BABY", "MATI PRO", 
        "MATIAS 69", "MATIAS 0", "MATIAS 1", "MATI 666", "NIGAMAN", "DE BOCA", "PREFIRE", "LOVE STAR", 
        "MAFIA", "MATII", "7654321TOB", "DIABLA", "ALOCER", "MAT1AS DE SK", "MATI PZ", 
        "MATI YO", "MATI XP", "DELIRASTE", "APROVECHA", "FACTURANDO", "MANJOIS", 
        "ZEX0", "VINTAGE", "CARNIVORET", "BOB MARLEYS", "1NIGA", "N1GA", "24MATI", 
        "UAJWD.SWA", "COMEELA", "9735", "APROBACION", "SELEECLV", "XMATIAS", "MATIAS 9", 
        "DIABLA", "9736", "30 PESOS", "VIOLAD0", "MATI GROSO", "CONCHA", 
        "MATI Z", "75HZ", "MATU CHO", "ILENIUM", "TRAPICHEO", "PHAJJA", "VIEW.ATTR", "TRUALA", "KUJADUIWDNNJNA", 
        "PAPA CRISTIAN", "LULI MAGIC", "J A G U A R", "MATI24K", "HECHICERIA", "M.A.T.I.A.S", "LOVESTAR.", 
        "MORIMOS", "ROCKSTAR2.0", "PLEGARIA", "N.I.G.A", "MATI DE BOCA", "COOJER", "AÑADIME", "MATI MALO", 
        "MI MATI", "MATI EL 10", "NIGAMAN300", "WANNAKING"]

    
};

    // Evitar que el bot responda a sus propios mensajes
    if (message.author.bot) return;

    // Verifica si el mensaje comienza con -cuentas
    if (message.content.startsWith('-cuentas')) {
        // Dividir el comando para extraer el nombre del usuario
        const args = message.content.split(' ');
        if (args.length < 2) {
            message.reply("**estas son las personas que tengo registradas >>** `ARTICO, MILI, LINO, CANDE, MARGA, VAL, PYÑON, POCHON, VICOLIVA, NARMA, ISI, MAFI, ZERO, ENZO, GATUGG, MATI`");
            return;
        }

        const persona = args[1].toLowerCase(); 

        // Buscar cuentas asociadas
        if (personas[persona]) {
            const listaCuentas = personas[persona]
                .map((cuenta, index) => `${index + 1}. ${cuenta}`) // Crear lista numerada
                .join("\n"); // Unir con saltos de línea

            message.reply(`**las cuentas de ***${persona}*** son >> ** \`\`\`css\n${listaCuentas}\`\`\``);
        } else {
            message.reply(`no tengo registro de ***${persona}***`);
        }
    }

    if (message.content === '-mmo') 
        {
        try {
            await getLatestMmo();
            const fileSize = getFileSize('data/MMO.swf');
            const sizeHash = getSha256Hash(fileSize);
            message.channel.send(`**MMO found - size >>** \`\`\`css\n${sizeHash}\n\`\`\``);
        } catch (error) {
            message.channel.send(`Error: ${error.message}`);
        }
    }

//esto es para boludear tambien

    if (message.author.bot) return;

    if (message.content.startsWith("-deci ")) 
        {
        const mensaje = message.content.slice(6).trim(); 
        if (mensaje) 
            {
            message.channel.send(mensaje); 
        } else 
        {
            message.channel.send("***pero pone algo asi lo repito***");
        }
    }


    if (message.content.startsWith('-swf')) {
        const args = message.content.split(' ');
        const swfName = args[1];
    
        if (!swfName) {
            // Embed rojo si no se proporciona un nombre de SWF
            const errorEmbed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription("**Pone el nombre del SWF que queres...**")
                .setColor(0xFF0000); // Color rojo
            return message.reply({ embeds: [errorEmbed] });
        }
    
        const downloadLink = `https://cdn-ar.mundogaturro.com/juego/assets/${swfName}.swf`;
    
        const swfNameUpper = swfName.toUpperCase();
    
        // Embed verde con el enlace del SWF
        const successEmbed = new EmbedBuilder()
            .setTitle("**DESCARGA SWF**")
            .setDescription(
                `**toca el nombre del swf >>**\n  [**${swfNameUpper}**](${downloadLink})\n\n**te dejo el EXACT también >> **\n\`\`\`EXACT:${downloadLink}\`\`\``
            )
            .setColor(0x2F4FFF)
.setFooter({ text: "       >> si te tira error 404 , pone bien el nombre", iconURL: "https://example.com/icon.png" }); // Opcional
        message.reply({ embeds: [successEmbed] });
    }
    
    
    if (message.content.startsWith('-exact')) {
        const args = message.content.split(' ');
        const type = args[1]; // Tipo de EXACT: npc, settings, assets
        const detail = args.slice(2).join(' '); // Detalle adicional, como 'lola' o 'campamento/props'
  
        if (!type || !detail) {
            return message.reply(
                '***pone bien el tipo de EXACT, ejemplo >>*** \n-exact npc (nombre) \n-exact settings (nombre) \n-exact assets (nombre) '
            );
        }
 
        let exactLink;
 
        switch (type.toLowerCase()) {
            case 'npc':
                exactLink = `https://cdn-ar.mundogaturro.com/juego/npc/${detail}.npc?cache=no%20cache`;
                break;
            case 'settings':
                exactLink = `https://cdn-ar.mundogaturro.com/juego/cfgs/settings.json`;
                break;
            case 'assets':
                exactLink = `https://cdn-ar.mundogaturro.com/juego/assets/${detail}.swf`;
                break;
            default:
                return message.reply(
                    '**pone uno de estos >>** npc, settings, assets'
                );
        }
 
        // Responder con el EXACT personalizado
        message.reply(`\`\`\`EXACT:${exactLink}\`\`\``);
    }

    if (message.content.startsWith('-json')) 
        { 
        const args = message.content.split(' ');
        const detail = args.slice(1).join(' '); 

        if (!detail) {
            return message.reply(
                '***pone el nombre para el archivo json, ejemplo >>*** \n-json (nombre)'
            );
        }

        const jsonLink = `https://cdn-ar.mundogaturro.com/juego/cfgs/${detail}.json`;

        message.reply(
            `**aca tenes el enlace del JSON >>** \n${jsonLink}\n\n**te dejo el exact también >>** \n\`\`\`EXACT:${jsonLink}\`\`\``
        );
    }
});



async function getLatestMmo() {
    const url = "https://cdn-ar.mundogaturro.com/juego/MMO.swf";
    const filePath = 'data/MMO.swf';

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
        //retocar algunas cosas edl mmo , cambiar la ecuacion y demas...
    });
}

function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
}
function getSha256Hash(input) {
    return crypto.createHash('sha256').update(String(input)).digest('hex');
}
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

 
    if (message.content.startsWith('-hash ')) {
        const input = message.content.slice(6).trim();
        const hash = getSha256Hash(input);

        message.channel.send(`SHA-256 hash de "${input}": ${hash}`);
    }
});

client.login("MTI3NTUzMDM0MzMxNDg4NjczOA.GGB9zx.sGGQQrPaZOHIY_dH4XbcFUsC287yBISNsnn3MI");
