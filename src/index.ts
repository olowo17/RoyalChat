import cloudinary from 'cloudinary';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from "compression";
import connectDb from './config/db';


dotenv.config({
    path: './.env',
  });

const app = express();

const PORT = 5000


app.use(cors({
    credentials: true,
    origin: '*',
}))

app.use(compression())

app.use(cookieParser())
app.use(helmet());

//connect to db
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
connectDb();

const server =

// initialize server
app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`);
  });
  
