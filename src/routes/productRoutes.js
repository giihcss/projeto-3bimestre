import express from "express";
import prisma from "../db.js";

const router = express.Router();

// POST /products body: { name, price, storeId }
router.post('/', async (req, res) => {
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
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { store: { include: { user: true } } }
    })
    res.json(products)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /products/:id - Atualiza um produto
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

export default router;
