// ---------- FIREBASE / FIRESTORE ----------

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxldAJ53ue8Aw6l5hQ_a-dGljj4488ADs",
  authDomain: "db-frfinance.firebaseapp.com",
  projectId: "db-frfinance",
  storageBucket: "db-frfinance.firebasestorage.app",
  messagingSenderId: "573452159070",
  appId: "1:573452159070:web:f580369bd9c82164820ccf",
  measurementId: "G-S79XCE16V4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- LOCALSTORAGE (apenas vendas/relatórios) ----------

const STORAGE_VENDAS = "pfinance_vendas_v1";

// ---------- PRODUTOS (Firestore) ----------

async function carregarProdutosFirestore() {
  const produtos = [];
  const q = query(collection(db, "products"), orderBy("name"));
  const snap = await getDocs(q);
  snap.forEach(d => {
    const p = d.data();
    produtos.push({
      id: d.id,
      nome: p.name,
      preco: p.salePrice,
      estoque: p.stock
    });
  });
  return produtos;
}

async function renderizarTabelaProdutos() {
  const produtos = await carregarProdutosFirestore();
  const tbody = document.getElementById("tabela-produtos");
  tbody.innerHTML = "";

  produtos.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>R$ ${Number(p.preco).toFixed(2)}</td>
      <td>${p.estoque}</td>
      <td>
        <button onclick="editarProduto('${p.id}')">Editar</button>
        <button onclick="excluirProduto('${p.id}')">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  await preencherSelectProdutos();
}

