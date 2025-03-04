const { Client, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

 
const client = new Client({
    authStrategy: new LocalAuth(),

});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true })
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado...')
});

client.on('message', msg => {
    console.log(msg.body)
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

let estadoUsuario = {};
let dadosUsuario = {};
let atendidos = {}; // Armazena timestamps dos atendimentos concluídos
const TEMPO_ESPERA = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const nomeUsuario = chat.name || "Amigo";
    const now = Date.now();

    if (!msg.from.endsWith('@c.us')) return;

    // Verifica se o número já foi atendido nas últimas 24 horas
    if (atendidos[msg.from] && now - atendidos[msg.from] < TEMPO_ESPERA) {
        return; // Ignora a mensagem
    }

    if (!estadoUsuario[msg.from]) {
        estadoUsuario[msg.from] = 'solicitando_empresa';
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from, `🌟 Olá ${nomeUsuario}, tudo bem? 😀\n\nDigite o nome de sua empresa (campo obrigatório).`);
        return;
    }

    if (estadoUsuario[msg.from] === 'solicitando_empresa') {
        dadosUsuario[msg.from] = { empresa: msg.body };
        estadoUsuario[msg.from] = 'verificando_cliente';
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from,
            `${nomeUsuario}, você já é nosso cliente?\n\n` +
            '1️⃣ - Sim\n' +
            '2️⃣ - Não\n' +
            '(Digite o número da opção) ⌨️'
        );
        return;
    }

    if (estadoUsuario[msg.from] === 'verificando_cliente') {
        if (msg.body === '1' || msg.body === '2') {
            estadoUsuario[msg.from] = 'menu_principal';
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(msg.from,
                'Para qual assunto deseja atendimento? 🤔\n\n' +
                '1️⃣ - Comercial\n' +
                '2️⃣ - Suprimentos\n' +
                '3️⃣ - Recursos Humanos\n' +
                '4️⃣ - Outros'
            );
        } else {
            await client.sendMessage(msg.from, 'Por favor, digite 1 para "Sim" ou 2 para "Não".');
        }
        return;
    }

    if (estadoUsuario[msg.from] === 'menu_principal') {
        if (msg.body === '1') {
            estadoUsuario[msg.from] = 'comercial';
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(msg.from,
                'Ok! Como posso te ajudar na área Comercial? 💼\n\n' +
                '1️⃣ - Novo orçamento\n' +
                '2️⃣ - Orçamentos em andamento\n' +
                '3️⃣ - Outra opção'
            );
            return;
        } else if (msg.body === '2') {
            await client.sendMessage(msg.from, 'Ok.   \nEntre em contato no número **tel:+551146642525**. 📞\n A Eqsan agradeçe seu contato');
            atendidos[msg.from] = now;
            delete estadoUsuario[msg.from];
            return;
        } else if (msg.body === '3') {
            await client.sendMessage(msg.from, 'Acesse o link abaixo para enviar seu currículo:\n🔗 https://eqsan.com.br/trabalhe-conosco/\n\nDesejamos boa sorte! 🍀');
            atendidos[msg.from] = now;
            delete estadoUsuario[msg.from];
            return;
        } else if (msg.body === '4') {
            estadoUsuario[msg.from] = 'outros';
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(msg.from,
                'Por favor, descreva sua dúvida para que possamos ajudar da melhor forma possível.'
            );
            return;
        }
    }

    if (estadoUsuario[msg.from] === 'comercial') {
        if (msg.body === '1') {
            await client.sendMessage(msg.from, '📝 Por favor, digite os detalhes do orçamento ou aguarde. Nossa equipe entrará em contato em breve! 📞');
        } else if (msg.body === '2') {
            await client.sendMessage(msg.from, '📄 Para consultar orçamentos em andamento, digite o número do pedido. 🔍 Nossa equipe analisará e retornará o contato em breve! ⏳');
        } else {
            await client.sendMessage(msg.from, '🤝 Nossa equipe entrará em contato para entender melhor sua necessidade e oferecer a melhor solução! 💼');
        }
        atendidos[msg.from] = now;
        delete estadoUsuario[msg.from];
        return;
    }
    

    if (estadoUsuario[msg.from] === 'outros') {
        await client.sendMessage(msg.from, 'Nossa equipe irá responder sua solicitação em breve.');
        atendidos[msg.from] = now;
        delete estadoUsuario[msg.from];
        return;
    }

    await client.sendMessage(msg.from, 'Não entendi sua resposta. Digite um número válido.');
});
