
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
// import bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`The app is listening: http://localhost:${PORT}`);
});