// Zagon strežnika. env.js mora biti prvi import (glej komentar v env.js).
import './env.js';
import { app } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Backend teče na http://localhost:${PORT}`);
});
