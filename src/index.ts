import compression from "compression";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import connectDb from './config/db';

import commentRoutes from './route/commentRoutes';
import postRoutes from './route/postRoutes';
import userRoutes from './route/userRoutes';


dotenv.config({
    path: './.env',
  });

const app = express();

const PORT = process.env.PORT || 6000


app.use(cors({credentials: true, origin: '*',}))
app.use(compression())
app.use(cookieParser())
app.use(helmet());


//connect to db
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
connectDb();



// Routes
app.get('/', (req: Request, res: Response) => {
  return res.send("welcome to Royalchat");
  
});

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comment', commentRoutes);


// initialize server
app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`);
  });
  