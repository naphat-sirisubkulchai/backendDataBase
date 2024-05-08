import { Prisma, PrismaClient,TRANSACTION_STATUS } from '../prisma/generated/client'
import express from 'express'
import cors from 'cors';

// Allow requests from specific origins
const app = express()
const prisma = new PrismaClient()
// Allow requests from specific origins
const corsOptions = {
  origin: ['database-gatang-and-gan-g.vercel.app','http://localhost:3000'],
  credentials: true // Enable CORS credentials
};

// app.use(cors());
app.use(cors(corsOptions));
app.use(express.json())
app.get("/", (req, res) => {
  res.send("Express on Vercel");
});
//////////////////////// user/////////////////////////////////////
app.get('/users', async (req, res) => {
  try {
    // Query all users from the database using Prisma
    const users = await prisma.user.findMany();

    // Send the users as a JSON response
    res.json(users);
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error retrieving users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/user/delete/:email', async (req, res) => {
    try {
      let { email } = req.params;
      email = email.toLowerCase(); // Convert email to lowercase
      
      const deleteUser = await prisma.user.delete({
        where: { email },
      });
  
      res.json(deleteUser);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
app.get('/user/:email', async (req, res) => {
try {
    const { email } = req.params;

    // Use Prisma to query the database
    const user = await prisma.user.findUnique({
    where: { email},
    }); 

    if (!user) {
    return res.status(404).json({ error: 'user not found' });
    }
    res.json(user);
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});
//////////////////////// product/////////////////////////////////////

app.get('/products/:productId', async (req, res) => {
    try {
      const productId = req.params.productId;
  
      // Use Prisma to query the database
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { Store: true, Category: true, orderItems: true }, // Include related entities
      });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      res.json(product);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.post('/products/post', async (req, res) => {
    try {
      const { name, slug, description, price, images, storeId, categoryId } = req.body;
  
      // Use Prisma to create a new product
      const newProduct = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          price,
          images,
          storeId,
          categoryId,
        },
      });
  
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/products/put/:id', async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, price, images, storeId, categoryId } = req.body;
  
    try {
      // Check if the product exists
      const existingProduct = await prisma.product.findUnique({
        where: {
          id: id,
        },
      });
  
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Update the product
      const updatedProduct = await prisma.product.update({
        where: {
          id: id,
        },
        data: {
          name,
          slug,
          description,
          price,
          images,
          storeId,
          categoryId,
        },
      });
  
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  // /search/products?searchString={searchString}&take={take}&skip={skip}&orderBy={orderBy}
  app.get('/search/products', async (req, res) => {
    const { searchString, skip, take, orderBy } = req.query;
  
    const where: Prisma.ProductWhereInput = searchString
      ? {
          OR: [
            { name: { contains: searchString.toString(), mode: 'insensitive' } },
            { description: { contains: searchString.toString(), mode: 'insensitive' } },
            { slug: { contains: searchString.toString(), mode: 'insensitive' }},
            // Add more fields for searching if needed
          ],
        }
      : {};
  
    const products = await prisma.product.findMany({
      where: {
        ...where,
      },
      take: Number(take) || undefined,
      skip: Number(skip) || undefined,
      orderBy: {
        updatedAt: orderBy as Prisma.SortOrder, 
      },
      include: {
        Store: true,
        Category: true,
      },
    });
  
    const totalCount = await prisma.product.count({
      where: {
        ...where,
      },
    });
  
    res.json({ totalCount, products });
  });

  app.delete('/products/delete/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Delete the product by ID
      const deletedProduct = await prisma.product.delete({
        where: {
          id: id,
        },
      });
  
      res.json({ message: 'Product deleted successfully', deletedProduct });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
//////////////////////// order/////////////////////////////////////
app.get('/orders/all', async (req, res) => {
    try {
      // Use Prisma to fetch orders
      const orders = await prisma.order.findMany({
        include: {
          User: true,
          orderItems: true,
        },
      });
  
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Define a route to handle POST requests to create orders
  app.post('/orders/post', async (req, res) => {
    try {
      // Extract data from request body
      const { totalPrice, token, status, userId, orderItems } = req.body;
  
      // Create the order in the database
      const newOrder = await prisma.order.create({
        data: {
          totalPrice,
          token,
          status,
          userId,
          orderItems: {
            create: orderItems.map((item: any) => ({
              productId: item.productId,
              storeId: item.storeId
            }))
          }
        },
        include: {
          orderItems: true // Include associated order items in the response
        }
      });
  
      // Respond with the newly created order
      res.json(newOrder);
    } catch (error) {
      // Handle errors
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'An error occurred while creating the order.' });
    }
  });
  
  app.get('/orders/:userId', async (req, res) => {
    try {
      // Extract order ID from request parameters
      const { userId } = req.params;
  
      // Fetch the order from the database using Prisma
      const order = await prisma.order.findMany({
        where: {
            userId: userId
        },
        include: {
          orderItems: true // Include associated order items in the response
        }
      });
  
      // Check if the order exists
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      // Respond with the fetched order
      res.json(order);
    } catch (error) {
      // Handle errors
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'An error occurred while fetching the order.' });
    }
  });
  app.put('/orders/:id/cancel', async (req, res) => {
    try {
      // Extract order ID from request parameters
      const { id } = req.params;
  
      // Fetch the order from the database
      const order = await prisma.order.findUnique({
        where: { id },
        include: { orderItems: true } // Include associated order items
      });
  
      // Check if the order exists
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }
  
      // Check if the order is already canceled
      if (order.status === 'CANCELED') {
        return res.status(400).json({ error: 'Order is already canceled.' });
      }
  
      // Update the order status to 'CANCELED'
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'CANCELED' }
      });
  
      // Respond with the updated order
      res.json(updatedOrder);
    } catch (error) {
      // Handle errors
      console.error('Error canceling order:', error);
      res.status(500).json({ error: 'An error occurred while canceling the order.' });
    }
  });
  

  //////////////////////// Order ITEM/////////////////////////////////////
  
  app.post('/order-items/post', async (req, res) => {
    try {
      const { orderId, productId, storeId } = req.body;
  
      // Use Prisma to create a new OrderItem
      const newOrderItem = await prisma.orderItem.create({
        data: {
          orderId,
          productId,
          storeId,
        },
      });
  
      res.status(201).json(newOrderItem);
    } catch (error) {
      console.error('Error creating order item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.put('/order-items/put/:id', async (req, res) => {
    try {
      // Extract order item ID from request parameters
      const { id } = req.params;
  
      // Extract data from request body
      const { orderId, productId, storeId } = req.body;
  
      // Update the order item in the database
      const updatedOrderItem = await prisma.orderItem.update({
        where: {
          id
        },
        data: {
          orderId,
          productId,
          storeId
        }
      });
  
      // Respond with the updated order item
      res.json(updatedOrderItem);
    } catch (error) {
      // Handle errors
      console.error('Error updating order item:', error);
      res.status(500).json({ error: 'An error occurred while updating the order item.' });
    }
  });
  app.delete('/order-items/delete/:id', async (req, res) => {
    try {
      // Extract order item ID from request parameters
      const { id } = req.params;
  
      // Delete the order item from the database
      await prisma.orderItem.delete({
        where: {
          id
        }
      });
  
      // Respond with success message
      res.json({ message: 'Order item deleted successfully.' });
    } catch (error) {
      // Handle errors
      console.error('Error deleting order item:', error);
      res.status(500).json({ error: 'An error occurred while deleting the order item.' });
    }
  });
  app.get('/order-items/:id', async (req, res) => {
    try {
      // Extract order item ID from request parameters
      const { id } = req.params;
  
      // Fetch the order item from the database using Prisma
      const orderItem = await prisma.orderItem.findUnique({
        where: {
          id
        }
      });
  
      // Check if the order item exists
      if (!orderItem) {
        return res.status(404).json({ error: 'Order item not found' });
      }
  
      // Respond with the fetched order item
      res.json(orderItem);
    } catch (error) {
      // Handle errors
      console.error('Error fetching order item:', error);
      res.status(500).json({ error: 'An error occurred while fetching the order item.' });
    }
  });
   //////////////////////// Categories/////////////////////////////////////
   app.post('/categories/post', async (req, res) => {
    try {
      const { slug, name } = req.body;
      const newCategory = await prisma.category.create({
        data: {
          slug,
          name
        }
      });
      res.json(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'An error occurred while creating the category.' });
    }
  });
  
  app.get('/categories/all', async (req, res) => {
    try {
      const categories = await prisma.category.findMany();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'An error occurred while fetching categories.' });
    }
  });
  app.get('/categories/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await prisma.category.findUnique({
        where: { slug }
      });
      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'An error occurred while fetching the category.' });
    }
  });
  app.put('/categories/put/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const { name } = req.body;
      const updatedCategory = await prisma.category.update({
        where: { slug },
        data: { name }
      });
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'An error occurred while updating the category.' });
    }
  });
  app.delete('/categories/delete/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      await prisma.category.delete({
        where: { slug }
      });
      res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'An error occurred while deleting the category.' });
    }
  });
  