async function salvarProduto(event) {
  event.preventDefault();

  const idHidden = document.getElementById("produto-id").value;
  const nome = document.getElementById("produto-nome").value.trim();
  const preco = parseFloat(document.getElementById("produto-preco").value);
  const estoque = parseInt(document.getElementById("produto-estoque").value, 10);

  if (!nome || isNaN(preco) || isNaN(estoque)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const dados = {
    name: nome,
    salePrice: preco,
    stock: estoque,
    createdAt: serverTimestamp()
  };

  if (idHidden === "") {
    await addDoc(collection(db, "products"), dados);
  } else {
    await setDoc(doc(db, "products", idHidden), dados, { merge: true });
  }

  limparFormularioProduto();
  await renderizarTabelaProdutos();
  alert("Produto salvo com sucesso!");
}

async function editarProduto(idDoc) {
  const d = await getDoc(doc(db, "products", idDoc));
  if (!d.exists()) return;

  const p = d.data();
  document.getElementById("produto-id").value = idDoc;
  document.getElementById("produto-nome").value = p.name;
  document.getElementById("produto-preco").value = p.salePrice;
  document.getElementById("produto-estoque").value = p.stock;
}

async function excluirProduto(idDoc) {
  if (!confirm("Excluir este produto?")) return;
  await deleteDoc(doc(db, "products", idDoc));
  await renderizarTabelaProdutos();
}

function limparFormularioProduto() {
  document.getElementById("produto-id").value = "";
  document.getElementById("produto-nome").value = "";
  document.getElementById("produto-preco").value = "";
  document.getElementById("produto-estoque").value = "";
}

async function preencherSelectProdutos() {
  const produtos = await carregarProdutosFirestore();
  const select = document.getElementById("venda-produto");
  if (!select) return;

  select.innerHTML = "";
  produtos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.nome} (R$ ${Number(p.preco).toFixed(2)})`;
    opt.dataset.price = p.preco;
    select.appendChild(opt);
  });
}

// ---------- VENDAS (itens em memória, vendas em localStorage) ----------

let itensVendaAtual = [];

function carregarVendas() {
  const json = localStorage.getItem(STORAGE_VENDAS);
  return json ? JSON.parse(json) : [];
}

function salvarVendas(lista) {
  localStorage.setItem(STORAGE_VENDAS, JSON.stringify(lista));
}

function adicionarItemVenda() {
  const select = document.getElementById("venda-produto");
  const idProduto = select.value;
  const qtd = parseInt(document.getElementById("venda-quantidade").value, 10);

  if (!idProduto || isNaN(qtd) || qtd <= 0) {
    alert("Selecione um produto e informe a quantidade.");
    return;
  }

  const preco = parseFloat(select.selectedOptions[0].dataset.price);

  itensVendaAtual.push({
    idProduto,
    preco,
    quantidade: qtd
  });

  renderizarItensVenda();
}

function renderizarItensVenda() {
  const tbody = document.getElementById("tabela-itens-venda");
  tbody.innerHTML = "";

  let total = 0;

  itensVendaAtual.forEach((item, index) => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.idProduto}</td>
      <td>${item.quantidade}</td>
      <td>R$ ${item.preco.toFixed(2)}</td>
      <td>R$ ${subtotal.toFixed(2)}</td>
      <td><button onclick="removerItemVenda(${index})">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("venda-total").textContent = total.toFixed(2);
}

function removerItemVenda(index) {
  itensVendaAtual.splice(index, 1);
  renderizarItensVenda();
}

async function finalizarVenda() {
  if (itensVendaAtual.length === 0) {
    alert("Nenhum item na venda.");
    return;
  }

  try {
    // Atualizar estoque no Firestore
    for (const item of itensVendaAtual) {
      const ref = doc(db, "products", item.idProduto);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;

      const dados = snap.data();
      const estoqueAtual = Number(dados.stock ?? 0);
      const novoEstoque = estoqueAtual - item.quantidade;
      await setDoc(ref, { stock: novoEstoque }, { merge: true });
    }

    // Registrar venda em localStorage
    const vendas = carregarVendas();
    const total = itensVendaAtual.reduce(
      (s, i) => s + i.preco * i.quantidade,
      0
    );

    const venda = {
      data: new Date().toISOString(),
      total,
      itens: itensVendaAtual
    };

    vendas.push(venda);
    salvarVendas(vendas);

    itensVendaAtual = [];
    renderizarItensVenda();
    await renderizarTabelaProdutos(); // recarrega estoques

    alert("Venda registrada com sucesso!");
  } catch (e) {
    console.error(e);
    alert("Erro ao atualizar estoque/venda.");
  }
}

// ---------- RELATÓRIOS (localStorage) ----------

function atualizarRelatorios() {
  const vendas = carregarVendas();
  const resumo = document.getElementById("resumo-relatorio");
  const lista = document.getElementById("lista-vendas");

  let totalGeral = 0;
  vendas.forEach(v => (totalGeral += v.total));

  resumo.textContent = `Total de vendas registradas: ${vendas.length} | Soma: R$ ${totalGeral.toFixed(2)}`;

  lista.innerHTML = "";
  vendas.forEach(v => {
    const li = document.createElement("li");
    const data = new Date(v.data);
    li.textContent = `${data.toLocaleString("pt-BR")} - R$ ${v.total.toFixed(
      2
    )}`;
    lista.appendChild(li);
  });
}

// ---------- NAVEGAÇÃO ENTRE TELAS ----------

function abrirTela(nome) {
  document.querySelectorAll(".tela").forEach(t => t.classList.add("oculto"));
  const tela = document.getElementById(`tela-${nome}`);
  if (tela) tela.classList.remove("oculto");

  if (nome === "produtos") {
    renderizarTabelaProdutos();
  } else if (nome === "vendas") {
    preencherSelectProdutos();
    itensVendaAtual = [];
    renderizarItensVenda();
  } else if (nome === "relatorios") {
    atualizarRelatorios();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  abrirTela("produtos");
});

// ---------- EXPOÇÃO GLOBAL (para os atributos onclick do HTML) ----------

window.salvarProduto = salvarProduto;
window.limparFormularioProduto = limparFormularioProduto;
window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;
window.adicionarItemVenda = adicionarItemVenda;
window.removerItemVenda = removerItemVenda;
window.finalizarVenda = finalizarVenda;
window.abrirTela = abrirTela;
