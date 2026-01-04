const fs = require('fs');
const path = require('path');

const pasta = '.';                 // pasta do projeto
const antigo = 'FrFinance';      // ex.: 'FrMoney Alvim'
const novo = 'FrFinance';

function trocarEmArquivo(caminho) {
  const conteudo = fs.readFileSync(caminho, 'utf8');
  if (!conteudo.includes(antigo)) return;
  const novoConteudo = conteudo.split(antigo).join(novo);
  fs.writeFileSync(caminho, novoConteudo, 'utf8');
  console.log('Atualizado:', caminho);
}

function percorrerPasta(dir) {
  const itens = fs.readdirSync(dir);
  itens.forEach((item) => {
    const completo = path.join(dir, item);
    const stat = fs.statSync(completo);
    if (stat.isDirectory()) {
      percorrerPasta(completo);
    } else if (/\.(html|css|js|json|md)$/i.test(completo)) {
      trocarEmArquivo(completo);
    }
  });
}

percorrerPasta(pasta);