app.get('/categories/:slug/products', async (req, res) => {
    try {
      const { slug } = req.params;
      const categoryWithProducts = await prisma.category.findUnique({
        where: { slug },
        include: { products: true }
      });
      if (!categoryWithProducts) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json(categoryWithProducts);
    } catch (error) {
      console.error('Error fetching category and its products:', error);
      res.status(500).json({ error: 'An error occurred while fetching category and its products.' });
    }
  });
   //////////////////////// Store/////////////////////////////////////
   app.post('/stores/post', async (req, res) => {
    try {
      const { name, description, userId } = req.body;
  
      // Ensure userId is a string
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid userId.' });
      }
  
      const newStore = await prisma.store.create({
        data: {
          name,
          description,
          userId
        }
      });
      res.json(newStore);
    } catch (error) {
      console.error('Error creating store:', error);
      res.status(500).json({ error: 'An error occurred while creating the store.' });
    }
  });
  
  // Get All Stores
  app.get('/stores/all', async (req, res) => {
    try {
      const stores = await prisma.store.findMany();
      res.json(stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({ error: 'An error occurred while fetching stores.' });
    }
  });
  
  // Get Store by ID
  app.get('/stores/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const store = await prisma.store.findUnique({
        where: { id }
      });
      if (!store) {
        return res.status(404).json({ error: 'Store not found.' });
      }
      res.json(store);
    } catch (error) {
      console.error('Error fetching store:', error);
      res.status(500).json({ error: 'An error occurred while fetching the store.' });
    }
  });

  app.get('/stores/userID/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Retrieve stores associated with the provided user ID
      const stores = await prisma.store.findMany({
        where: {
          userId
        }
      });
  
      res.json(stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({ error: 'An error occurred while fetching stores.' });
    }
  });
  
  // Update Store
  app.put('/stores/put/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const updatedStore = await prisma.store.update({
        where: { id },
        data: { name, description }
      });
      res.json(updatedStore);
    } catch (error) {
      console.error('Error updating store:', error);
      res.status(500).json({ error: 'An error occurred while updating the store.' });
    }
  });
  
  // Delete Store
  app.delete('/stores/delete/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.store.delete({
        where: { id }
      });
      res.json({ message: 'Store deleted successfully.' });
    } catch (error) {
      console.error('Error deleting store:', error);
      res.status(500).json({ error: 'An error occurred while deleting the store.' });
    }
  });
app.listen(3000, () => console.log("Server ready on port 5050 or http://localhost:3000."));

