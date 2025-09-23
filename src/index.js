// Importar as bibliotecas necessárias
import express from "express";
import dotenv from "dotenv";
import prisma from "./db.js"; // Importar nossa conexão com o banco

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Criar aplicação Express
const app = express();

// Middleware para processar JSON nas requisições
app.use(express.json());

//Healthcheck
app.get("/", (_req, res) => res.json({ ok: true, service: "API 3º Bimestre" }));

//CREATE: POST /usuarios
app.post("/usuarios", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const novoUsuario = await prisma.user.create({
      data: { name, email, password }
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

//READ: GET /usuarios
app.get("/usuarios", async (_req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { id: "asc" }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// PUT /usuarios/:id - Atualiza um usuário
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const usuario = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { 
        name,
        email,
        password
      }
    });
    res.json(usuario);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// DELETE /usuarios/:id - Remove um usuário
app.delete("/usuarios/:id", async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: Number(req.params.id) }
    });
    res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

// POST /stores body: { name, userId }
app.post('/stores', async (req, res) => {
  try {
    const { name, userId } = req.body
    
    // Validação de entrada
    if (!name || !userId) {
      return res.status(400).json({ error: 'Nome da loja e ID do usuário são obrigatórios' })
    }

    const store = await prisma.store.create({
      data: { name, userId: Number(userId) },
      include: { user: true } // Retorna os dados da loja junto com o usuário
    })
    res.status(201).json(store)
  } catch (e) { 
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'Usuário não encontrado' })
    }
    res.status(400).json({ error: e.message }) 
  }
});

// GET /stores/:id -> retorna loja + user (dono) + produtos
app.get('/stores/:id', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true, products: true }
    })
    if (!store) return res.status(404).json({ error: 'Loja não encontrada' })
    res.json(store)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /stores/:id - Atualiza uma loja
app.put('/stores/:id', async (req, res) => {
  try {
    const { name, userId } = req.body
    const store = await prisma.store.update({
      where: { id: Number(req.params.id) },
      data: { 
        name, 
        userId: userId ? Number(userId) : undefined 
      }
    })
    res.json(store)
  } catch (e) { 
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Loja não encontrada' })
    }
    res.status(400).json({ error: e.message }) 
  }
})

// DELETE /stores/:id - Remove uma loja
app.delete('/stores/:id', async (req, res) => {
  try {
    await prisma.store.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(204).end()
  } catch (e) { 
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Loja não encontrada' })
    }
    res.status(400).json({ error: e.message }) 
  }
})

// POST /products body: { name, price, storeId }
app.post('/products', async (req, res) => {
  try {
    const { name, price, storeId } = req.body
    
    // Validação de entrada
    if (!name || !price || !storeId) {
      return res.status(400).json({ error: 'Nome do produto, preço e ID da loja são obrigatórios' })
    }

    const product = await prisma.product.create({
      data: { name, price: Number(price), storeId: Number(storeId) },
      include: { store: { include: { user: true } } } // Retorna o produto com os dados da loja e do dono
    })
    res.status(201).json(product)
  } catch (e) { 
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'Loja não encontrada' })
    }
    res.status(400).json({ error: e.message }) 
  }
});

// GET /products -> inclui a loja e o dono da loja
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { store: { include: { user: true } } }
    })
    res.json(products)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /products/:id - Atualiza um produto
app.put('/products/:id', async (req, res) => {
  try {
    const { name, price, storeId } = req.body
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { 
        name,
        price: price ? Number(price) : undefined,
        storeId: storeId ? Number(storeId) : undefined
      }
    })
    res.json(product)
  } catch (e) { 
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }
    res.status(400).json({ error: e.message }) 
  }
})

// DELETE /products/:id - Remove um produto
app.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(204).end()
  } catch (e) { 
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }
    res.status(400).json({ error: e.message }) 
  }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

//ROTA DE TESTE
app.get("/status", (req, res) => {
  res.json({ message: "API Online" });
});

