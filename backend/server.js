import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);

app.listen(PORT, () => {
  console.log(`LearnHub API running on http://localhost:${PORT}`);
});
