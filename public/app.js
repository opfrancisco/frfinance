// CHAVES DE ARMAZENAMENTO LOCAL
const STORAGE_PRODUTOS = 'pfinance_produtos_v1';
const STORAGE_VENDAS = 'pfinance_vendas_v1';

// ---------- PRODUTOS ----------

function carregarProdutos() {
  const json = localStorage.getItem(STORAGE_PRODUTOS);
  return json ? JSON.parse(json) : [];
}

function salvarProdutos(lista) {
  localStorage.setItem(STORAGE_PRODUTOS, JSON.stringify(lista));
}

function renderizarTabelaProdutos() {
  const produtos = carregarProdutos();
  const tbody = document.getElementById('tabela-produtos');
  tbody.innerHTML = '';

  produtos.forEach((p, index) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>R$ ${Number(p.preco).toFixed(2)}</td>
      <td>${p.estoque}</td>
      <td>
        <button onclick="editarProduto(${index})">Editar</button>
        <button onclick="excluirProduto(${index})">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // atualiza combo de produtos na tela de vendas
  preencherSelectProdutos();
}

function salvarProduto(event) {
  event.preventDefault();

  const idHidden = document.getElementById('produto-id').value;
  const nome = document.getElementById('produto-nome').value.trim();
  const preco = parseFloat(document.getElementById('produto-preco').value);
  const estoque = parseInt(document.getElementById('produto-estoque').value, 10);

  if (!nome || isNaN(preco) || isNaN(estoque)) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  const produtos = carregarProdutos();
  const produto = { nome, preco, estoque };

  if (idHidden === '') {
    produtos.push(produto);
  } else {
    produtos[Number(idHidden)] = produto;
  }

  salvarProdutos(produtos);
  limparFormularioProduto();
  renderizarTabelaProdutos();
}

function editarProduto(index) {
  const produtos = carregarProdutos();
  const p = produtos[index];

  document.getElementById('produto-id').value = index;
  document.getElementById('produto-nome').value = p.nome;
  document.getElementById('produto-preco').value = p.preco;
  document.getElementById('produto-estoque').value = p.estoque;
}

function excluirProduto(index) {
  if (!confirm('Excluir este produto?')) return;

  const produtos = carregarProdutos();
  produtos.splice(index, 1);
  salvarProdutos(produtos);
  renderizarTabelaProdutos();
}

function limparFormularioProduto() {
  document.getElementById('produto-id').value = '';
  document.getElementById('produto-nome').value = '';
  document.getElementById('produto-preco').value = '';
  document.getElementById('produto-estoque').value = '';
}

// ---------- VENDAS (dados em memória por enquanto) ----------

let itensVendaAtual = [];

function preencherSelectProdutos() {
  const produtos = carregarProdutos();
  const select = document.getElementById('venda-produto');
  if (!select) return;

  select.innerHTML = '';
  produtos.forEach((p, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = `${p.nome} (R$ ${Number(p.preco).toFixed(2)})`;
    select.appendChild(opt);
  });
}

function adicionarItemVenda() {
  const idxProduto = parseInt(document.getElementById('venda-produto').value, 10);
  const qtd = parseInt(document.getElementById('venda-quantidade').value, 10);

  if (isNaN(idxProduto) || isNaN(qtd) || qtd <= 0) {
    alert('Selecione um produto e informe a quantidade.');
    return;
  }

  const produtos = carregarProdutos();
  const produto = produtos[idxProduto];

  itensVendaAtual.push({
    nome: produto.nome,
    preco: produto.preco,
    quantidade: qtd,
    idxProduto
  });

  renderizarItensVenda();
}

function renderizarItensVenda() {
  const tbody = document.getElementById('tabela-itens-venda');
  tbody.innerHTML = '';

  let total = 0;

  itensVendaAtual.forEach((item, index) => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.quantidade}</td>
      <td>R$ ${item.preco.toFixed(2)}</td>
      <td>R$ ${subtotal.toFixed(2)}</td>
      <td><button onclick="removerItemVenda(${index})">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('venda-total').textContent = total.toFixed(2);
}

function removerItemVenda(index) {
  itensVendaAtual.splice(index, 1);
  renderizarItensVenda();
}

function carregarVendas() {
  const json = localStorage.getItem(STORAGE_VENDAS);
  return json ? JSON.parse(json) : [];
}

function salvarVendas(lista) {
  localStorage.setItem(STORAGE_VENDAS, JSON.stringify(lista));
}

function finalizarVenda() {
  if (itensVendaAtual.length === 0) {
    alert('Nenhum item na venda.');
    return;
  }

  const produtos = carregarProdutos();

  // atualiza estoque local
  itensVendaAtual.forEach(item => {
    const p = produtos[item.idxProduto];
    p.estoque = Number(p.estoque) - item.quantidade;
  });

  salvarProdutos(produtos);

  const vendas = carregarVendas();
  const total = itensVendaAtual.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const venda = {
    data: new Date().toISOString(),
    total,
    itens: itensVendaAtual
  };

  vendas.push(venda);
  salvarVendas(vendas);

  itensVendaAtual = [];
  renderizarItensVenda();
  renderizarTabelaProdutos();
  alert('Venda registrada com sucesso!');
}

// ---------- RELATÓRIOS ----------

function atualizarRelatorios() {
  const vendas = carregarVendas();
  const resumo = document.getElementById('resumo-relatorio');
  const lista = document.getElementById('lista-vendas');

  let totalGeral = 0;
  vendas.forEach(v => totalGeral += v.total);

  resumo.textContent = `Total de vendas registradas: ${vendas.length} | Soma: R$ ${totalGeral.toFixed(2)}`;

  lista.innerHTML = '';
  vendas.forEach(v => {
    const li = document.createElement('li');
    const data = new Date(v.data);
    li.textContent = `${data.toLocaleString('pt-BR')} - R$ ${v.total.toFixed(2)}`;
    lista.appendChild(li);
  });
}

// ---------- NAVEGAÇÃO ENTRE TELAS ----------

function abrirTela(nome) {
  document.querySelectorAll('.tela').forEach(t => t.classList.add('oculto'));
  const tela = document.getElementById(`tela-${nome}`);
  if (tela) tela.classList.remove('oculto');

  if (nome === 'produtos') {
    renderizarTabelaProdutos();
  } else if (nome === 'vendas') {
    preencherSelectProdutos();
    itensVendaAtual = [];
    renderizarItensVenda();
  } else if (nome === 'relatorios') {
    atualizarRelatorios();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  abrirTela('produtos');
});

