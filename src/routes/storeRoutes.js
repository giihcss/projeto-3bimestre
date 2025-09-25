import express from "express";
import prisma from "../db.js";

const router = express.Router();

// POST /stores body: { name, userId }
router.post('/', async (req, res) => {
  try {
    const { name, userId } = req.body
    
    // Validação de entrada
    if (!name || !userId) {
      return res.status(400).json({ error: 'Nome da loja e ID do usuário são obrigatórios' })
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário já tem uma loja
    const existingStore = await prisma.store.findUnique({
      where: { userId: Number(userId) }
    });

    if (existingStore) {
      return res.status(400).json({ error: 'Este usuário já possui uma loja' });
    }

    const store = await prisma.store.create({
      data: { name, userId: Number(userId) },
      include: { user: true, products: true } // Retorna os dados da loja junto com o usuário e produtos
    })
    res.status(201).json(store)
  } catch (e) { 
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Este usuário já possui uma loja' })
    }
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'Usuário não encontrado' })
    }
    res.status(500).json({ error: 'Erro interno do servidor' }) 
  }
});

// GET /stores -> retorna todas as lojas com user (dono)
router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: { user: true, products: true },
      orderBy: { id: "asc" }
    })
    res.json(stores)
  } catch (e) { 
    res.status(400).json({ error: e.message }) 
  }
})

// GET /stores/:id -> retorna loja + user (dono) + produtos
router.get('/:id', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
    const { name, userId } = req.body
    
    // Criar objeto de dados apenas com campos não vazios
    const updateData = {};
    if (name !== undefined && name !== '') updateData.name = name;
    
    // Se userId for fornecido, verificar se não é o mesmo usuário atual
    if (userId !== undefined && userId !== '') {
      const currentStore = await prisma.store.findUnique({
        where: { id: Number(req.params.id) }
      });
      
      if (!currentStore) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }
      
      // Só atualizar userId se for diferente do atual
      if (Number(userId) !== currentStore.userId) {
        // Verificar se o novo userId já tem uma loja
        const existingStore = await prisma.store.findUnique({
          where: { userId: Number(userId) }
        });
        
        if (existingStore) {
          return res.status(400).json({ error: 'Este usuário já possui uma loja' });
        }
        
        updateData.userId = Number(userId);
      }
    }

    // Se não há dados para atualizar, retornar a loja atual
    if (Object.keys(updateData).length === 0) {
      const store = await prisma.store.findUnique({
        where: { id: Number(req.params.id) },
        include: { user: true, products: true }
      });
      return res.json(store);
    }

    const store = await prisma.store.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: { user: true, products: true }
    })
    res.json(store)
  } catch (e) { 
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Loja não encontrada' })
    }
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Este usuário já possui uma loja' })
    }
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'Usuário não encontrado' })
    }
    res.status(400).json({ error: e.message }) 
  }
})

// DELETE /stores/:id - Remove uma loja
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se a loja existe antes de deletar
    const existingStore = await prisma.store.findUnique({
      where: { id: Number(req.params.id) },
      include: { products: true }
    });

    if (!existingStore) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Deletar a loja (produtos serão deletados automaticamente pelo cascade)
    await prisma.store.delete({
      where: { id: Number(req.params.id) }
    })
    
    res.status(204).end()
  } catch (e) { 
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Loja não encontrada' })
    }
    res.status(500).json({ error: 'Erro ao deletar loja' }) 
  }
})

export default router;
